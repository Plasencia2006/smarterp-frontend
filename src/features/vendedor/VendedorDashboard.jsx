import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { quoteAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    DollarSign, ShoppingCart, TrendingUp, Clock,
    CheckCircle2, Package, Target, Award
} from 'lucide-react'

export default function DashboardVendedor() {
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Consultar dashboard
    const { data: dashboardResponse, isLoading, refetch } = useQuery({
        queryKey: ['vendedor-dashboard'],
        queryFn: async () => {
            try {
                const res = await quoteAPI.getDashboard()
                console.log('📊 Dashboard response:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener dashboard:', error)
                return null
            }
        },
        staleTime: 30000, // Cache por 30 segundos
        refetchInterval: 60000 // Refrescar cada 60 segundos
    })

    useEffect(() => {
        if (dashboardResponse) {
            setDashboardData(dashboardResponse)
            setLoading(false)
        }
    }, [dashboardResponse])

    // Refrescar al montar
    useEffect(() => {
        refetch()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">No se pudo cargar el dashboard</p>
                    <button
                        onClick={() => refetch()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-PE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-900 rounded-lg p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard del Vendedor</h1>
                        <p className="text-blue-100 mb-4">Resumen de tu actividad de ventas</p>
                        <p className="text-sm text-blue-100">
                                {formatDate(new Date())}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-100 mb-1">Total Vendido</p>
                        <p className="text-4xl font-bold">
                            S/ {parseFloat(dashboardData.totalVendido || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-blue-100 mt-1">
                            ↗ +15.3% este mes
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Ventas Hoy */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ventas Hoy
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            S/ {parseFloat(dashboardData.ventasHoy || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboardData.cotizacionesHoy || 0} cotizaciones hoy
                        </p>
                        <Badge className="mt-2 bg-green-100 text-green-800">
                            ↗ +12.5%
                        </Badge>
                    </CardContent>
                </Card>

                {/* Cotizaciones Hoy */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Cotizaciones Hoy
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {dashboardData.cotizacionesHoy || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboardData.cotizacionesPendientes || 0} pendientes
                        </p>
                        <Badge className="mt-2 bg-blue-100 text-blue-800">
                            ↗ +8.2%
                        </Badge>
                    </CardContent>
                </Card>

                {/* Ventas 7 Días */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ventas 7 Días
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                            S/ {parseFloat(dashboardData.ventas7Dias || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Última semana
                        </p>
                        <Badge className="mt-2 bg-purple-100 text-purple-800">
                            ↗ +23.1%
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Secundarias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Pendientes */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pendientes</p>
                                <p className="text-2xl font-bold">
                                    {dashboardData.cotizacionesPendientes || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Por cobrar</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagadas */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pagadas</p>
                                <p className="text-2xl font-bold">
                                    {dashboardData.cotizacionesFacturadas || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Completadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Cotizaciones */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
                                <p className="text-2xl font-bold">
                                    {dashboardData.totalCotizaciones || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Histórico</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Métricas Avanzadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasa de Conversión */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Tasa de Conversión</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Cotizaciones que se convierten en ventas
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Target className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold">
                                    {(dashboardData.tasaConversion || 0).toFixed(1)}
                                </span>
                                <span className="text-2xl text-muted-foreground mb-1">%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(dashboardData.tasaConversion || 0, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Objetivo: 50%</span>
                                <span className={dashboardData.tasaConversion >= 50 ? 'text-green-600' : 'text-orange-600'}>
                                    {dashboardData.tasaConversion >= 50 ? ' En progreso' : ' Por debajo'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rendimiento del Mes */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Rendimiento del Mes</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Tu progreso mensual
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Award className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Cotizaciones</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {dashboardData.cotizacionesHoy || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Ventas</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {dashboardData.cotizacionesFacturadas || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Progreso</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min((dashboardData.cotizacionesFacturadas || 0) * 10, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {dashboardData.cotizacionesFacturadas || 0} / 10 ventas objetivo
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}