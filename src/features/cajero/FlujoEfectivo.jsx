import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    ArrowLeft, Loader2, AlertTriangle, TrendingUp, TrendingDown,
    Wallet, DollarSign, CheckCircle2, XCircle, Activity,
    BarChart3, PieChart, Clock, FileText, Shield
} from 'lucide-react'

export default function FlujoEfectivo() {
    const navigate = useNavigate()

    // Obtener turno activo
    const { data: activeRegister } = useQuery({
        queryKey: ['active-register'],
        queryFn: async () => {
            const res = await cashierAPI.getActiveRegister()
            return res.data?.success ? res.data.data : null
        }
    })

    // Obtener resumen de flujo
    const { data: summary, isLoading } = useQuery({
        queryKey: ['cash-flow', activeRegister?.id],
        queryFn: async () => {
            if (!activeRegister?.id) return null
            const res = await cashierAPI.getCashFlowSummary(activeRegister.id)
            return res.data?.success ? res.data.data : null
        },
        enabled: !!activeRegister?.id,
        refetchInterval: 30000
    })

    if (!activeRegister) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-xl font-bold mb-2">No hay caja abierta</h2>
                        <p className="text-muted-foreground mb-4">
                            Debes abrir caja para ver el flujo de efectivo
                        </p>
                        <Button onClick={() => navigate('/cajero')}>Volver al panel</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!summary) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No hay datos de flujo disponibles</p>
                        <Button onClick={() => navigate('/cajero')} className="mt-4">Volver</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate('/cajero')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flujo de Efectivo</h1>
                            <p className="text-muted-foreground">Resumen completo del turno</p>
                        </div>
                    </div>
                </div>

                {/* Alertas */}
                {summary.alerts && summary.alerts.length > 0 && (
                    <div className="space-y-2">
                        {summary.alerts.map((alert, idx) => (
                            <Card key={idx} className="border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                                            {alert}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Resumen Principal */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <p className="text-sm opacity-90">Total Ingresos</p>
                            <p className="text-3xl font-bold">S/ {summary.totalIngresos?.toFixed(2)}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingDown className="w-8 h-8" />
                            </div>
                            <p className="text-sm opacity-90">Total Egresos</p>
                            <p className="text-3xl font-bold">S/ {summary.totalEgresos?.toFixed(2)}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <p className="text-sm opacity-90">Retiros Aprobados</p>
                            <p className="text-3xl font-bold">S/ {summary.totalWithdrawals?.toFixed(2)}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <p className="text-sm opacity-90">Efectivo Actual</p>
                            <p className="text-3xl font-bold">S/ {summary.currentCash?.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Estadísticas de Arqueos y Retiros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Arqueos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-600" />
                                Estadísticas de Arqueos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-2xl font-bold">{summary.totalAudits || 0}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{summary.concordantAudits || 0}</p>
                                    <p className="text-xs text-muted-foreground">Concordantes</p>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{summary.discrepantAudits || 0}</p>
                                    <p className="text-xs text-muted-foreground">Discordantes</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Discrepancia Total:</span>
                                    <span className="font-bold text-red-600">
                                        S/ {summary.totalDiscrepancy?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Retiros */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-orange-600" />
                                Estadísticas de Retiros
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-2xl font-bold">{summary.totalWithdrawalsCount || 0}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                                    <p className="text-2xl font-bold text-yellow-600">{summary.pendingWithdrawals || 0}</p>
                                    <p className="text-xs text-muted-foreground">Pendientes</p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">
                                        S/ {summary.totalWithdrawnAmount?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Retirado</p>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Límite recomendado:</span>
                                    <span className="font-bold text-blue-600">S/ 10,000.00</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Últimos Movimientos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Últimos Movimientos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary.recentMovements && summary.recentMovements.length > 0 ? (
                            <div className="space-y-2">
                                {summary.recentMovements.map((movement, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${movement.type === 'INGRESO' ? 'bg-green-100 dark:bg-green-900/30' :
                                                    movement.type === 'EGRESO' ? 'bg-red-100 dark:bg-red-900/30' :
                                                        movement.type === 'RETIRO' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                            'bg-blue-100 dark:bg-blue-900/30'
                                                }`}>
                                                {movement.type === 'INGRESO' && <TrendingUp className="w-4 h-4 text-green-600" />}
                                                {movement.type === 'EGRESO' && <TrendingDown className="w-4 h-4 text-red-600" />}
                                                {movement.type === 'RETIRO' && <Wallet className="w-4 h-4 text-orange-600" />}
                                                {movement.type === 'APERTURA' && <DollarSign className="w-4 h-4 text-blue-600" />}
                                                {movement.type === 'CIERRE' && <Clock className="w-4 h-4 text-blue-600" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{movement.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(movement.dateTime).toLocaleString('es-PE')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${movement.type === 'INGRESO' || movement.type === 'APERTURA'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                }`}>
                                                {movement.type === 'INGRESO' || movement.type === 'APERTURA' ? '+' : '-'}
                                                S/ {movement.amount?.toFixed(2)}
                                            </p>
                                            <Badge variant="outline" className="text-xs">
                                                {movement.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay movimientos registrados
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}