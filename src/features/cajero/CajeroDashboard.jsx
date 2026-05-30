import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, ArrowUpRight, ArrowDownLeft, FileText, Lock, Printer } from 'lucide-react'

const CajeroDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Panel de Caja</h1>
                    <p className="text-muted-foreground">Hola, {user?.first_name} • Cajero</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="default">Caja Abierta</Badge>
                    <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" /> Imprimir Z</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <Wallet className="w-10 h-10 text-green-600 mx-auto mb-2" />
                        <h3 className="text-3xl font-bold">$450.00</h3>
                        <p className="text-sm text-muted-foreground">Efectivo en Caja</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <ArrowUpRight className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                        <h3 className="text-3xl font-bold">$1,240</h3>
                        <p className="text-sm text-muted-foreground">Ventas del Turno</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <ArrowDownLeft className="w-10 h-10 text-red-600 mx-auto mb-2" />
                        <h3 className="text-3xl font-bold">3</h3>
                        <p className="text-sm text-muted-foreground">Devoluciones</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Últimas Transacciones</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { id: '#V-001', amount: '+$45.00', type: 'Venta', time: '10:42 AM' },
                            { id: '#V-002', amount: '+$120.50', type: 'Venta', time: '10:38 AM' },
                            { id: '#D-001', amount: '-$15.00', type: 'Devolución', time: '10:15 AM' },
                        ].map((t, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                                <div>
                                    <p className="font-medium text-sm">{t.id}</p>
                                    <p className="text-xs text-muted-foreground">{t.type}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${t.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{t.amount}</p>
                                    <p className="text-xs text-muted-foreground">{t.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button className="flex-1" onClick={() => navigate('/cajero/cobrar')}>
                    <FileText className="w-4 h-4 mr-2" /> Iniciar Cobro
                </Button>
                <Button variant="destructive" className="flex-1">
                    <Lock className="w-4 h-4 mr-2" /> Cerrar Caja
                </Button>
            </div>
        </div>
    )
}

export default CajeroDashboard