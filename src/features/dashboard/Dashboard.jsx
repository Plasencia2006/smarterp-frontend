import { useEffect } from 'react'
import { authStore } from '@store/authStore'
import { useNavigate } from 'react-router-dom'
import {
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Users,
    AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'

export const Dashboard = () => {
    const navigate = useNavigate()
    const { user, selectedBusiness, hasPermission } = authStore()

    useEffect(() => {
        if (!selectedBusiness) {
            navigate('/select-business')
        }
    }, [selectedBusiness, navigate])

    if (!selectedBusiness) return null

    const stats = [
        {
            title: 'Productos',
            value: '0',
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            permission: 'inventory.view',
            path: '/inventory'
        },
        {
            title: 'Ventas Hoy',
            value: '$0.00',
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
            permission: 'sales.view',
            path: '/sales'
        },
        {
            title: 'Órdenes',
            value: '0',
            icon: ShoppingCart,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            permission: 'sales.view',
            path: '/sales'
        },
        {
            title: 'Usuarios',
            value: '0',
            icon: Users,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            permission: 'users.view',
            path: '/users'
        },
    ]

    const visibleStats = stats.filter(stat => !stat.permission || hasPermission(stat.permission))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Bienvenido a {selectedBusiness.name}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleStats.map((stat) => (
                    <Card
                        key={stat.title}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => stat.path && navigate(stat.path)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bg} p-2 rounded-md`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                Sin datos disponibles
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Alertas */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Alertas de Inventario
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            No hay productos con stock bajo
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Rendimiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Las ventas están estables esta semana
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Accesos Rápidos */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Accesos Rápidos</h2>
                <div className="grid gap-3 md:grid-cols-3">
                    {hasPermission('sales.create') && (
                        <Button onClick={() => navigate('/sales/new')} className="w-full">
                            Nueva Venta
                        </Button>
                    )}
                    {hasPermission('inventory.create') && (
                        <Button onClick={() => navigate('/inventory/products/new')} variant="outline" className="w-full">
                            Agregar Producto
                        </Button>
                    )}
                    {hasPermission('reports.view') && (
                        <Button onClick={() => navigate('/reports')} variant="outline" className="w-full">
                            Ver Reportes
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard