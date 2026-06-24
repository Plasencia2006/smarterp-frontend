import { useQuery } from '@tanstack/react-query'
import { vendedorAPI } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    ShoppingCart, DollarSign, TrendingUp, Clock,
    CheckCircle2, AlertCircle, BarChart3, Target,
    TrendingDown, Activity, Calendar, Award,
    ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react'

export default function VendedorDashboard() {
    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['vendedor-dashboard'],
        queryFn: async () => {
            const res = await vendedorAPI.getDashboard()
            return res.data?.success ? res.data.data : null
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    if (!dashboard) {
        return (
            <div className="text-center py-20">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">No hay datos disponibles</p>
            </div>
        )
    }

    // Calcular porcentaje de conversión para la barra de progreso
    const conversionRate = dashboard.conversionRate || 0
    const progressValue = Math.min(conversionRate, 100)

    // Stats principales con gradientes
    const mainStats = [
        {
            title: 'Ventas Hoy',
            value: `S/ ${(dashboard.salesToday || 0).toFixed(2)}`,
            icon: DollarSign,
            gradient: 'from-emerald-500 to-green-600',
            bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            change: '+12.5%',
            changeType: 'positive'
        },
        {
            title: 'Cotizaciones Hoy',
            value: dashboard.quotesToday || 0,
            icon: ShoppingCart,
            gradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50 dark:bg-blue-950/30',
            textColor: 'text-blue-600 dark:text-blue-400',
            change: '+8.2%',
            changeType: 'positive'
        },
        {
            title: 'Ventas 7 Días',
            value: `S/ ${(dashboard.salesLast7Days || 0).toFixed(2)}`,
            icon: TrendingUp,
            gradient: 'from-purple-500 to-pink-600',
            bgLight: 'bg-purple-50 dark:bg-purple-950/30',
            textColor: 'text-purple-600 dark:text-purple-400',
            change: '+23.1%',
            changeType: 'positive'
        },
    ]

    // Stats secundarios
    const secondaryStats = [
        {
            title: 'Pendientes',
            value: dashboard.pendingQuotes || 0,
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-100 dark:bg-orange-950/30',
            description: 'Por cobrar'
        },
        {
            title: 'Pagadas',
            value: dashboard.paidQuotes || 0,
            icon: CheckCircle2,
            color: 'text-green-500',
            bg: 'bg-green-100 dark:bg-green-950/30',
            description: 'Completadas'
        },
        {
            title: 'Total Cotizaciones',
            value: dashboard.totalQuotes || 0,
            icon: BarChart3,
            color: 'text-blue-500',
            bg: 'bg-blue-100 dark:bg-blue-950/30',
            description: 'Histórico'
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header con Gradiente */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                               
                                <h1 className="text-4xl font-bold">Dashboard del Vendedor</h1>
                            </div>
                            <p className="text-blue-100 text-lg">Resumen de tu actividad de ventas</p>
                            <div className="flex items-center gap-2 mt-4">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm text-blue-100">
                                    {new Date().toLocaleDateString('es-PE', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                                <p className="text-sm text-blue-100 mb-1">Total Vendido</p>
                                <p className="text-4xl font-bold">S/ {(dashboard.totalSales || 0).toFixed(2)}</p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>+15.3% este mes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Principales con Gradientes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mainStats.map((stat, idx) => {
                        const Icon = stat.icon
                        return (
                            <Card key={idx} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {stat.changeType === 'positive' ? (
                                                <ArrowUpRight className="w-4 h-4" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4" />
                                            )}
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                                        <p className="text-4xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Stats Secundarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {secondaryStats.map((stat, idx) => {
                        const Icon = stat.icon
                        return (
                            <Card key={idx} className="hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                                            <Icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Sección de Conversión y Metas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tasa de Conversión */}
                    <Card className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasa de Conversión</h3>
                                    <p className="text-sm text-muted-foreground">Cotizaciones que se convierten en ventas</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                                    <Target className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-gray-900 dark:text-white">{conversionRate.toFixed(1)}</span>
                                    <span className="text-2xl text-muted-foreground">%</span>
                                </div>

                                <Progress value={progressValue} className="h-3" />

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Objetivo: 50%</span>
                                    <span className={`font-medium ${conversionRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {conversionRate >= 50 ? ' Meta alcanzada' : ' En progreso'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rendimiento del Mes */}
                    <Card className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rendimiento del Mes</h3>
                                    <p className="text-sm text-muted-foreground">Tu progreso mensual</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl">
                                        <p className="text-sm text-muted-foreground mb-1">Cotizaciones</p>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{dashboard.totalQuotes}</p>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl">
                                        <p className="text-sm text-muted-foreground mb-1">Ventas</p>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{dashboard.paidQuotes}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Progreso</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {dashboard.paidQuotes} / {dashboard.totalQuotes}
                                        </span>
                                    </div>
                                    <Progress
                                        value={dashboard.totalQuotes > 0 ? (dashboard.paidQuotes / dashboard.totalQuotes) * 100 : 0}
                                        className="h-2"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Resumen Financiero */}
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white border-0 shadow-2xl">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6 text-blue-400" />
                            <h3 className="text-2xl font-bold">Resumen Financiero</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-400 mb-2">Subtotal</p>
                                <p className="text-3xl font-bold text-white">
                                    S/ {((dashboard.totalSales || 0) / 1.18).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400 mb-2">IGV (18%)</p>
                                <p className="text-3xl font-bold text-blue-400">
                                    S/ {((dashboard.totalSales || 0) - (dashboard.totalSales || 0) / 1.18).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400 mb-2">Total</p>
                                <p className="text-3xl font-bold text-green-400">
                                    S/ {(dashboard.totalSales || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400 mb-2">Promedio</p>
                                <p className="text-3xl font-bold text-purple-400">
                                    S/ {dashboard.paidQuotes > 0 ? ((dashboard.totalSales || 0) / dashboard.paidQuotes).toFixed(2) : '0.00'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}