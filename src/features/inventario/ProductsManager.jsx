import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI, getImageUrl } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Package, Plus, Search, Edit, Trash2, Loader2, Tag, Upload, X, Image as ImageIcon } from 'lucide-react'
import BulkImport from './BulkImport'
import ProductImageUpload from '@/components/ProductImageUpload'

export default function ProductsManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [showBulkImport, setShowBulkImport] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    const [formData, setFormData] = useState({
        name: '', sku: '', barcode: '', description: '',
        price: 0, costPrice: 0, stock: 0, minStock: 5,
        categoryId: '', unit: 'UNIDAD', imagePath: ''
    })

    // ✅ Debounce de 500ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const { data: categories } = useQuery({
        queryKey: ['inventory-categories'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.categories.list()
                return res.data?.success && Array.isArray(res.data.data) ? res.data.data : []
            } catch { return [] }
        }
    })

    const { data: products, isLoading } = useQuery({
        queryKey: ['inventory-products', debouncedSearch, selectedCategory],
        queryFn: async () => {
            try {
                const params = {}
                if (debouncedSearch && debouncedSearch.trim() !== '') {
                    params.search = debouncedSearch.trim()
                }
                if (selectedCategory && selectedCategory.trim() !== '') {
                    params.categoryId = selectedCategory
                }
                const res = await inventoryAPI.products.list(params)
                const apiData = res.data
                if (apiData?.success && Array.isArray(apiData.data)) {
                    return apiData.data
                }
                return []
            } catch (error) {
                console.error('Error cargando productos:', error)
                return []
            }
        }
    })

    const createMutation = useMutation({
        mutationFn: (data) => inventoryAPI.products.create(data),
        onSuccess: async (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Producto creado')

                // Si hay imagen pendiente, subirla
                if (formData._pendingImage) {
                    try {
                        await inventoryAPI.products.uploadImage(apiData.data.id, formData._pendingImage)
                        toast.success('✅ Imagen subida')
                    } catch (err) {
                        console.error('Error subiendo imagen:', err)
                    }
                }

                queryClient.invalidateQueries(['inventory-products'])
                setIsCreateOpen(false)
                resetForm()
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al crear')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => inventoryAPI.products.update(id, data),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Producto actualizado')
                queryClient.invalidateQueries(['inventory-products'])
                setIsEditOpen(false)
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al actualizar')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => inventoryAPI.products.delete(id),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Producto eliminado')
                queryClient.invalidateQueries(['inventory-products'])
                setIsDeleteOpen(false)
                setSelectedProduct(null)
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al eliminar')
    })

    const resetForm = () => setFormData({
        name: '', sku: '', barcode: '', description: '',
        price: 0, costPrice: 0, stock: 0, minStock: 5,
        categoryId: '', unit: 'UNIDAD', imagePath: ''
    })

    const handleCreate = (e) => {
        e.preventDefault()
        if (!formData.name || !formData.sku) {
            toast.error('Nombre y SKU son obligatorios')
            return
        }
        createMutation.mutate({
            ...formData,
            price: parseFloat(formData.price),
            costPrice: parseFloat(formData.costPrice),
            stock: parseInt(formData.stock),
            minStock: parseInt(formData.minStock)
        })
    }

    const handleUpdate = (e) => {
        e.preventDefault()
        updateMutation.mutate({
            id: selectedProduct.id,
            data: {
                ...formData,
                price: parseFloat(formData.price),
                costPrice: parseFloat(formData.costPrice),
                stock: parseInt(formData.stock),
                minStock: parseInt(formData.minStock)
            }
        })
    }

    const openEdit = (product) => {
        setSelectedProduct(product)
        setFormData({
            name: product.name || '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            description: product.description || '',
            price: product.price || 0,
            costPrice: product.costPrice || 0,
            stock: product.stock || 0,
            minStock: product.minStock || 5,
            categoryId: product.categoryId || '',
            unit: product.unit || 'UNIDAD',
            imagePath: product.imagePath || ''
        })
        setIsEditOpen(true)
    }

    const clearSearch = () => {
        setSearchTerm('')
        setDebouncedSearch('')
    }

    const getStockBadge = (stock, minStock) => {
        if (stock <= 0) return <Badge variant="destructive" className="text-xs">Sin stock</Badge>
        if (stock <= minStock) return <Badge className="bg-orange-500 text-xs">Stock bajo</Badge>
        return <Badge className="bg-green-600 text-xs">Disponible</Badge>
    }

    const getCategoryName = (categoryId) => {
        const category = categories?.find(c => c.id === categoryId)
        return category?.name || 'Sin categoría'
    }

    const getCategoryColor = (categoryId) => {
        const category = categories?.find(c => c.id === categoryId)
        return category?.color || '#6B7280'
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Productos</h1>
                    <p className="text-muted-foreground">Administra el catálogo de productos</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowBulkImport(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Carga Masiva
                    </Button>
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, SKU o código de barras..."
                                className="pl-10 pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="w-64">
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-background"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Todas las categorías</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {!isLoading && products && (
                        <div className="mt-3 text-sm text-muted-foreground">
                            {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                            {debouncedSearch && ` para "${debouncedSearch}"`}
                        </div>
                    )}
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : !products || products.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            {debouncedSearch ?
                                `No se encontraron productos para "${debouncedSearch}"` :
                                'No hay productos registrados'}
                        </p>
                        {debouncedSearch && (
                            <Button variant="outline" className="mt-4" onClick={clearSearch}>
                                Limpiar búsqueda
                            </Button>
                        )}
                        {!debouncedSearch && (
                            <Button className="mt-4" onClick={() => setShowBulkImport(true)} variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Importar Productos
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 cursor-pointer"
                        >
                            {product.categoryId && (
                                <div
                                    className="h-1.5 w-full"
                                    style={{ backgroundColor: getCategoryColor(product.categoryId) }}
                                />
                            )}
                            <CardContent className="p-4 flex flex-col h-full">
                                <div className="flex justify-center mb-3">
                                    {product.imagePath ? (
                                        <img
                                            src={getImageUrl(product.imagePath)}
                                            alt={product.name}
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 group-hover:scale-110">
                                            <Package className="w-8 h-8 text-blue-600" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-sm text-center truncate mb-1 group-hover:text-blue-600 transition-colors">
                                    {product.name}
                                </h3>
                                <p className="text-xs text-muted-foreground text-center mb-2">
                                    SKU: {product.sku}
                                </p>
                                <div className="flex items-center justify-center gap-1 mb-3 flex-wrap">
                                    {getStockBadge(product.stock, product.minStock)}
                                    {product.categoryId && (
                                        <Badge variant="outline" className="text-xs"
                                            style={{ borderColor: getCategoryColor(product.categoryId), color: getCategoryColor(product.categoryId) }}>
                                            <Tag className="w-3 h-3 mr-1" />
                                            {getCategoryName(product.categoryId)}
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-auto space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Stock:</span>
                                        <span className="font-bold text-sm">{product.stock}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Precio:</span>
                                        <span className="font-bold text-green-600 text-sm">
                                            S/ {parseFloat(product.price).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"
                                        onClick={(e) => { e.stopPropagation(); openEdit(product) }}>
                                        <Edit className="w-3 h-3 mr-1" /> Editar
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 text-red-600 hover:bg-red-50"
                                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setIsDeleteOpen(true) }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal CREAR */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nuevo Producto</DialogTitle>
                        <DialogDescription>Completa la información del producto</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>SKU *</Label>
                                <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
                            </div>
                        </div>

                        {/* ✅ Imagen del producto */}
                        <div className="space-y-2">
                            <Label>Imagen del Producto</Label>
                            <p className="text-xs text-muted-foreground">
                                💡 La imagen se subirá después de crear el producto
                            </p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Podrás agregar la imagen después de crear el producto
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <select className="w-full h-9 px-3 border rounded-md bg-background"
                                value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                                <option value="">Sin categoría</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Venta (S/)</Label>
                                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Costo (S/)</Label>
                                <Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Stock Inicial</Label>
                                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Mínimo</Label>
                                <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creando...' : 'Crear Producto'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal EDITAR */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Producto</DialogTitle>
                        <DialogDescription>Modifica la información del producto</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>SKU *</Label>
                                <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
                            </div>
                        </div>

                        {/* ✅ Imagen del producto - EDITAR */}
                        {selectedProduct && (
                            <div className="space-y-2">
                                <Label>Imagen del Producto</Label>
                                <ProductImageUpload
                                    productId={selectedProduct.id}
                                    currentImage={formData.imagePath}
                                    onImageUploaded={(data) => {
                                        setFormData({ ...formData, imagePath: data.filename })
                                        queryClient.invalidateQueries(['inventory-products'])
                                    }}
                                    onImageDeleted={() => {
                                        setFormData({ ...formData, imagePath: '' })
                                        queryClient.invalidateQueries(['inventory-products'])
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <select className="w-full h-9 px-3 border rounded-md bg-background"
                                value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                                <option value="">Sin categoría</option>
                                {categories?.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Precio Venta (S/)</Label>
                                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Costo (S/)</Label>
                                <Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Stock</Label>
                                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Mínimo</Label>
                                <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal ELIMINAR */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar Producto</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar <strong>{selectedProduct?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteMutation.mutate(selectedProduct.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal CARGA MASIVA */}
            <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Carga Masiva de Productos
                        </DialogTitle>
                        <DialogDescription>Importa múltiples productos desde un archivo CSV</DialogDescription>
                    </DialogHeader>
                    <BulkImport type="products" onSuccess={() => {
                        setShowBulkImport(false)
                        queryClient.invalidateQueries(['inventory-products'])
                        queryClient.invalidateQueries(['inventory-categories'])
                    }} />
                </DialogContent>
            </Dialog>
        </div>
    )
}