import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Package,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Box,
    Layers,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Download
} from 'lucide-react'
import { toast } from 'sonner'

export default function InventoryDashboard() {
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(20)

    // 📊 Dashboard de Inventario
    const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
        queryKey: ['admin-inventory-dashboard'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.getAdminDashboard()
                console.log('📊 Inventory dashboard:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener dashboard:', error)
                return null
            }
        }
    })

    // 📋 Productos con Stock
    const { data: productsData, isLoading: loadingProducts } = useQuery({
        queryKey: ['admin-inventory-products', currentPage, pageSize],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.getAdminProducts(currentPage, pageSize)
                console.log('📋 Products:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener productos:', error)
                return null
            }
        }
    })

    // 📊 Estadísticas por Categoría
    const { data: categoryStats, isLoading: loadingCategories } = useQuery({
        queryKey: ['admin-inventory-categories'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.getAdminStatsByCategory()
                console.log('📊 Category stats:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error al obtener categorías:', error)
                return null
            }
        }
    })

    const handleExportCSV = () => {
        if (!productsData?.content || productsData.content.length === 0) {
            toast.error('❌ No hay productos para exportar')
            return
        }

        // ✅ BOM para UTF-8 (Excel compatible)
        const BOM = '\uFEFF'

        // Headers mejorados
        const headers = [
            'PRODUCTO',
            'SKU',
            'CATEGORÍA',
            'PRECIO UNITARIO',
            'STOCK ACTUAL',
            'STOCK MÍNIMO',
            'ESTADO',
            'VALOR TOTAL INVENTARIO',
            'FECHA CREACIÓN'
        ]

        // Datos formateados
        const rows = productsData.content.map(product => [
            `"${product.name}"`,  // Entre comillas por si tiene comas
            `"${product.sku || ''}"`,
            `"${product.categoryName || 'Sin categoría'}"`,
            `S/ ${parseFloat(product.price).toFixed(2)}`,
            product.stock,
            product.minStock,
            product.isActive ? 'ACTIVO' : 'INACTIVO',
            `S/ ${(parseFloat(product.price) * product.stock).toFixed(2)}`,
            new Date(product.createdAt).toLocaleDateString('es-PE')
        ])

        // Agregar resumen al inicio
        const totalProductos = productsData.totalElements
        const totalValor = productsData.content
            .reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0)

        const resumen = [
            'INVENTARIO - TECHZONE NORTE',
            `Fecha de Exportación: ${new Date().toLocaleString('es-PE')}`,
            '',
            'RESUMEN GENERAL',
            `Total de Productos: ${totalProductos}`,
            `Valor Total del Inventario: S/ ${totalValor.toFixed(2)}`,
            '',
            'DETALLE DE PRODUCTOS',
            headers.join(';')  // Usar punto y coma como separador
        ]

        // Crear contenido CSV con punto y coma (mejor para Excel en español)
        const csvContent = [
            BOM,
            ...resumen,
            ...rows.map(row => row.join(';'))
        ].join('\n')

        // Crear blob con UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        // Nombre de archivo con fecha
        const fileName = `inventario_techzone_${new Date().toISOString().split('T')[0]}.csv`

        link.href = URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success(`✅ Exportado ${totalProductos} productos correctamente`)
    }

    if (loadingDashboard || loadingProducts) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando inventario...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Inventario
                </h1>
                <p className="text-muted-foreground">
                    Análisis completo del inventario y stock
                </p>
            </div>

            {/* Stats Principales */}
            {dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Productos
                            </CardTitle>
                            <Package className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData.totalProductos || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.productosActivos || 0} activos
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Stock Bajo
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {dashboardData.stockBajo || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.sinStock || 0} sin stock
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Valor del Inventario
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                S/ {parseFloat(dashboardData.valorTotalInventario || 0).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Valor total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Alertas
                            </CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {dashboardData.alertasStock || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Requieren atención
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Productos Bajo Stock */}
            {dashboardData?.productosBajoStock && dashboardData.productosBajoStock.length > 0 && (
                <Card className="mb-6 border-orange-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="w-5 h-5" />
                            Productos con Stock Bajo ({dashboardData.productosBajoStock.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {dashboardData.productosBajoStock.slice(0, 6).map((product, index) => (
                                <div key={index} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-sm">{product.productName}</p>
                                        <Badge variant="outline" className="text-xs">
                                            {product.sku}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Stock:</span>
                                        <span className="font-bold text-orange-600">
                                            {product.quantity} / {product.minStock}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Categorías - VERSIÓN SIMPLIFICADA */}
            {categoryStats && categoryStats.categories && categoryStats.categories.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            Productos por Categoría ({categoryStats.totalCategories})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryStats.categories.map((category, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold truncate">{category.categoryName}</p>
                                        <Badge>{category.totalProductos} productos</Badge>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between font-semibold text-green-600">
                                            <span>Valor:</span>
                                            <span>S/ {parseFloat(category.valorTotal).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Productos */}
            {dashboardData?.topProductosStock && dashboardData.topProductosStock.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Top 5 Productos con Más Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Valor Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData.topProductosStock.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{product.productName}</TableCell>
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary">{product.quantity} unid.</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            S/ {parseFloat(product.price).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            S/ {parseFloat(product.totalValue).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Lista de Productos */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Todos los Productos ({productsData?.totalElements || 0})
                        </CardTitle>
                        <Button onClick={handleExportCSV} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {productsData?.content && productsData.content.length > 0 ? (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {productsData.content.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{product.sku}</Badge>
                                                </TableCell>
                                                <TableCell>
    {product.categoryName && product.categoryName !== 'Sin categoría' ? (
        <Badge variant="outline" className="max-w-[150px] truncate">
            {product.categoryName}
        </Badge>
    ) : (
        <span className="text-muted-foreground text-sm">Sin categoría</span>
    )}
</TableCell>
                                                <TableCell className="text-right">
                                                    S/ {parseFloat(product.price).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge
                                                        variant={
                                                            product.stock === 0 ? 'destructive' :
                                                                product.stock < product.minimumStock ? 'secondary' :
                                                                    'default'
                                                        }
                                                    >
                                                        {product.stock}
                                                    </Badge>
                                                </TableCell>

                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Paginación */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {productsData.content.length} de {productsData.totalElements} productos
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage >= productsData.totalPages - 1}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No se encontraron productos</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}