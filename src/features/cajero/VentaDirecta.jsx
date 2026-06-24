import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    CreditCard, Banknote, Smartphone, CheckCircle2,
    Loader2, ArrowLeft, Package, DollarSign, X,
    Barcode, TrendingUp, AlertCircle, Zap, User
} from 'lucide-react'

export default function VentaDirecta() {
    const queryClient = useQueryClient()
    const searchInputRef = useRef(null)
    const customerSearchRef = useRef(null)

    // Estados de búsqueda de productos
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [searchMode, setSearchMode] = useState('name')

    // Estados del carrito
    const [cartItems, setCartItems] = useState([])
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')

    // Estados del cliente
    const [customerName, setCustomerName] = useState('')
    const [customerDocument, setCustomerDocument] = useState('')
    const [customerSearch, setCustomerSearch] = useState('')
    const [customerDebouncedSearch, setCustomerDebouncedSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

    // Estado de pago
    const [amountPaid, setAmountPaid] = useState('')

    //  DEBOUNCE: Esperar 300ms antes de buscar productos
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 2) {
                setDebouncedSearch(searchTerm)
            } else {
                setDebouncedSearch('')
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    //  Detectar si es código de barras
    useEffect(() => {
        if (searchTerm && /^\d{6,}$/.test(searchTerm)) {
            setSearchMode('barcode')
        } else {
            setSearchMode('name')
        }
    }, [searchTerm])

    //  DEBOUNCE: Esperar 300ms antes de buscar clientes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (customerSearch.length >= 2) {
                setCustomerDebouncedSearch(customerSearch)
            } else {
                setCustomerDebouncedSearch('')
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [customerSearch])

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
                setShowCustomerDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Buscar productos con debounce
    const { data: products, isLoading: searching } = useQuery({
        queryKey: ['products-search', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                return []
            }

            try {
                console.log('🔍 Buscando productos:', debouncedSearch, '(modo:', searchMode, ')')
                const res = await cashierAPI.searchProducts(debouncedSearch)
                console.log('📦 Respuesta completa:', res.data)

                if (!res.data?.success) return []

                return res.data.data.map(product => ({
                    id: product.id,
                    name: product.name,
                    sku: product.sku || '',
                    price: product.price || 0,
                    stock: product.stock || 0,
                    barcode: product.barcode || '',
                    categoryName: product.categoryName || ''
                }))
            } catch (error) {
                console.error('❌ Error al buscar productos:', error)
                toast.error('Error al buscar productos')
                return []
            }
        },
        enabled: debouncedSearch.length >= 2,
        staleTime: 10000,
        retry: 1
    })

    // Buscar clientes
    const { data: customers, isLoading: searchingCustomers } = useQuery({
        queryKey: ['customers-search', customerDebouncedSearch],
        queryFn: async () => {
            if (!customerDebouncedSearch || customerDebouncedSearch.length < 2) {
                return []
            }

            try {
                console.log('👥 Buscando clientes:', customerDebouncedSearch)
                const res = await cashierAPI.searchCustomers(customerDebouncedSearch)
                console.log('📋 Clientes encontrados:', res.data)

                if (!res.data?.success) return []

                return res.data.data || []
            } catch (error) {
                console.error('❌ Error al buscar clientes:', error)
                return []
            }
        },
        enabled: customerDebouncedSearch.length >= 2,
        staleTime: 10000,
        retry: 1
    })

    // ✅ Auto-seleccionar si es código de barras y hay solo 1 resultado
    useEffect(() => {
        if (searchMode === 'barcode' && products && products.length === 1) {
            addToCart(products[0])
            setSearchTerm('')
            searchInputRef.current?.focus()
        }
    }, [products, searchMode])

    // Agregar al carrito
    const addToCart = (product) => {
        console.log('🛒 Agregando al carrito:', product)

        if (product.stock <= 0) {
            toast.error(`❌ Sin stock: ${product.name}`)
            return
        }

        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error(`⚠️ Stock máximo: ${product.stock} unidades disponibles`)
                    return prev
                }
                toast.success(`✅ ${product.name} (+1)`)
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            toast.success(`✅ ${product.name} agregado`)
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    // ✅ Agregar con Enter (primer resultado)
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && products && products.length > 0) {
            e.preventDefault()
            addToCart(products[0])
            setSearchTerm('')
            setTimeout(() => searchInputRef.current?.focus(), 100)
        } else if (e.key === 'Escape') {
            setSearchTerm('')
            searchInputRef.current?.focus()
        }
    }

    // Eliminar del carrito
    const removeFromCart = (productId) => {
        const item = cartItems.find(i => i.id === productId)
        setCartItems(prev => prev.filter(i => i.id !== productId))
        if (item) toast.info(`🗑️ ${item.name} eliminado`)
    }

    // Actualizar cantidad con validación de stock
    const updateQuantity = (productId, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = item.quantity + delta
                if (newQuantity < 1) return item
                if (newQuantity > item.stock) {
                    toast.error(`⚠️ Stock máximo: ${item.stock} unidades`)
                    return item
                }
                return { ...item, quantity: newQuantity }
            }
            return item
        }))
    }

    // ✅ Limpiar carrito
    const clearCart = () => {
        if (cartItems.length === 0) return
        if (!confirm('¿Seguro que deseas vaciar el carrito?')) return
        setCartItems([])
        setAmountPaid('')
        toast.info(' Carrito vaciado')
    }

    //  Calcular totales (CORREGIDO - Precios ya incluyen IGV)
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const igv = subtotal - (subtotal / 1.18) // IGV incluido en el precio
    const total = subtotal  // El total es el subtotal (ya incluye IGV)
    const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - total) : 0

    //  CORREGIDO: Usar documentNumber en lugar de document
    const handleSelectCustomer = (customer) => {
        console.log('👤 Cliente seleccionado:', customer)
        setSelectedCustomer(customer)
        setCustomerName(customer.name || '')
        setCustomerDocument(customer.documentNumber || '') 
        setCustomerSearch('')
        setShowCustomerDropdown(false)
        toast.success(` Cliente: ${customer.name}`)
    }

    // Limpiar cliente seleccionado
    const handleClearCustomer = () => {
        setSelectedCustomer(null)
        setCustomerName('')
        setCustomerDocument('')
        setCustomerSearch('')
        setShowCustomerDropdown(false)
    }

    //  Atajos de monto rápido
    const quickAmounts = [
        { label: 'Exacto', value: total },
        { label: 'S/ 50', value: 50 },
        { label: 'S/ 100', value: 100 },
        { label: 'S/ 200', value: 200 }
    ]

    // Procesar venta
    const saleMutation = useMutation({
        mutationFn: (data) => cashierAPI.processDirectSale(data),
        onSuccess: (res) => {
            if (res.data?.success) {
                const invoiceNumber = res.data.data.quoteNumber || res.data.data.invoiceNumber
                toast.success('✅ Venta procesada correctamente', {
                    description: `Factura: ${invoiceNumber} - Total: S/ ${total.toFixed(2)}`
                })
                // Reset completo
                setCartItems([])
                setCustomerName('')
                setCustomerDocument('')
                setAmountPaid('')
                setSearchTerm('')
                setSelectedCustomer(null)
                queryClient.invalidateQueries(['cajero-dashboard'])
                queryClient.invalidateQueries(['products-search'])
                searchInputRef.current?.focus()
            } else {
                toast.error(res.data?.message || 'Error al procesar venta')
            }
        },
        onError: (err) => {
            console.error('❌ Error:', err)
            toast.error(err.response?.data?.message || 'Error al procesar venta')
        }
    })

    const handleProcessSale = () => {
        if (cartItems.length === 0) {
            toast.error('⚠️ Agrega productos al carrito')
            return
        }
        if (!customerName.trim()) {
            toast.error('⚠️ Ingresa el nombre del cliente')
            return
        }

        const paid = parseFloat(amountPaid)
        if (isNaN(paid) || paid < total) {
            toast.error(`⚠️ Monto insuficiente. Total: S/ ${total.toFixed(2)}`)
            return
        }

        // Confirmación para ventas grandes
        if (total > 1000) {
            if (!confirm(`¿Confirmas la venta por S/ ${total.toFixed(2)}?`)) return
        }

        saleMutation.mutate({
            customerName: customerName.trim(),
            customerDocument: customerDocument.trim() || null,
            paymentMethod,
            items: cartItems.map(item => ({
                productId: item.id,
                productName: item.name,
                productSku: item.sku,
                quantity: item.quantity,
                unitPrice: item.price,
                subtotal: item.price * item.quantity
            })),
            amountPaid: paid
        })
    }

    // ✅ Indicador visual de stock
    const getStockBadge = (stock) => {
        if (stock <= 0) return <Badge variant="destructive">Sin stock</Badge>
        if (stock <= 5) return <Badge className="bg-orange-500">Bajo ({stock})</Badge>
        if (stock <= 15) return <Badge className="bg-yellow-500">Medio ({stock})</Badge>
        return <Badge className="bg-green-500">Disponible ({stock})</Badge>
    }

    const paymentMethods = [
        { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
        { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
        { value: 'YAPE', label: 'Yape', icon: Smartphone },
        { value: 'PLIN', label: 'Plin', icon: Smartphone },
        { value: 'TRANSFERENCIA', label: 'Transferencia', icon: Banknote }
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => window.history.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Zap className="w-7 h-7 text-yellow-500" />
                                Venta Directa
                            </h1>
                            <p className="text-muted-foreground">
                                Realiza ventas rápidamente desde caja
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-sm">
                            💡 Tip: Escanea o escribe código de barras
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Panel Izquierdo - Buscar Productos y Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                Buscar Productos
                                {searchMode === 'barcode' && (
                                    <Badge className="bg-purple-500 ml-2">
                                        <Barcode className="w-3 h-3 mr-1" />
                                        Código de barras
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Buscador de productos */}
                            <div className="relative">
                                {searchMode === 'barcode' ? (
                                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                                ) : (
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                )}
                                <Input
                                    ref={searchInputRef}
                                    placeholder={searchMode === 'barcode'
                                        ? "🔍 Escaneando código de barras..."
                                        : "Buscar por nombre, SKU o código de barras..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className={`pl-10 h-12 text-base ${searchMode === 'barcode' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : ''
                                        }`}
                                    autoFocus
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                        onClick={() => {
                                            setSearchTerm('')
                                            searchInputRef.current?.focus()
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Info de búsqueda */}
                            {searchTerm.length > 0 && searchTerm.length < 2 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200">
                                    <AlertCircle className="w-4 h-4 text-blue-500" />
                                    Escribe al menos 2 caracteres para buscar
                                </div>
                            )}

                            {/* Loading */}
                            {searching && (
                                <div className="flex items-center justify-center py-6 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span className="text-muted-foreground">Buscando productos...</span>
                                </div>
                            )}

                            {/* Resultados de búsqueda */}
                            {!searching && products && products.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {products.length} producto{products.length > 1 ? 's' : ''} encontrado{products.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            💡 Click o Enter para agregar
                                        </p>
                                    </div>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                        {products.map(product => {
                                            const isInCart = cartItems.some(item => item.id === product.id)
                                            const cartQuantity = cartItems.find(item => item.id === product.id)?.quantity || 0

                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => addToCart(product)}
                                                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${product.stock <= 0
                                                            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200'
                                                            : isInCart
                                                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20 hover:border-green-600'
                                                                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold truncate">
                                                                    {product.name}
                                                                </p>
                                                                {isInCart && (
                                                                    <Badge className="bg-green-500 text-xs">
                                                                        ×{cartQuantity}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                                {product.sku && (
                                                                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                                        SKU: {product.sku}
                                                                    </span>
                                                                )}
                                                                {product.categoryName && (
                                                                    <span>{product.categoryName}</span>
                                                                )}
                                                            </div>
                                                            <div className="mt-2">
                                                                {getStockBadge(product.stock)}
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end gap-2">
                                                            <p className="font-bold text-green-600 text-xl">
                                                                S/ {product.price?.toFixed(2)}
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant={isInCart ? "default" : "outline"}
                                                                disabled={product.stock <= 0}
                                                                className={isInCart ? 'bg-green-600 hover:bg-green-700' : ''}
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" />
                                                                {isInCart ? 'Agregar más' : 'Agregar'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sin resultados */}
                            {!searching && products && products.length === 0 && debouncedSearch.length >= 2 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">No se encontraron productos</p>
                                    <p className="text-sm">Intenta con otro término de búsqueda</p>
                                </div>
                            )}

                            {/* Estado inicial */}
                            {!searching && (!products || products.length === 0) && debouncedSearch.length < 2 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Escribe para buscar productos</p>
                                    <p className="text-xs mt-1">Nombre, SKU o código de barras</p>
                                </div>
                            )}

                            {/* Datos del cliente - CON BÚSQUEDA */}
                            <div className="pt-4 border-t space-y-3" ref={customerSearchRef}>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Datos del Cliente
                                    {selectedCustomer && (
                                        <Badge className="bg-green-500 ml-2">
                                            Seleccionado
                                        </Badge>
                                    )}
                                </h3>

                                {/* Buscador de clientes */}
                                <div className="space-y-2 relative">
                                    <Label>Buscar Cliente</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Buscar por nombre, DNI o RUC..."
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(e.target.value)
                                                setShowCustomerDropdown(true)
                                            }}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            className="pl-10"
                                        />
                                        {customerSearch && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                                onClick={() => {
                                                    setCustomerSearch('')
                                                    setShowCustomerDropdown(false)
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Dropdown de clientes */}
                                    {showCustomerDropdown && (customerDebouncedSearch.length >= 2 || customers?.length > 0) && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                            {searchingCustomers ? (
                                                <div className="flex items-center justify-center py-4 gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    <span className="text-sm text-muted-foreground">Buscando clientes...</span>
                                                </div>
                                            ) : customers && customers.length > 0 ? (
                                                <div className="py-2">
                                                    {customers.map((customer, index) => (
                                                        <button
                                                            key={customer.id || index}
                                                            onClick={() => handleSelectCustomer(customer)}
                                                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm">
                                                                        {customer.name || customer.customerName}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {customer.document || customer.customerDocument || 'Sin documento'}
                                                                    </p>
                                                                </div>
                                                                <User className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-sm text-muted-foreground">
                                                    No se encontraron clientes
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Cliente seleccionado */}
                                {selectedCustomer && (
                                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-500 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-green-900 dark:text-green-200">
                                                    {selectedCustomer.name || selectedCustomer.customerName}
                                                </p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    {selectedCustomer.document || selectedCustomer.customerDocument || 'Sin documento'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearCustomer}
                                                className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Campos manuales (opcionales si no hay cliente seleccionado) */}
                                {!selectedCustomer && (
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground text-center">
                                            O ingresa manualmente los datos del cliente
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nombre del Cliente *</Label>
                                            <Input
                                                placeholder="Nombre completo"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Documento (Opcional)</Label>
                                            <Input
                                                placeholder="DNI, RUC, etc."
                                                value={customerDocument}
                                                onChange={(e) => setCustomerDocument(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Panel Derecho - Carrito y Pago */}
                    <Card className="flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Carrito de Compra
                                    {cartItems.length > 0 && (
                                        <Badge className="bg-blue-500">
                                            {cartItems.reduce((sum, i) => sum + i.quantity, 0)} items
                                        </Badge>
                                    )}
                                </CardTitle>
                                {cartItems.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearCart}
                                        className="text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Vaciar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col">
                            {/* Items del carrito */}
                            {cartItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground flex-1 flex flex-col items-center justify-center">
                                    <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">Carrito vacío</p>
                                    <p className="text-sm mt-1">Busca y agrega productos para comenzar</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="p-3 border rounded-lg bg-white dark:bg-gray-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{item.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            S/ {item.price.toFixed(2)} c/u
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            disabled={item.quantity <= 1}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="font-bold w-10 text-center text-lg">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            disabled={item.quantity >= item.stock}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <p className="font-bold text-green-600 text-lg">
                                                        S/ {(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totales */}
                                    <div className="border-t pt-4 space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Productos:</span>
                                            <span>{cartItems.reduce((sum, i) => sum + i.quantity, 0)} unidades</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span>S/ {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">IGV (incluido):</span>
                                            <span>S/ {igv.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-2xl font-bold border-t pt-2">
                                            <span>TOTAL:</span>
                                            <span className="text-green-600">S/ {total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Método de pago */}
                                    <div className="space-y-3">
                                        <Label>Método de Pago</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {paymentMethods.map(pm => {
                                                const Icon = pm.icon
                                                return (
                                                    <Button
                                                        key={pm.value}
                                                        type="button"
                                                        variant={paymentMethod === pm.value ? 'default' : 'outline'}
                                                        onClick={() => setPaymentMethod(pm.value)}
                                                        className="justify-start"
                                                    >
                                                        <Icon className="w-4 h-4 mr-2" />
                                                        {pm.label}
                                                    </Button>
                                                )
                                            })}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Monto Recibido (S/)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(e.target.value)}
                                                className="h-12 text-lg font-bold"
                                                placeholder="0.00"
                                            />

                                            {/* Botones de monto rápido */}
                                            <div className="flex gap-2 flex-wrap">
                                                {quickAmounts.map(qa => (
                                                    <Button
                                                        key={qa.label}
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setAmountPaid(qa.value.toString())}
                                                        className="flex-1"
                                                    >
                                                        {qa.label}
                                                    </Button>
                                                ))}
                                            </div>

                                            {change > 0 && (
                                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-2 border-green-500">
                                                    <p className="text-sm text-green-800 dark:text-green-200">
                                                        💵 Cambio a devolver: <strong className="text-lg">S/ {change.toFixed(2)}</strong>
                                                    </p>
                                                </div>
                                            )}

                                            {amountPaid && parseFloat(amountPaid) < total && (
                                                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-500">
                                                    <p className="text-sm text-red-800 dark:text-red-200">
                                                        ⚠️ Falta: <strong>S/ {(total - parseFloat(amountPaid)).toFixed(2)}</strong>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={handleProcessSale}
                                            disabled={saleMutation.isPending || cartItems.length === 0}
                                            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                                        >
                                            {saleMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Procesando venta...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                                    Procesar Venta - S/ {total.toFixed(2)}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}