import { useQuery } from '@tanstack/react-query'
import { vendedorAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ShoppingCart, DollarSign, TrendingUp, Clock,
    CheckCircle2, AlertCircle, BarChart3
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!dashboard) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No hay datos disponibles</p>
            </div>
        )
    }

    const stats = [
        {
            title: 'Cotizaciones Hoy',
            value: dashboard.quotesToday || 0,
            icon: ShoppingCart,
            color: 'bg-blue-500',
            description: 'Cotizaciones creadas hoy'
        },
        {
            title: 'Ventas Hoy',
            value: `S/ ${(dashboard.salesToday || 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'bg-green-500',
            description: 'Total vendido hoy'
        },
        {
            title: 'Ventas 7 Días',
            value: `S/ ${(dashboard.salesLast7Days || 0).toFixed(2)}`,
            icon: TrendingUp,
            color: 'bg-purple-500',
            description: 'Total últimos 7 días'
        },
        {
            title: 'Pendientes',
            value: dashboard.pendingQuotes || 0,
            icon: Clock,
            color: 'bg-orange-500',
            description: 'Cotizaciones sin cobrar'
        },
        {
            title: 'Pagadas',
            value: dashboard.paidQuotes || 0,
            icon: CheckCircle2,
            color: 'bg-emerald-500',
            description: 'Ventas completadas'
        },
        {
            title: 'Tasa Conversión',
            value: `${(dashboard.conversionRate || 0).toFixed(1)}%`,
            icon: BarChart3,
            color: 'bg-indigo-500',
            description: 'Cotizaciones que se convierten en ventas'
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Dashboard del Vendedor</h1>
                    <p className="text-muted-foreground">Resumen de tu actividad de ventas</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon
                        return (
                            <Card key={idx}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-lg ${stat.color}`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Resumen */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen General</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Cotizaciones</p>
                                <p className="text-2xl font-bold text-blue-600">{dashboard.totalQuotes}</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Vendido</p>
                                <p className="text-2xl font-bold text-green-600">S/ {dashboard.totalSales.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Pendientes</p>
                                <p className="text-2xl font-bold text-orange-600">{dashboard.pendingQuotes}</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Conversión</p>
                                <p className="text-2xl font-bold text-purple-600">{dashboard.conversionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}