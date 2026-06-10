import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, TrendingUp, Receipt, Download, Calculator } from 'lucide-react'

const ContadorDashboard = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Panel Contable.</h1>
                    <p className="text-muted-foreground">Hola, {user?.first_name} • Contador</p>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Exportar Todo</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-2" />
                        <h3 className="text-3xl font-bold">$15,240</h3>
                        <p className="text-sm text-muted-foreground">Ingresos Mes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Receipt className="w-10 h-10 text-red-600 mx-auto mb-2" />
                        <h3 className="text-3xl font-bold">$8,120</h3>
                        <p className="text-sm text-muted-foreground">Gastos Mes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <Calculator className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                        <h3 className="text-3xl font-bold">$7,120</h3>
                        <p className="text-sm text-muted-foreground">Utilidad Neta</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Reportes Disponibles</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['Estado de Resultados', 'Balance General', 'Flujo de Caja', 'Reporte de Impuestos', 'Conciliación Bancaria', 'Libro Diario'].map((rep, i) => (
                        <Button key={i} variant="outline" className="justify-start h-auto p-4">
                            <FileSpreadsheet className="w-5 h-5 mr-3 text-primary" />
                            <div className="text-left">
                                <p className="font-medium">{rep}</p>
                                <p className="text-xs text-muted-foreground">Actualizado hoy</p>
                            </div>
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default ContadorDashboard