import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Users, Package, TrendingUp, Plus, Search } from 'lucide-react'

const VendedorDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const stats = [
        { label: 'Ventas Hoy', value: '$1,240', icon: ShoppingCart, change: '+12%' },
        { label: 'Clientes Atendidos', value: '18', icon: Users, change: '+5' },
        { label: 'Productos Vendidos', value: '34', icon: Package, change: '+8' },
        { label: 'Meta Diaria', value: '85%', icon: TrendingUp, change: '$850/$1000' },
    ]

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Panel de Ventas</h1>
                    <p className="text-muted-foreground">Hola, {user?.first_name} • Vendedor</p>
                </div>
                <Button onClick={() => navigate('/vendedor/nueva-venta')}>
                    <Plus className="w-4 h-4 mr-2" /> Nueva Venta
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <s.icon className="w-6 h-6 text-primary" />
                                <Badge variant="secondary">{s.change}</Badge>
                            </div>
                            <h3 className="text-2xl font-bold">{s.value}</h3>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/vendedor/clientes')}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
                        <div><h4 className="font-semibold">Gestionar Clientes</h4><p className="text-xs text-muted-foreground">Crear, buscar o asignar crédito</p></div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/vendedor/catalogo')}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg"><Package className="w-6 h-6 text-blue-600" /></div>
                        <div><h4 className="font-semibold">Catálogo de Productos</h4><p className="text-xs text-muted-foreground">Ver stock y precios actualizados</p></div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/vendedor/historial')}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
                        <div><h4 className="font-semibold">Historial de Ventas</h4><p className="text-xs text-muted-foreground">Revisar transacciones del día</p></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default VendedorDashboard