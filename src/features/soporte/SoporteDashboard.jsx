import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Headphones, Clock, CheckCircle, AlertCircle, Plus, Wrench } from 'lucide-react'

const SoporteDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Soporte Técnico</h1>
                    <p className="text-muted-foreground">Hola, {user?.first_name} • Técnico</p>
                </div>
                <Button onClick={() => navigate('/soporte/nueva-orden')}>
                    <Plus className="w-4 h-4 mr-2" /> Nueva Orden
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Tickets Abiertos', value: '5', icon: AlertCircle, color: 'text-orange-500' },
                    { label: 'En Proceso', value: '3', icon: Clock, color: 'text-blue-500' },
                    { label: 'Resueltos Hoy', value: '8', icon: CheckCircle, color: 'text-green-500' },
                    { label: 'Tiempo Promedio', value: '45m', icon: Headphones, color: 'text-purple-500' },
                ].map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                            <div>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>Órdenes de Servicio Recientes</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { id: 'OS-1024', client: 'Juan Pérez', status: 'En Proceso', time: 'Hace 2h' },
                            { id: 'OS-1023', client: 'TechZone Norte', status: 'Pendiente', time: 'Hace 4h' },
                            { id: 'OS-1022', client: 'María López', status: 'Resuelto', time: 'Ayer' },
                        ].map((os, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">{os.id} - {os.client}</p>
                                    <p className="text-xs text-muted-foreground">{os.time}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-muted-foreground" />
                                    <Badge variant={os.status === 'Resuelto' ? 'default' : os.status === 'En Proceso' ? 'secondary' : 'destructive'}>
                                        {os.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SoporteDashboard