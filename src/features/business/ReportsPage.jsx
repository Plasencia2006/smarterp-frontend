import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    FileText, Download, Calendar, DollarSign, Package, Wallet,
    Users, ShoppingBag, Loader2, BarChart3, FileSpreadsheet
} from 'lucide-react'
import { toast } from 'sonner'

export default function ReportsPage() {
    const [reportType, setReportType] = useState('SALES')
    const [format, setFormat] = useState('CSV')
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    })
    const [isDownloading, setIsDownloading] = useState(false)

    // Obtener tipos de reportes
    const { data: reportTypesData } = useQuery({
        queryKey: ['report-types'],
        queryFn: async () => {
            try {
                const res = await reportAPI.getReportTypes()
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener tipos:', error)
                return null
            }
        }
    })

    // Descargar reporte
    const handleDownload = async () => {
        setIsDownloading(true)
        try {
            await reportAPI.downloadFile(
                reportType,
                format,
                dateRange.startDate,
                dateRange.endDate
            )
            toast.success(' Reporte descargado correctamente')
        } catch (error) {
            toast.error('❌ Error al descargar reporte')
            console.error(error)
        } finally {
            setIsDownloading(false)
        }
    }

    // Configuración de tipos de reportes
    const reportConfigs = {
        SALES: {
            title: 'Reporte de Ventas',
            description: 'Cotizaciones, facturas y ventas del período',
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        INVENTORY: {
            title: 'Reporte de Inventario',
            description: 'Stock, valor y movimiento de productos',
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        CASH: {
            title: 'Reporte de Caja',
            description: 'Aperturas, cierres y movimientos de caja',
            icon: Wallet,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        PRODUCTS: {
            title: 'Reporte de Productos',
            description: 'Catálogo completo de productos',
            icon: ShoppingBag,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        CUSTOMERS: {
            title: 'Reporte de Clientes',
            description: 'Estadísticas y compras de clientes',
            icon: Users,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            borderColor: 'border-pink-200'
        }
    }

    const currentConfig = reportConfigs[reportType] || reportConfigs.SALES
    const Icon = currentConfig.icon

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    Centro de Reportes
                </h1>
                <p className="text-muted-foreground">
                    Genera reportes profesionales en diferentes formatos
                </p>
            </div>

            {/* Grid de Tipos de Reportes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                {Object.entries(reportConfigs).map(([key, config]) => {
                    const ReportIcon = config.icon
                    const isSelected = reportType === key
                    return (
                        <Card
                            key={key}
                            className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                                }`}
                            onClick={() => setReportType(key)}
                        >
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`p-3 rounded-lg ${config.bgColor} mb-3`}>
                                        <ReportIcon className={`w-6 h-6 ${config.color}`} />
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1">{config.title}</h3>
                                    <p className="text-xs text-muted-foreground">{config.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Panel de Configuración */}
            <Card className={`border-2 ${currentConfig.borderColor} mb-6`}>
                <CardHeader className={`${currentConfig.bgColor}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-white dark:bg-gray-800`}>
                            <Icon className={`w-6 h-6 ${currentConfig.color}`} />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{currentConfig.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Formato */}
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Formato</Label>
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CSV">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            CSV (Excel compatible)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EXCEL">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4" />
                                            Excel (.xlsx)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fecha Inicio */}
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Fecha Inicio</Label>
                            <Input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            />
                        </div>

                        {/* Fecha Fin */}
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Fecha Fin</Label>
                            <Input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Botón Descargar */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Período: {new Date(dateRange.startDate).toLocaleDateString('es-PE')} - {new Date(dateRange.endDate).toLocaleDateString('es-PE')}
                        </div>
                        <Button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="lg"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar {currentConfig.title}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Información de Formatos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-5 h-5" />
                            Formato CSV
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                            <li> Compatible con Excel, Google Sheets</li>
                            <li> Tamaño de archivo pequeño</li>
                            <li> Fácil de procesar</li>
                            <li> Ideal para análisis rápido</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileSpreadsheet className="w-5 h-5" />
                            Formato Excel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                            <li> Formato profesional con estilos</li>
                            <li> Columnas auto-ajustadas</li>
                            <li> Ideal para presentaciones</li>
                            <li> Compatible con Microsoft Excel</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}