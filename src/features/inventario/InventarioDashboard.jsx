import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, ArrowUpDown, Plus, BarChart3 } from 'lucide-react'

const InventarioDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Inventario</h1>
                    <p className="text-muted-foreground">Hola, {user?.first_name} • Encargado</p>
                </div>
                <Button onClick={() => navigate('/inventario/ajuste')}>
                    <Plus className="w-4 h-4 mr-2" /> Ajustar Stock
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Productos', value: '128', icon: Package },
                    { label: 'Stock Bajo', value: '3', icon: AlertTriangle, alert: true },
                    { label: 'Entradas Hoy', value: '12', icon: ArrowUpDown },
                    { label: 'Valor Inventario', value: '$8,450', icon: BarChart3 },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <stat.icon className={`w-8 h-8 ${stat.alert ? 'text-orange-500' : 'text-primary'}`} />
                            <div>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>Alertas de Stock</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {['Mouse Inalámbrico (2 uds)', 'Cable HDMI (1 ud)', 'Webcam HD (0 uds)'].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <span className="text-sm font-medium text-orange-800">{item}</span>
                                <Badge variant="secondary">Reabastecer</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-16" onClick={() => navigate('/inventario/entradas')}>
                    <ArrowUpDown className="w-5 h-5 mr-3" /> Registrar Entrada de Mercadería
                </Button>
                <Button variant="outline" className="justify-start h-16" onClick={() => navigate('/inventario/reportes')}>
                    <BarChart3 className="w-5 h-5 mr-3" /> Ver Reportes de Movimientos
                </Button>
            </div>
        </div>
    )
}

export default InventarioDashboard