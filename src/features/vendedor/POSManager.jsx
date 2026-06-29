import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI, quoteAPI, customerAPI, getImageUrl } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Package, Receipt, CheckCircle2, Loader2, X, Lock, User, Star, Clock, Image as ImageIcon } from 'lucide-react'

export default function POSManager() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('new')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProducts, setSelectedProducts] = useState([])
    const [customerName, setCustomerName] = useState('')
    const [customerDocument, setCustomerDocument] = useState('')
    const [quoteNumber, setQuoteNumber] = useState('')
    const [searchedQuote, setSearchedQuote] = useState(null)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [lastQuote, setLastQuote] = useState(null)
    const [blockedProducts, setBlockedProducts] = useState({})

    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [customerSearch, setCustomerSearch] = useState('')
    const [discountType, setDiscountType] = useState('NONE')
    const [discountValue, setDiscountValue] = useState(0)
    const [showCustomerSearch, setShowCustomerSearch] = useState(false)

    // 🔍 Buscar productos
    const { data: products, isLoading } = useQuery({
        queryKey: ['pos-products', searchTerm],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.products.list({ search: searchTerm || undefined })
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    const { data: frequentCustomers } = useQuery({
        queryKey: ['frequent-customers'],
        queryFn: async () => {
            try {
                const res = await customerAPI.getFrequent()
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    const { data: searchedCustomers } = useQuery({
        queryKey: ['search-customers', customerSearch],
        queryFn: async () => {
            if (!customerSearch || customerSearch.length < 2) return []
            try {
                const res = await customerAPI.search(customerSearch)
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    // ✅ useEffect para verificar bloqueos cada 30 segundos
    useEffect(() => {
        const checkBlockedProducts = async () => {
            if (!products || products.length === 0) return

            const blocked = {}

            for (const product of products) {
                try {
                    const res = await quoteAPI.getProductAvailability(product.id)
                    if (res.data?.success) {
                        const data = res.data.data
                        console.log(`📦 Producto ${product.name}:`, data)

                        if (data.blockedQuantity > 0) {
                            blocked[product.id] = {
                                totalStock: data.totalStock,
                                blockedQuantity: data.blockedQuantity,
                                availableStock: data.availableStock,
                                isBlocked: data.isBlocked,
                                isAvailable: data.isAvailable,
                                blockedUntil: data.blockedUntil
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error verificando bloqueo de ${product.name}:`, error)
                }
            }

            setBlockedProducts(blocked)
        }

        checkBlockedProducts()
        const interval = setInterval(checkBlockedProducts, 30000)
        return () => clearInterval(interval)
    }, [products])

    // ✅ Función para obtener stock disponible
    const getAvailableStock = (product) => {
        const blockInfo = blockedProducts[product.id]
        if (blockInfo) {
            return blockInfo.availableStock
        }
        return product.stock || 0
    }

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer)
        setCustomerName(customer.name)
        setCustomerDocument(customer.documentNumber || '')
        setShowCustomerSearch(false)
        setCustomerSearch('')
        toast.success(`Cliente seleccionado: ${customer.name}`)
    }

    const handleClearCustomer = () => {
        setSelectedCustomer(null)
        setCustomerName('')
        setCustomerDocument('')
    }

    const createQuoteMutation = useMutation({
        mutationFn: (data) => {
            console.log('🚀 Llamando a API:', data)
            return quoteAPI.create(data)
        },
        onSuccess: (response) => {
            console.log('✅ Respuesta del backend:', response)
            const apiData = response.data
            if (apiData?.success) {
                const quote = apiData.data

                const blockedUntil = quote.blockedUntil ? new Date(quote.blockedUntil) : null
                const minutes = blockedUntil ?
                    Math.floor((blockedUntil - new Date()) / 60000) : 20

                toast.success(`✅ Cotización ${quote.quoteNumber} creada`, {
                    description: `Productos bloqueados por ${minutes} minutos`,
                    duration: 5000
                })

                setLastQuote(quote)
                setSelectedProducts([])
                setCustomerName('')
                setCustomerDocument('')
                setSelectedCustomer(null)
                setDiscountType('NONE')
                setDiscountValue(0)
                setIsCheckoutOpen(false)

                queryClient.invalidateQueries(['pos-products'])
                queryClient.invalidateQueries(['all-quotes'])
            } else {
                toast.error(apiData?.message || 'Error al crear cotización')
            }
        },
        onError: (err) => {
            console.error('❌ Error completo:', err)
            toast.error(err.response?.data?.message || 'Error al crear cotización')
        }
    })

    const searchQuoteMutation = useMutation({
        mutationFn: (number) => quoteAPI.getByNumber(number),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                setSearchedQuote(apiData.data)
            }
        },
        onError: () => {
            toast.error('Cotización no encontrada')
            setSearchedQuote(null)
        }
    })

    const addProduct = (product) => {
        const availableStock = getAvailableStock(product)

        if (availableStock <= 0) {
            const blockInfo = blockedProducts[product.id]
            if (blockInfo && blockInfo.blockedQuantity > 0) {
                toast.error(`🔒 ${product.name} sin stock disponible`, {
                    description: `${blockInfo.blockedQuantity} unidades bloqueadas temporalmente`
                })
            } else {
                toast.error(`❌ ${product.name} sin stock`)
            }
            return
        }

        const exists = selectedProducts.find(p => p.id === product.id)
        const currentQty = exists ? exists.quantity : 0

        if (currentQty + 1 > availableStock) {
            const blockInfo = blockedProducts[product.id]
            const blockedMsg = blockInfo ? ` (${blockInfo.blockedQuantity} bloqueadas)` : ''
            toast.warning(`⚠️ Solo hay ${availableStock} unidades disponibles${blockedMsg}`, {
                description: `Total en almacén: ${product.stock}`
            })
            return
        }

        if (exists) {
            setSelectedProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
            ))
        } else {
            setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }])
        }
    }

    const removeProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId))
    }

    const handleCreateQuote = async () => {
        if (selectedProducts.length === 0) {
            toast.error('Seleccione al menos un producto')
            return
        }
        if (!customerName.trim()) {
            toast.error('Ingrese el nombre del cliente')
            return
        }

        const items = selectedProducts.map(p => ({
            productId: p.id,
            productName: p.name,
            productSku: p.sku || '',
            quantity: parseInt(p.quantity) || 1,
            unitPrice: parseFloat(p.price) || 0
        }))

        const payload = {
            customerName: customerName.trim(),
            customerDocument: customerDocument.trim() || null,
            customerId: selectedCustomer?.id || null,
            sellerName: 'Vendedor POS',
            notes: '',
            discountType: discountType,
            discountValue: discountValue,
            items: items
        }

        console.log('📝 Enviando cotización al backend:', payload)

        try {
            await createQuoteMutation.mutateAsync(payload)
        } catch (error) {
            console.error('❌ Error detallado:', error)
            toast.error('Error al crear cotización. Verifique la consola.')
        }
    }

    const handleSearchQuote = () => {
        if (!quoteNumber.trim()) {
            toast.error('Ingrese número de cotización')
            return
        }
        searchQuoteMutation.mutate(quoteNumber.trim())
    }

    const subtotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    const discountAmount = discountType === 'PERCENT'
        ? subtotal * (discountValue / 100)
        : discountType === 'FIXED'
            ? discountValue
            : 0
    const total = Math.max(0, subtotal - discountAmount)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {activeTab === 'new' ? 'Nueva Cotización' : 'Buscar Cotización'}
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={activeTab === 'new' ? 'default' : 'outline'}
                                onClick={() => {
                                    setActiveTab('new')
                                    setSearchedQuote(null)
                                    setQuoteNumber('')
                                }}
                                className="flex items-center gap-2"
                            >
                                <Receipt className="w-4 h-4" />
                                Nueva
                            </Button>
                            <Button
                                variant={activeTab === 'search' ? 'default' : 'outline'}
                                onClick={() => {
                                    setActiveTab('search')
                                    setSelectedProducts([])
                                }}
                                className="flex items-center gap-2"
                            >
                                <Search className="w-4 h-4" />
                                Buscar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {activeTab === 'new' && (
                    <div className="space-y-6">
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar producto por nombre, SKU o código de barras..."
                                className="pl-12 h-12 text-base shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : !products || products.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No se encontraron productos</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {products.map(product => {
                                    const blockInfo = blockedProducts[product.id]
                                    const availableStock = getAvailableStock(product)
                                    const isBlocked = blockInfo && blockInfo.blockedQuantity > 0

                                    return (
                                        <Card
                                            key={product.id}
                                            className={`cursor-pointer transition-all hover:shadow-lg relative ${availableStock > 0
                                                ? 'hover:border-blue-300 hover:-translate-y-1'
                                                : 'opacity-50 cursor-not-allowed'
                                                }`}
                                            onClick={() => availableStock > 0 && addProduct(product)}
                                        >
                                            <CardContent className="p-4 flex flex-col items-center text-center">
                                                {/* ✅ IMAGEN DEL PRODUCTO */}
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 relative">
                                                    {product.imagePath ? (
                                                        <img
                                                            src={getImageUrl(product.imagePath)}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'
                                                                e.target.nextSibling.style.display = 'flex'
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full flex items-center justify-center ${product.imagePath ? 'hidden' : ''}`}>
                                                        <Package className="w-8 h-8 text-blue-600" />
                                                    </div>
                                                    {isBlocked && (
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                                                            <Lock className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                <h3 className="font-semibold text-sm line-clamp-2 mb-1 h-10">
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mb-2">
                                                    {product.sku}
                                                </p>
                                                <p className="font-bold text-lg text-green-600 mb-2">
                                                    S/ {parseFloat(product.price).toFixed(2)}
                                                </p>

                                                {isBlocked ? (
                                                    <div className="space-y-1 w-full">
                                                        <Badge className="bg-green-600 text-xs w-full">
                                                            ✅ Disponible: {availableStock}
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] bg-orange-100 text-orange-800 w-full border border-orange-300"
                                                        >
                                                            🔒 Bloqueadas: {blockInfo.blockedQuantity}
                                                        </Badge>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Total: {product.stock}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <Badge variant={availableStock > 0 ? "default" : "destructive"}>
                                                        Stock: {availableStock}
                                                    </Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {selectedProducts.length > 0 && (
                            <Card className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl shadow-2xl border-2 border-blue-200 z-20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="w-5 h-5 text-blue-600" />
                                            <span className="font-semibold">
                                                {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} productos
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Total</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                S/ {total.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto space-y-2 mb-3 border-t pt-3">
                                        {selectedProducts.map(product => (
                                            <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                                                    {/* ✅ Miniatura de imagen en lista */}
                                                    {product.imagePath ? (
                                                        <img
                                                            src={getImageUrl(product.imagePath)}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'
                                                                e.target.nextSibling.style.display = 'flex'
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${product.imagePath ? 'hidden' : ''}`}>
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {product.quantity} × S/ {product.price.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-500 flex-shrink-0"
                                                    onClick={() => removeProduct(product.id)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        className="w-full h-12 text-base font-semibold"
                                        onClick={() => setIsCheckoutOpen(true)}
                                    >
                                        <Receipt className="w-5 h-5 mr-2" />
                                        Generar Cotización
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="text-center mb-6">
                                    <Search className="w-16 h-16 mx-auto mb-3 text-blue-600 opacity-50" />
                                    <h2 className="text-2xl font-bold mb-2">Buscar Cotización</h2>
                                    <p className="text-muted-foreground">
                                        Ingrese el número de cotización para buscar
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ej: Q-1718668800000"
                                        value={quoteNumber}
                                        onChange={(e) => setQuoteNumber(e.target.value)}
                                        className="h-12 text-base"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchQuote()}
                                    />
                                    <Button
                                        onClick={handleSearchQuote}
                                        disabled={searchQuoteMutation.isPending}
                                        className="h-12 px-8"
                                    >
                                        {searchQuoteMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {searchedQuote && (
                            <Card className="border-2 border-blue-200">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Receipt className="w-6 h-6" />
                                                {searchedQuote.quoteNumber}
                                            </h3>
                                            <p className="text-muted-foreground mt-1">
                                                Cliente: {searchedQuote.customerName}
                                            </p>
                                        </div>
                                        <Badge className={searchedQuote.status === 'PENDIENTE' ? 'bg-orange-500' : 'bg-green-600'}>
                                            {searchedQuote.status}
                                        </Badge>
                                    </div>

                                    <div className="border-t pt-4 space-y-2">
                                        {searchedQuote.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{item.quantity} × {item.productName}</span>
                                                <span className="font-medium">S/ {item.subtotal.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total:</span>
                                            <span className="text-green-600">S/ {searchedQuote.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-2xl" aria-describedby="checkout-dialog-description">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Generar Cotización
                        </DialogTitle>
                        <DialogDescription id="checkout-dialog-description">
                            Complete los datos del cliente y aplique descuentos si corresponde
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cliente *</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Nombre del cliente"
                                        className="pr-10"
                                    />
                                    {selectedCustomer && (
                                        <button
                                            onClick={handleClearCustomer}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                                >
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>

                            {frequentCustomers && frequentCustomers.length > 0 && !showCustomerSearch && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-2">Clientes frecuentes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {frequentCustomers.slice(0, 5).map(customer => (
                                            <Button
                                                key={customer.id}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSelectCustomer(customer)}
                                                className="text-xs"
                                            >
                                                <Star className="w-3 h-3 mr-1 text-yellow-500" />
                                                {customer.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showCustomerSearch && (
                                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                                    <Input
                                        placeholder="Buscar cliente por nombre, documento o teléfono..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="mb-2"
                                        autoFocus
                                    />
                                    {searchedCustomers && searchedCustomers.length > 0 ? (
                                        <div className="space-y-1">
                                            {searchedCustomers.map(customer => (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => handleSelectCustomer(customer)}
                                                    className="p-2 hover:bg-white cursor-pointer rounded border border-transparent hover:border-blue-300"
                                                >
                                                    <p className="font-medium text-sm">{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {customer.documentType}: {customer.documentNumber} | {customer.phone}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            {customerSearch.length < 2 ? 'Escriba al menos 2 caracteres' : 'No se encontraron clientes'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Descuento</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant={discountType === 'NONE' ? 'default' : 'outline'}
                                    onClick={() => { setDiscountType('NONE'); setDiscountValue(0) }}
                                >
                                    Sin descuento
                                </Button>
                                <Button
                                    type="button"
                                    variant={discountType === 'PERCENT' ? 'default' : 'outline'}
                                    onClick={() => setDiscountType('PERCENT')}
                                >
                                    Porcentaje %
                                </Button>
                                <Button
                                    type="button"
                                    variant={discountType === 'FIXED' ? 'default' : 'outline'}
                                    onClick={() => setDiscountType('FIXED')}
                                >
                                    Monto fijo S/
                                </Button>
                            </div>
                            {discountType !== 'NONE' && (
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                    placeholder={discountType === 'PERCENT' ? 'Ej: 10' : 'Ej: 5.00'}
                                />
                            )}
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>S/ {subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Descuento {discountType === 'PERCENT' ? `(${discountValue}%)` : ''}:</span>
                                    <span>- S/ {discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span className="text-blue-600">S/ {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>DNI/RUC (Opcional)</Label>
                            <Input
                                value={customerDocument}
                                onChange={(e) => setCustomerDocument(e.target.value)}
                                placeholder="Ej: 12345678"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateQuote} disabled={createQuoteMutation.isPending}>
                            {createQuoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
                            Generar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!lastQuote} onOpenChange={() => setLastQuote(null)}>
                <DialogContent className="max-w-md text-center" aria-describedby="success-dialog-description">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle2 className="w-8 h-8" />
                            Cotización Creada
                        </DialogTitle>
                        <DialogDescription id="success-dialog-description" className="sr-only">
                            La cotización se creó exitosamente con número {lastQuote?.quoteNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                            <p className="text-sm text-muted-foreground mb-2">Número de Cotización</p>
                            <p className="text-4xl font-bold text-green-700 mb-3">
                                {lastQuote?.quoteNumber}
                            </p>
                            <p className="text-2xl font-semibold text-green-600">
                                S/ {lastQuote?.total.toFixed(2)}
                            </p>
                            {lastQuote?.isBlocked && (
                                <div className="mt-3 p-2 bg-orange-100 rounded border border-orange-300">
                                    <p className="text-sm text-orange-800 font-medium flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4" />
                                         Productos bloqueados por 20 minutos
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium">Cliente: {lastQuote?.customerName}</p>
                            <p className="mt-2">Indique al cliente que pase a caja con este número</p>
                        </div>
                    </div>
                    <Button onClick={() => setLastQuote(null)} className="w-full">
                        Cerrar
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}