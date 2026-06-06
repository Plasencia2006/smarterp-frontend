// src/features/business/InventoryManager.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, AlertTriangle, TrendingUp } from 'lucide-react'

export default function InventoryManager() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona productos y stock
                    </p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                    <Package className="w-4 h-4 mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">0</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Módulo en Desarrollo</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        El módulo de inventario estará disponible próximamente.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}