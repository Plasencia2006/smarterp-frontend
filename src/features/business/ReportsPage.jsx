// src/features/business/ReportsPage.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, FileText } from 'lucide-react'

export default function ReportsPage() {
    const reports = [
        { name: 'Ventas del Mes', icon: BarChart3, description: 'Reporte de ventas mensuales' },
        { name: 'Inventario Actual', icon: FileText, description: 'Stock y productos' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
                <p className="text-muted-foreground mt-1">
                    Genera y descarga reportes del negocio
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => {
                    const Icon = report.icon
                    return (
                        <Card key={report.name} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{report.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{report.description}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full">
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}