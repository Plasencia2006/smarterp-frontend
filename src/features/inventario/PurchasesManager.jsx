import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ShoppingCart, Plus, Search, Eye, Loader2, CheckCircle2, Clock, XCircle, Printer } from 'lucide-react'

export default function PurchasesManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedPurchase, setSelectedPurchase] = useState(null)

    const [formData, setFormData] = useState({
        supplierId: '',
        items: [{ productId: '', quantity: 1, unitCost: 0 }]
    })

    // ✅ QUERY 1: Órdenes de compra
    const { data: purchases, isLoading: isLoadingPurchases } = useQuery({
        queryKey: ['inventory-purchases', searchTerm],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.purchases.list({ search: searchTerm })
                const apiData = res.data
                if (apiData?.success && Array.isArray(apiData.data)) {
                    return apiData.data
                }
                return []
            } catch (error) {
                console.error('Error cargando órdenes:', error)
                return []
            }
        }
    })

    // ✅ QUERY 2: Proveedores
    const { data: suppliersForPurchase } = useQuery({
        queryKey: ['inventory-suppliers-for-purchase'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.suppliers.list()
                const apiData = res.data
                if (apiData?.success && Array.isArray(apiData.data)) {
                    return apiData.data
                }
                return []
            } catch (error) {
                console.error('Error cargando proveedores:', error)
                return []
            }
        }
    })

    // ✅ QUERY 3: Productos
    const { data: productsForPurchase } = useQuery({
        queryKey: ['inventory-products-for-purchase'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.products.list()
                const apiData = res.data
                if (apiData?.success && Array.isArray(apiData.data)) {
                    return apiData.data
                }
                return []
            } catch (error) {
                console.error('Error cargando productos:', error)
                return []
            }
        }
    })

    // ✅ MUTACIÓN: Crear orden
    const createMutation = useMutation({
        mutationFn: (data) => inventoryAPI.purchases.create(data),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Orden de compra creada')
                queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] })
                setIsCreateOpen(false)
                setFormData({ supplierId: '', items: [{ productId: '', quantity: 1, unitCost: 0 }] })
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al crear')
    })

    // ✅ MUTACIÓN: Recibir mercadería
    const receiveMutation = useMutation({
        mutationFn: (orderId) => inventoryAPI.purchases.receive(orderId),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('🚚 ¡Mercancía recibida! Stock actualizado automáticamente')
                queryClient.invalidateQueries(['inventory-purchases'])
                queryClient.invalidateQueries(['inventory-stock'])
                queryClient.invalidateQueries(['stock-movements'])
                setIsDetailOpen(false)
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al recibir mercancía')
        }
    })

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1, unitCost: 0 }]
        })
    }

    const removeItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        })
    }

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items]
        newItems[index][field] = value
        setFormData({ ...formData, items: newItems })
    }

    // ✅ FUNCIÓN PARA IMPRIMIR ORDEN
    const handlePrint = (order) => {
        const printWindow = window.open('', '_blank')

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Orden de Compra #${order.orderNumber || order.id}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #007bff;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #007bff;
                        margin: 0;
                    }
                    .info {
                        margin-bottom: 30px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #666;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #007bff;
                        color: white;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f2f2f2;
                    }
                    .total {
                        text-align: right;
                        font-size: 24px;
                        font-weight: bold;
                        color: #28a745;
                        margin-top: 20px;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 12px;
                        color: #999;
                    }
                    .status {
                        display: inline-block;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .status-PENDING { background-color: #ffc107; color: #000; }
                    .status-RECEIVED { background-color: #28a745; color: white; }
                    .status-CANCELLED { background-color: #dc3545; color: white; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ORDEN DE COMPRA</h1>
                    <p>#${order.orderNumber || order.id}</p>
                </div>
                
                <div class="info">
                    <div class="info-row">
                        <div>
                            <span class="info-label">Proveedor:</span><br>
                            ${order.supplierName || 'N/A'}
                        </div>
                        <div>
                            <span class="info-label">Fecha:</span><br>
                            ${new Date(order.createdAt).toLocaleDateString('es-PE')}
                        </div>
                        <div>
                            <span class="info-label">Estado:</span><br>
                            <span class="status status-${order.status}">${order.status}</span>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Cantidad</th>
                            <th>Costo Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(order.items || []).map(item => `
                            <tr>
                                <td>${item.productName || 'N/A'}</td>
                                <td>${item.productSku || 'N/A'}</td>
                                <td>${item.quantity}</td>
                                <td>S/ ${parseFloat(item.unitCost || 0).toFixed(2)}</td>
                                <td>S/ ${(item.quantity * item.unitCost).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total">
                    Total: S/ ${parseFloat(order.total || 0).toFixed(2)}
                </div>

                <div class="footer">
                    <p>Este documento es una orden de compra generada por el sistema SMART ERP</p>
                    <p>Fecha de impresión: ${new Date().toLocaleString('es-PE')}</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `

        printWindow.document.write(printContent)
        printWindow.document.close()
    }

    const handleCreate = (e) => {
        e.preventDefault()

        if (!formData.supplierId) {
            toast.error('Selecciona un proveedor')
            return
        }

        if (formData.items.some(i => !i.productId || i.quantity <= 0)) {
            toast.error('Completa todos los items')
            return
        }

        const total = formData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitCost)
        }, 0)

        const selectedSupplier = suppliersForPurchase?.find(s => s.id === formData.supplierId)
        const supplierName = selectedSupplier?.name || 'Proveedor'

        const orderData = {
            supplierId: formData.supplierId,
            supplierName: supplierName,
            total: total,
            status: 'PENDING',
            items: formData.items.map(item => {
                const product = productsForPurchase?.find(p => p.id === item.productId)
                return {
                    productId: item.productId,
                    productName: product?.name || 'Producto',
                    productSku: product?.sku || '',
                    quantity: item.quantity,
                    unitCost: item.unitCost
                }
            })
        }

        console.log('📝 Datos de la orden:', orderData)
        createMutation.mutate(orderData)
    }

    const getStatusBadge = (status) => {
        const map = {
            'PENDING': { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
            'RECEIVED': { label: 'Recibida', color: 'bg-green-600', icon: CheckCircle2 },
            'CANCELLED': { label: 'Cancelada', color: 'bg-red-600', icon: XCircle }
        }
        const s = map[status] || map.PENDING
        const Icon = s.icon
        return (
            <Badge className={s.color}>
                <Icon className="w-3 h-3 mr-1" /> {s.label}
            </Badge>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Órdenes de Compra</h1>
                    <p className="text-muted-foreground">Gestiona las compras a proveedores</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Nueva Orden
                </Button>
            </div>

            {/* Búsqueda */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar orden..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de órdenes */}
            {isLoadingPurchases ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : !purchases || purchases.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay órdenes de compra</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {purchases.map((purchase) => (
                        <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            <ShoppingCart className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">
                                                    Orden #{purchase.orderNumber || purchase.id?.slice(0, 8) || 'N/A'}
                                                </h3>
                                                {getStatusBadge(purchase.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <span>Proveedor: <strong>{purchase.supplierName || 'N/A'}</strong></span>
                                                <span>Items: {purchase.items?.length || 0}</span>
                                                <span className="text-green-600 font-semibold">
                                                    Total: S/ {parseFloat(purchase.total || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setSelectedPurchase(purchase); setIsDetailOpen(true) }}
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> Ver
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal: Crear Orden */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nueva Orden de Compra</DialogTitle>
                        <DialogDescription>Registra una nueva orden de compra a proveedor</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Proveedor *</Label>
                            <select
                                className="w-full h-9 px-3 border rounded-md bg-background"
                                value={formData.supplierId}
                                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar proveedor</option>
                                {suppliersForPurchase?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Items de la Orden</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <Plus className="w-4 h-4 mr-1" /> Agregar Item
                                </Button>
                            </div>
                            {formData.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                                    <div className="col-span-5 space-y-1">
                                        <Label className="text-xs">Producto</Label>
                                        <select
                                            className="w-full h-9 px-2 border rounded-md bg-background text-sm"
                                            value={item.productId}
                                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                        >
                                            <option value="">Seleccionar</option>
                                            {productsForPurchase?.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs">Cantidad</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">Costo Unit.</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.unitCost}
                                            onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600"
                                            onClick={() => removeItem(index)}
                                            disabled={formData.items.length === 1}
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex justify-end text-lg font-bold">
                                Total: S/ {formData.items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0).toFixed(2)}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creando...' : 'Crear Orden'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Detalle */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Orden</DialogTitle>
                    </DialogHeader>
                    {selectedPurchase && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Proveedor</Label>
                                    <p className="font-medium">{selectedPurchase.supplierName || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label>Estado</Label>
                                    <div>{getStatusBadge(selectedPurchase.status)}</div>
                                </div>
                                <div>
                                    <Label>Fecha</Label>
                                    <p>{new Date(selectedPurchase.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label>Total</Label>
                                    <p className="text-lg font-bold text-green-600">
                                        S/ {parseFloat(selectedPurchase.total || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            {selectedPurchase.items && selectedPurchase.items.length > 0 && (
                                <div>
                                    <Label>Items</Label>
                                    <div className="border rounded mt-2">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="p-2 text-left">Producto</th>
                                                    <th className="p-2 text-right">Cantidad</th>
                                                    <th className="p-2 text-right">Costo</th>
                                                    <th className="p-2 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPurchase.items.map((item, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="p-2">{item.productName || 'N/A'}</td>
                                                        <td className="p-2 text-right">{item.quantity}</td>
                                                        <td className="p-2 text-right">S/ {parseFloat(item.unitCost || 0).toFixed(2)}</td>
                                                        <td className="p-2 text-right font-semibold">
                                                            S/ {(item.quantity * item.unitCost).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex gap-2 mt-4">
                                {selectedPurchase?.status === 'PENDING' && (
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 flex-1"
                                        onClick={() => receiveMutation.mutate(selectedPurchase.id)}
                                        disabled={receiveMutation.isPending}
                                    >
                                        {receiveMutation.isPending ? (
                                            <>🔄 Procesando...</>
                                        ) : (
                                            <>🚚 Recibir Mercancía</>
                                        )}
                                    </Button>
                                )}

                                {/* ✅ BOTÓN IMPRIMIR */}
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handlePrint(selectedPurchase)}
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Imprimir Orden
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}