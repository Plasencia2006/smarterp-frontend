import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { quoteAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    DollarSign,
    TrendingUp,
    Package,
    Calendar,
    Filter,
    Download,
    Eye,
    Loader2,
    AlertCircle,
    User,
    FileText,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

export default function SalesManager() {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    })
    const [filterStatus, setFilterStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(20)
    const [periodType, setPeriodType] = useState('day')
    const [selectedQuote, setSelectedQuote] = useState(null)

    // ✅ Función simplificada
    const getSellerInfo = (quote) => {
        return quote.sellerEmail || quote.sellerId || quote.sellerName || 'N/A'
    }

    // 📊 Dashboard de Ventas
    const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
        queryKey: ['admin-sales-dashboard', dateRange],
        queryFn: async () => {
            try {
                const res = await quoteAPI.getAdminDashboard(
                    dateRange.startDate,
                    dateRange.endDate
                )
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener dashboard:', error)
                return null
            }
        }
    })

    // 📋 Todas las Cotizaciones
    const { data: quotesData, isLoading: loadingQuotes } = useQuery({
        queryKey: ['admin-sales-quotes', currentPage, pageSize, filterStatus, dateRange],
        queryFn: async () => {
            try {
                const res = await quoteAPI.getAllQuotes(
                    currentPage,
                    pageSize,
                    filterStatus || undefined,
                    undefined,
                    dateRange.startDate,
                    dateRange.endDate
                )
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener cotizaciones:', error)
                return null
            }
        }
    })

    // 💰 Ventas por Período
    const { data: salesByPeriod, isLoading: loadingPeriod } = useQuery({
        queryKey: ['admin-sales-by-period', periodType, dateRange],
        queryFn: async () => {
            try {
                const res = await quoteAPI.getSalesByPeriod(
                    periodType,
                    dateRange.startDate,
                    dateRange.endDate
                )
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener ventas por período:', error)
                return null
            }
        }
    })

    const handleExportCSV = () => {
        if (!quotesData?.content) {
            toast.error('❌ No hay cotizaciones para exportar')
            return
        }

        // ✅ BOM para UTF-8 (soluciona problema de codificación)
        const BOM = '\uFEFF'

        // Headers mejorados
        const headers = [
            'Número de Cotización',
            'Cliente',
            'Documento',
            'Estado',
            'Subtotal',
            'IGV',
            'Total',
            'Método de Pago',
            'Fecha de Creación',
            'Fecha de Pago',
            'Cantidad de Productos'
        ]

        // Datos formateados
        const rows = quotesData.content.map(quote => [
            quote.quoteNumber,
            quote.customerName,
            quote.customerDocument || 'N/A',
            quote.status,
            parseFloat(quote.subtotal || 0).toFixed(2),
            parseFloat(quote.igv || 0).toFixed(2),
            parseFloat(quote.total).toFixed(2),
            quote.paymentMethod || 'N/A',
            new Date(quote.createdAt).toLocaleDateString('es-PE'),
            quote.paidAt ? new Date(quote.paidAt).toLocaleDateString('es-PE') : 'N/A',
            quote.items ? quote.items.length : 0
        ])

        // Agregar resumen al inicio
        const totalVentas = quotesData.content
            .filter(q => q.status === 'FACTURADA' || q.status === 'PAGADA')
            .reduce((sum, q) => sum + parseFloat(q.total || 0), 0)

        const resumen = [
            '',
            'RESUMEN DE VENTAS',
            `Período: ${new Date(dateRange.startDate).toLocaleDateString('es-PE')} - ${new Date(dateRange.endDate).toLocaleDateString('es-PE')}`,
            `Total de Cotizaciones: ${quotesData.totalElements}`,
            `Total Ventas: S/ ${totalVentas.toFixed(2)}`,
            ''
        ]

        // Crear contenido CSV
        const csvContent = [
            BOM,
            ...resumen,
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        // Crear blob con UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        // Nombre de archivo con fecha
        const fileName = `ventas_${dateRange.startDate}_${dateRange.endDate}_${new Date().getTime()}.csv`

        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()

        URL.revokeObjectURL(link.href)

        toast.success(`✅ Exportado ${quotesData.content.length} cotizaciones correctamente`)
    }

    const handleViewQuote = (quote) => {
        setSelectedQuote(quote)
    }

    if (loadingDashboard || loadingQuotes) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando datos de ventas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Gestión de Ventas
                </h1>
                <p className="text-muted-foreground">
                    Administra y analiza todas las ventas del negocio
                </p>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Fecha Inicio</Label>
                            <Input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Fecha Fin</Label>
                            <Input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Estado</Label>
                            <Select
                                value={filterStatus || 'ALL'}
                                onValueChange={(value) => setFilterStatus(value === 'ALL' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                    <SelectItem value="FACTURADA">Facturada</SelectItem>
                                    <SelectItem value="PAGADA">Pagada</SelectItem>
                                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={() => setCurrentPage(0)} className="w-full">
                                <Filter className="w-4 h-4 mr-2" />
                                Aplicar Filtros
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard Stats */}
            {dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Ventas
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                S/ {parseFloat(dashboardData.totalVentas || 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                En el período seleccionado
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ventas Hoy
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                S/ {parseFloat(dashboardData.ventasHoy || 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.cotizacionesHoy || 0} cotizaciones hoy
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pendientes
                            </CardTitle>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                S/ {parseFloat(dashboardData.totalPendiente || 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.cotizacionesPendientes || 0} cotizaciones
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tasa de Conversión
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {(dashboardData.tasaConversion || 0).toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.cotizacionesCompletadas || 0} completadas de {dashboardData.totalCotizaciones || 0}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Ventas por Período */}
            {salesByPeriod && salesByPeriod.salesByPeriod && Object.keys(salesByPeriod.salesByPeriod).length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Ventas por Período
                            </CardTitle>
                            <Select value={periodType} onValueChange={setPeriodType}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Día</SelectItem>
                                    <SelectItem value="week">Semana</SelectItem>
                                    <SelectItem value="month">Mes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {Object.entries(salesByPeriod.salesByPeriod).map(([period, amount]) => (
                                <div key={period} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <span className="font-medium">{period}</span>
                                    <span className="font-bold text-green-600">
                                        S/ {parseFloat(amount).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <span className="font-semibold">Total:</span>
                            <span className="text-2xl font-bold text-green-600">
                                S/ {parseFloat(salesByPeriod.totalVentas || 0).toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabla de Cotizaciones - SIN COLUMNA VENDEDOR */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Cotizaciones ({quotesData?.totalElements || 0})
                        </CardTitle>
                        <Button onClick={handleExportCSV} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {quotesData?.content && quotesData.content.length > 0 ? (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Número</TableHead>
                                            <TableHead>Cliente</TableHead>
                                            {/* ❌ ELIMINADO: Columna Vendedor */}
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {quotesData.content.map((quote) => (
                                            <TableRow key={quote.id}>
                                                <TableCell className="font-medium">
                                                    {quote.quoteNumber}
                                                </TableCell>
                                                <TableCell>{quote.customerName}</TableCell>
                                                {/* ❌ ELIMINADO: Celda Vendedor */}
                                                <TableCell>
                                                    <Badge variant={
                                                        quote.status === 'FACTURADA' ? 'default' :
                                                            quote.status === 'PAGADA' ? 'default' :
                                                                quote.status === 'PENDIENTE' ? 'secondary' :
                                                                    'destructive'
                                                    }>
                                                        {quote.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    S/ {parseFloat(quote.total).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(quote.createdAt).toLocaleDateString('es-PE')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewQuote(quote)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Paginación */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {quotesData.content.length} de {quotesData.totalElements} cotizaciones
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage >= quotesData.totalPages - 1}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No se encontraron cotizaciones</p>
                            <p className="text-sm mt-1">Ajusta los filtros y busca nuevamente</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Detalles de Cotización - DISEÑO LIMPIO */}
            <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
                <DialogContent className="max-w-[95vw] w-full min-w-[1000px] max-h-[90vh] overflow-y-auto p-8">
                    <DialogHeader>
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-600 rounded-lg">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold">
                                        Cotización {selectedQuote?.quoteNumber}
                                    </DialogTitle>
                                    <DialogDescription className="mt-1">
                                        Detalle completo de la cotización
                                    </DialogDescription>
                                </div>
                            </div>
                            <Badge
                                className="text-lg px-4 py-2"
                                variant={
                                    selectedQuote?.status === 'FACTURADA' ? 'default' :
                                        selectedQuote?.status === 'PAGADA' ? 'default' :
                                            selectedQuote?.status === 'PENDIENTE' ? 'secondary' :
                                                'destructive'
                                }
                            >
                                {selectedQuote?.status}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedQuote && (
                        <div className="grid grid-cols-3 gap-6 mt-4">

                            {/* COLUMNA IZQUIERDA - 2/3 del ancho */}
                            <div className="col-span-2 space-y-4">

                                {/* Información del Cliente */}
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Información del Cliente
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Nombre</p>
                                            <p className="font-semibold text-lg">{selectedQuote.customerName}</p>
                                        </div>
                                        {selectedQuote.customerDocument && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Documento</p>
                                                <p className="font-semibold text-lg">{selectedQuote.customerDocument}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Productos */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-600 text-white p-3">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <Package className="w-5 h-5" />
                                            Productos ({selectedQuote.items?.length || 0})
                                        </h3>
                                    </div>
                                    <div className="divide-y">
                                        {selectedQuote.items && selectedQuote.items.map((item, index) => (
                                            <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">{item.productName}</p>
                                                        {item.productSku && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.productSku}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {item.quantity} × S/ {parseFloat(item.unitPrice).toFixed(2)}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-lg text-green-600">
                                                    S/ {parseFloat(item.subtotal).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA - 1/3 del ancho */}
                            <div className="col-span-1 space-y-4">

                                {/* Fechas */}
                                <div className="border rounded-lg p-4 space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                                        <p className="font-semibold">
                                            {new Date(selectedQuote.createdAt).toLocaleDateString('es-PE')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(selectedQuote.createdAt).toLocaleTimeString('es-PE', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    {selectedQuote.paidAt && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                                            <p className="font-semibold text-green-600">
                                                {new Date(selectedQuote.paidAt).toLocaleDateString('es-PE')}
                                            </p>
                                        </div>
                                    )}
                                    {selectedQuote.paymentMethod && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Método de Pago</p>
                                            <Badge className="mt-1">{selectedQuote.paymentMethod}</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Totales */}
                                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                                    <h3 className="font-bold text-lg mb-3 text-blue-900">Resumen</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-semibold">S/ {parseFloat(selectedQuote.subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IGV (18%):</span>
                                            <span className="font-semibold">S/ {parseFloat(selectedQuote.igv || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t-2 border-blue-300 pt-3 mt-3 flex justify-between items-center">
                                            <span className="text-xl font-bold text-blue-900">Total:</span>
                                            <span className="text-2xl font-bold text-green-600">
                                                S/ {parseFloat(selectedQuote.total).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}