import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Package,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    FileText,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'

export default function InventarioDashboard() {
    const navigate = useNavigate()

    // ✅ Estadísticas principales
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['inventory-dashboard-stats'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.dashboard.getStats()
                return res.data?.success ? res.data.data : null
            } catch { return null }
        }
    })

    // ✅ Gráfico de movimientos
    const { data: movementsChart } = useQuery({
        queryKey: ['inventory-movements-chart'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.dashboard.getMovementsChart()
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    // ✅ Distribución por categorías
    const { data: categoriesDistribution } = useQuery({
        queryKey: ['inventory-categories-distribution'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.dashboard.getCategoriesDistribution()
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    // ✅ Productos con stock bajo
    const { data: lowStockProducts } = useQuery({
        queryKey: ['inventory-low-stock-products'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.dashboard.getLowStockProducts()
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    // ✅ Movimientos recientes
    const { data: recentMovements } = useQuery({
        queryKey: ['inventory-recent-movements'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.dashboard.getRecentMovements()
                return res.data?.success ? res.data.data : []
            } catch { return [] }
        }
    })

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
                    <p className="text-muted-foreground">Panel de control y estadísticas</p>
                </div>
                <Button onClick={() => navigate('/inventario/stock')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Ajustar Stock
                </Button>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Productos</p>
                                <p className="text-3xl font-bold">{stats?.totalProducts || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Stock Bajo</p>
                                <p className="text-3xl font-bold text-orange-600">{stats?.lowStock || 0}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Entradas Hoy</p>
                                <p className="text-3xl font-bold text-green-600">{stats?.entriesToday || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Valor Inventario</p>
                                <p className="text-3xl font-bold">
                                    S/ {parseFloat(stats?.inventoryValue || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Movimientos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Movimientos de Stock (Últimos 7 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {movementsChart && movementsChart.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={movementsChart}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="entries" fill="#10B981" name="Entradas" />
                                    <Bar dataKey="exits" fill="#EF4444" name="Salidas" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No hay datos de movimientos
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Distribución por Categorías */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución por Categorías</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoriesDistribution && categoriesDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoriesDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoriesDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No hay datos de categorías
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Alertas y Accesos Directos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertas de Stock */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            Alertas de Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lowStockProducts && lowStockProducts.length > 0 ? (
                            <div className="space-y-3">
                                {lowStockProducts.slice(0, 5).map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Stock: {product.quantity} / Mínimo: {product.minStock}
                                            </p>
                                        </div>
                                        <Badge variant={product.status === 'OUT_OF_STOCK' ? 'destructive' : 'default'}>
                                            {product.status === 'OUT_OF_STOCK' ? 'Sin Stock' : 'Bajo'}
                                        </Badge>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={() => navigate('/inventario/alerts')}
                                >
                                    Ver Todas las Alertas
                                    <ArrowUpRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                <div className="text-center">
                                    <Package className="w-12 h-12 mx-auto mb-2 text-green-600" />
                                    <p>¡Todo en orden!</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Accesos Directos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Accesos Directos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => navigate('/inventario/stock')}
                            >
                                <Plus className="w-6 h-6" />
                                <span>Ajustar Stock</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => navigate('/inventario/products')}
                            >
                                <Package className="w-6 h-6" />
                                <span>Nuevo Producto</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center gap-2"
                                onClick={() => navigate('/inventario/purchases')}
                            >
                                <ShoppingCart className="w-6 h-6" />
                                <span>Órdenes de Compra</span>
                            </Button>

                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Movimientos Recientes */}
            <Card>
                <CardHeader>
                    <CardTitle>Movimientos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentMovements && recentMovements.length > 0 ? (
                        <div className="space-y-3">
                            {recentMovements.slice(0, 10).map((movement) => (
                                <div key={movement.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {movement.type === 'IN' ? (
                                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                                        )}
                                        <div>
                                            <p className="font-medium">{movement.productName}</p>
                                            <p className="text-sm text-muted-foreground">{movement.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                            {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(movement.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            No hay movimientos recientes
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}