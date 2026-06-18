import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Tag, Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'

export default function CategoriesManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'tag'
    })

    const { data: categories, isLoading } = useQuery({
        queryKey: ['inventory-categories', searchTerm],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.categories.list({ search: searchTerm })
                const apiData = res.data
                if (apiData?.success && Array.isArray(apiData.data)) {
                    return apiData.data
                }
                return []
            } catch (error) {
                console.error('Error cargando categorías:', error)
                return []
            }
        }
    })

    const createMutation = useMutation({
        mutationFn: (data) => inventoryAPI.categories.create(data),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Categoría creada')
                queryClient.invalidateQueries(['inventory-categories'])
                setIsCreateOpen(false)
                resetForm()
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al crear')
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => inventoryAPI.categories.update(id, data),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Categoría actualizada')
                queryClient.invalidateQueries(['inventory-categories'])
                setIsEditOpen(false)
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al actualizar')
    })

    const deleteMutation = useMutation({
        mutationFn: (id) => inventoryAPI.categories.delete(id),
        onSuccess: (response) => {
            const apiData = response.data
            if (apiData?.success) {
                toast.success('✅ Categoría eliminada')
                queryClient.invalidateQueries(['inventory-categories'])
                setIsDeleteOpen(false)
            }
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al eliminar')
    })

    const resetForm = () => setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'tag'
    })

    const handleCreate = (e) => {
        e.preventDefault()
        if (!formData.name) {
            toast.error('El nombre es obligatorio')
            return
        }
        createMutation.mutate(formData)
    }

    const handleUpdate = (e) => {
        e.preventDefault()
        updateMutation.mutate({ id: selectedCategory.id, data: formData })
    }

    const openEdit = (category) => {
        setSelectedCategory(category)
        setFormData({
            name: category.name || '',
            description: category.description || '',
            color: category.color || '#3B82F6',
            icon: category.icon || 'tag'
        })
        setIsEditOpen(true)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Categorías de Productos</h1>
                    <p className="text-muted-foreground">Organiza tus productos por categorías</p>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar categoría..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : !categories || categories.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay categorías registradas</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Card key={category.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: category.color || '#3B82F6' }}
                                        >
                                            <Tag className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg">{category.name}</h3>
                                            {category.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600"
                                            onClick={() => { setSelectedCategory(category); setIsDeleteOpen(true) }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modales de Crear, Editar y Eliminar */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Categoría</DialogTitle>
                        <DialogDescription>Completa los datos de la categoría</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creando...' : 'Crear'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Categoría</DialogTitle>
                        <DialogDescription>Modifica los datos de la categoría</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Categoría</DialogTitle>
                        <DialogDescription>
                            ¿Eliminar <strong>{selectedCategory?.name}</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteMutation.mutate(selectedCategory.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}