// src/features/business/SalesManager.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, TrendingUp, DollarSign, Package } from 'lucide-react'

export default function SalesManager() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
                    <p className="text-muted-foreground mt-1">
                        Registro y seguimiento de ventas
                    </p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Nueva Venta
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Módulo en Desarrollo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        El módulo de ventas estará disponible próximamente.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}