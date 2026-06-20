import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI, quoteAPI } from '@/services/spring.api'  // ✅ AGREGAR quoteAPI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
    Search, Clock, Lock, Unlock, Eye, X,
    AlertCircle, CheckCircle2, Calendar, User, Receipt,
    FileDown
} from 'lucide-react'

export default function QuoteViewer() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedQuote, setSelectedQuote] = useState(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
    const [blockMinutes, setBlockMinutes] = useState(20)

    // 📋 Obtener todas las cotizaciones
    const { data: quotes, isLoading } = useQuery({
        queryKey: ['all-quotes'],
        queryFn: async () => {
            const res = await inventoryAPI.quotes.getAll()
            return res.data?.success ? res.data.data : []
        },
        refetchInterval: 30000
    })

    // 🔒 Bloquear cotización
    const blockMutation = useMutation({
        mutationFn: ({ id, minutes }) => inventoryAPI.quotes.block(id, minutes),
        onSuccess: () => {
            toast.success(' Cotización bloqueada temporalmente')
            queryClient.invalidateQueries(['all-quotes'])
            setIsBlockDialogOpen(false)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al bloquear')
    })

    // 🔓 Liberar bloqueo
    const releaseMutation = useMutation({
        mutationFn: (id) => inventoryAPI.quotes.release(id),
        onSuccess: () => {
            toast.success(' Bloqueo liberado')
            queryClient.invalidateQueries(['all-quotes'])
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al liberar')
    })

    // Filtrar cotizaciones
    const filteredQuotes = quotes?.filter(quote => {
        const matchesSearch =
            quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus =
            statusFilter === 'all' || quote.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Obtener badge de estado
    const getStatusBadge = (quote) => {
        const statusBadges = {
            PENDIENTE_PAGO: (
                <Badge className="bg-blue-600 hover:bg-blue-700">
                     Pendiente de Pago
                </Badge>
            ),
            PAGADA: (
                <Badge className="bg-green-600 hover:bg-green-700">
                     Pagada
                </Badge>
            ),
            CANCELADA: (
                <Badge variant="destructive">
                    ❌ Cancelada
                </Badge>
            )
        }

        return statusBadges[quote.status] || <Badge>{quote.status}</Badge>
    }

    // ✅ Función para descargar PDF
    const handleDownloadPdf = async (quoteId, quoteNumber) => {
        try {
            console.log(' Descargando PDF para:', quoteId)
            const response = await quoteAPI.downloadPdf(quoteId)
            console.log(' Respuesta recibida:', response)

            // Crear blob y descargar
            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `cotizacion_${quoteNumber}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(' PDF descargado correctamente')
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error)
            console.error('Response:', error.response)
            toast.error(error.response?.data?.message || 'Error al descargar el PDF')
        }
    }

    // Verificar si está bloqueada
    const getBlockBadge = (quote) => {
        if (!quote.isBlocked || quote.isExpired) {
            return null
        }

        const remainingMinutes = quote.remainingMinutes || 0

        return (
            <Badge className="bg-orange-500 hover:bg-orange-600">
                <Lock className="w-3 h-3 mr-1" />
                Bloqueado ({remainingMinutes} min)
            </Badge>
        )
    }

    const handleBlock = (quote) => {
        setSelectedQuote(quote)
        setIsBlockDialogOpen(true)
    }

    const confirmBlock = () => {
        if (selectedQuote) {
            blockMutation.mutate({ id: selectedQuote.id, minutes: blockMinutes })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Cotizaciones</h1>
                        <p className="text-muted-foreground">Gestión y seguimiento de cotizaciones</p>
                    </div>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por número o cliente..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-10 px-3 border rounded-md bg-background"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos los estados</option>
                                <option value="PENDIENTE_PAGO">Pendientes</option>
                                <option value="PAGADA">Pagadas</option>
                                <option value="CANCELADA">Canceladas</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Cotizaciones */}
                {isLoading ? (
                    <div className="text-center py-10">Cargando...</div>
                ) : (
                    <div className="grid gap-4">
                        {filteredQuotes?.map((quote) => {
                            const isBlocked = quote.isBlocked && !quote.isExpired
                            const remainingMinutes = quote.remainingMinutes || 0

                            return (
                                <Card
                                    key={quote.id}
                                    className={isBlocked ? 'border-orange-300 bg-orange-50/30' : ''}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <h3 className="font-semibold text-lg">
                                                        {quote.quoteNumber}
                                                    </h3>
                                                    {getStatusBadge(quote)}
                                                    {isBlocked && getBlockBadge(quote)}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {quote.customerName}
                                                    </span>
                                                    {quote.customerDocument && (
                                                        <span>{quote.customerDocument}</span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(quote.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-lg font-bold text-green-600">
                                                        S/ {quote.total?.toFixed(2)}
                                                    </span>
                                                </div>

                                                {isBlocked && remainingMinutes > 0 && (
                                                    <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="font-medium">
                                                            Tiempo restante: {remainingMinutes} minutos
                                                        </span>
                                                    </div>
                                                )}

                                                {quote.items && quote.items.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="text-sm font-medium mb-2">Productos:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {quote.items.map((item, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {item.quantity} × {item.productName}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedQuote(quote)
                                                        setIsDetailOpen(true)
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Ver
                                                </Button>

                                                {quote.status === 'PENDIENTE_PAGO' && !isBlocked && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleBlock(quote)}
                                                        className="text-orange-600 hover:bg-orange-50"
                                                    >
                                                        <Lock className="w-4 h-4 mr-1" />
                                                        Bloquear
                                                    </Button>
                                                )}

                                                {isBlocked && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => releaseMutation.mutate(quote.id)}
                                                        className="text-green-600 hover:bg-green-50"
                                                    >
                                                        <Unlock className="w-4 h-4 mr-1" />
                                                        Liberar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Detalle de Cotización
                        </DialogTitle>
                    </DialogHeader>
                    {selectedQuote && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Número</p>
                                    <p className="font-semibold">{selectedQuote.quoteNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <p className="font-semibold">{selectedQuote.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                    <p className="font-semibold text-green-600">S/ {selectedQuote.total?.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Estado</p>
                                    <div className="mt-1">{getStatusBadge(selectedQuote)}</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="font-semibold mb-2">Productos:</p>
                                <div className="space-y-2">
                                    {selectedQuote.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity} × {item.productName}</span>
                                            <span>S/ {item.subtotal?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedQuote.isBlocked && !selectedQuote.isExpired && (
                                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                                    <p className="text-sm text-orange-800 font-medium">
                                        🔒 Productos bloqueados por {selectedQuote.blockDurationMinutes} minutos
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Disponible hasta: {new Date(selectedQuote.blockedUntil).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <DialogFooter className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownloadPdf(selectedQuote.id, selectedQuote.quoteNumber)}
                                    className="flex items-center gap-2"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Descargar PDF
                                </Button>
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                    Cerrar
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Bloqueo */}
            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-600" />
                            Bloquear Productos Temporalmente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <p className="text-sm text-orange-800">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Los productos se bloquearán para otros vendedores
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tiempo de bloqueo:</label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={blockMinutes === 15 ? 'default' : 'outline'}
                                    onClick={() => setBlockMinutes(15)}
                                >
                                    15 min
                                </Button>
                                <Button
                                    variant={blockMinutes === 20 ? 'default' : 'outline'}
                                    onClick={() => setBlockMinutes(20)}
                                >
                                    20 min
                                </Button>
                                <Button
                                    variant={blockMinutes === 30 ? 'default' : 'outline'}
                                    onClick={() => setBlockMinutes(30)}
                                >
                                    30 min
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmBlock}
                            disabled={blockMutation.isPending}
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Bloquear
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}