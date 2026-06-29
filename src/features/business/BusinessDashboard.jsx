import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users, Package, ShoppingCart, TrendingUp,
    AlertTriangle, Wallet, Activity, Clock,
    ChevronRight, BarChart3, DollarSign,
    ArrowUpCircle, ArrowDownCircle, ShoppingBag
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, AreaChart, Area
} from 'recharts'

// Colores para gráficos
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function BusinessDashboard() {
    const navigate = useNavigate()

    // 📊 Obtener estadísticas
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => {
            try {
                const res = await dashboardAPI.getStats()
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener estadísticas:', error)
                return null
            }
        },
        refetchInterval: 30000
    })

    if (loadingStats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    // Preparar datos para gráfico de ventas
    const salesData = stats?.salesLast7Days ?
        Object.entries(stats.salesLast7Days).map(([date, amount]) => ({
            date: new Date(date).toLocaleDateString('es-PE', { weekday: 'short' }),
            ventas: parseFloat(amount).toFixed(2),
            fullDate: date
        })) : []

    // Preparar datos para gráfico de categorías
    const categoryData = stats?.productsByCategory ?
        Object.entries(stats.productsByCategory).map(([name, value]) => ({
            name,
            value
        })) : []

    // Métricas clave
    const totalVentasMes = parseFloat(stats?.monthlySales || 0)
    const totalVentasHoy = parseFloat(stats?.dailySales || 0)
    const crecimientoHoy = totalVentasHoy > 0 ? 12.5 : 0 // Ejemplo
    const totalProductos = stats?.totalProducts || 0
    const stockBajo = stats?.lowStockProducts || 0
    const cajasAbiertas = stats?.openRegisters || 0

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Dashboard de TechZone Norte
                    </h1>
                    <p className="text-muted-foreground">
                        Panel de control y análisis del negocio
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-4 py-2">
                        <Activity className="w-4 h-4 mr-2 text-green-600" />
                        Negocio Activo
                    </Badge>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Ventas del Mes
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            S/ {totalVentasMes.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`flex items-center text-sm ${crecimientoHoy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {crecimientoHoy >= 0 ? <ArrowUpCircle className="w-4 h-4 mr-1" /> : <ArrowDownCircle className="w-4 h-4 mr-1" />}
                                {crecimientoHoy}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs ayer</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hoy: S/ {totalVentasHoy.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Productos
                        </CardTitle>
                        <Package className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {totalProductos}
                        </div>
                        {stockBajo > 0 && (
                            <Badge variant="destructive" className="mt-2">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {stockBajo} con stock bajo
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Cajas Abiertas
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {cajasAbiertas}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Puntos de venta activos
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Valor Inventario
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            S/ {parseFloat(stats?.inventoryValue || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Stock total valorizado
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Ventas - Línea */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Tendencia de Ventas - Últimos 7 Días
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {salesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={salesData}>
                                    <defs>
                                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value) => [`S/ ${value}`, 'Ventas']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="ventas"
                                        stroke="#3B82F6"
                                        fillOpacity={1}
                                        fill="url(#colorVentas)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                <ShoppingBag className="w-12 h-12 mr-2 opacity-50" />
                                No hay datos de ventas disponibles
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Gráfico de Barras - Ventas por Día */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            Ventas Diarias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {salesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={salesData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value) => [`S/ ${value}`, 'Ventas']}
                                    />
                                    <Bar dataKey="ventas" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                Sin datos
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Gráfico de Dona - Distribución por Categoría */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            Productos por Categoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                Sin categorías registradas
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Acciones Rápidas */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Accesos Directos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: 'Gestionar Usuarios', desc: 'Administra usuarios del sistema', icon: Users, color: 'blue', path: '/business/users' },
                        { title: 'Inventario', desc: 'Productos y control de stock', icon: Package, color: 'green', path: '/business/inventory' },
                        { title: 'Ventas', desc: 'Registro y seguimiento', icon: ShoppingCart, color: 'purple', path: '/business/sales' },
                        { title: 'Reportes', desc: 'Análisis y estadísticas', icon: BarChart3, color: 'orange', path: '/business/reports' },
                        { title: 'Caja', desc: 'Gestión de cajas y arqueos', icon: Wallet, color: 'cyan', path: '/business/cashier' },
                        { title: 'Configuración', desc: 'Ajustes del negocio', icon: DollarSign, color: 'gray', path: '/business/settings' },
                    ].map((item, index) => (
                        <Card
                            key={index}
                            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                            onClick={() => navigate(item.path)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 bg-${item.color}-100 dark:bg-${item.color}-900 rounded-lg`}>
                                            <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Información del Negocio */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nombre:</p>
                            <p className="font-semibold text-gray-900 dark:text-white">TechZone Norte</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Cotizaciones Pendientes:</p>
                            <Badge className="mt-1">
                                {stats?.pendingQuotes || 0}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tu Rol:</p>
                            <Badge variant="outline" className="mt-1">ADMINISTRADOR</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}