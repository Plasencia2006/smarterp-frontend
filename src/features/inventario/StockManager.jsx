import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Package, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react'

export default function StockManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isAdjustOpen, setIsAdjustOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState(null)
    const [adjustType, setAdjustType] = useState('IN')
    const [adjustQty, setAdjustQty] = useState('')
    const [adjustReason, setAdjustReason] = useState('')

    const { data: stockList, isLoading } = useQuery({
        queryKey: ['inventory-stock', searchTerm],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.stock.list({ search: searchTerm })
                return res.data?.success && Array.isArray(res.data.data) ? res.data.data : []
            } catch { return [] }
        }
    })

    const { data: movements } = useQuery({
        queryKey: ['stock-movements'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.stock.movements({ limit: 10 })
                return res.data?.success && Array.isArray(res.data.data) ? res.data.data : []
            } catch { return [] }
        }
    })

    const adjustMutation = useMutation({
        mutationFn: (data) => inventoryAPI.stock.adjust(data),
        onSuccess: () => {
            toast.success('✅ Stock ajustado correctamente')
            queryClient.invalidateQueries(['inventory-stock', 'stock-movements'])
            setIsAdjustOpen(false)
            setAdjustQty('')
            setAdjustReason('')
        },
        onError: () => toast.error('Error al ajustar stock')
    })

    const handleAdjust = () => {
        if (!selectedStock || !adjustQty || parseInt(adjustQty) <= 0) return toast.error('Cantidad inválida')
        adjustMutation.mutate({
            productId: selectedStock.productId,
            type: adjustType,
            quantity: parseInt(adjustQty),
            reason: adjustReason || 'Ajuste manual'
        })
    }

    const openAdjust = (stock, type) => {
        setSelectedStock(stock)
        setAdjustType(type)
        setIsAdjustOpen(true)
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Control de Stock</h1>
                <p className="text-muted-foreground">Gestiona entradas, salidas y niveles de inventario</p>
            </div>

            <Card>
                <CardContent className="p-4">
                    <Input placeholder="Buscar producto por nombre o SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : !stockList?.length ? (
                <Card><CardContent className="p-12 text-center text-muted-foreground">No hay productos en stock</CardContent></Card>
            ) : (
                <div className="grid gap-3">
                    {stockList.map(s => (
                        <Card key={s.id} className="hover:shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{s.productName}</h3>
                                        <p className="text-sm text-muted-foreground">SKU: {s.sku}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Stock actual</p>
                                        <p className="text-lg font-bold">{s.quantity}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => openAdjust(s, 'IN')}>
                                            <TrendingUp className="w-4 h-4 mr-1" /> Entrada
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => openAdjust(s, 'OUT')}>
                                            <TrendingDown className="w-4 h-4 mr-1" /> Salida
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {movements?.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">Últimos Movimientos</h3>
                        <div className="space-y-2">
                            {movements.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                    <div className="flex items-center gap-2">
                                        {m.type === 'IN' ? <TrendingUp className="text-green-600 w-4 h-4" /> : <TrendingDown className="text-red-600 w-4 h-4" />}
                                        <span className="text-sm">{m.productName}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-semibold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                            {m.type === 'IN' ? '+' : '-'}{m.quantity}
                                        </span>
                                        <p className="text-xs text-muted-foreground">{m.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{adjustType === 'IN' ? '📥 Entrada de Stock' : '📤 Salida de Stock'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cantidad</Label>
                            <Input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Ej: Venta, Compra, Ajuste..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAdjust} disabled={adjustMutation.isPending || !adjustQty}>
                            {adjustMutation.isPending ? 'Procesando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}