import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Plus, Edit, Trash2, User, Phone, Mail, MapPin, Star } from 'lucide-react'

export default function CustomerManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        documentType: 'DNI',
        documentNumber: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        isFrequent: false
    })

    // Obtener clientes
    const { data: customers, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            try {
                const res = await customerAPI.getAll()
                return res.data?.success ? res.data.data : []
            } catch (error) {
                console.error('Error al obtener clientes:', error)
                return []
            }
        }
    })

    // Crear/Actualizar cliente
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingCustomer) {
                return customerAPI.update(editingCustomer.id, data)
            }
            return customerAPI.create(data)
        },
        onSuccess: () => {
            toast.success(editingCustomer ? ' Cliente actualizado' : ' Cliente creado')
            queryClient.invalidateQueries(['customers'])
            setIsFormOpen(false)
            resetForm()
        },
        onError: (err) => {
            console.error('Error al guardar:', err)
            toast.error(err.response?.data?.message || 'Error al guardar')
        }
    })

    // Eliminar cliente
    const deleteMutation = useMutation({
        mutationFn: (id) => customerAPI.delete(id),
        onSuccess: () => {
            toast.success(' Cliente eliminado')
            queryClient.invalidateQueries(['customers'])
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error al eliminar')
    })

    const resetForm = () => {
        setFormData({
            name: '',
            documentType: 'DNI',
            documentNumber: '',
            email: '',
            phone: '',
            address: '',
            notes: '',
            isFrequent: false
        })
        setEditingCustomer(null)
    }

    const handleEdit = (customer) => {
        setEditingCustomer(customer)
        setFormData({
            name: customer.name || '',
            documentType: customer.documentType || 'DNI',
            documentNumber: customer.documentNumber || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            notes: customer.notes || '',
            isFrequent: customer.isFrequent || false
        })
        setIsFormOpen(true)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('El nombre es obligatorio')
            return
        }
        saveMutation.mutate(formData)
    }

    const filteredCustomers = customers?.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documentNumber?.includes(searchTerm) ||
        c.phone?.includes(searchTerm)
    )

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Clientes Frecuentes</h1>
                        <p className="text-muted-foreground">Gestión de clientes del negocio</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsFormOpen(true) }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>

                {/* Buscador */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, documento o teléfono..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Clientes */}
                {isLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Cargando clientes...</p>
                    </div>
                ) : filteredCustomers?.length === 0 ? (
                    <Card>
                        <CardContent className="p-10 text-center">
                            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No hay clientes registrados</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'Comienza agregando tu primer cliente'}
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => { resetForm(); setIsFormOpen(true) }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Cliente
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredCustomers?.map(customer => (
                            <Card key={customer.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{customer.name}</h3>
                                                    {customer.isFrequent && (
                                                        <Badge className="bg-yellow-500">
                                                            <Star className="w-3 h-3 mr-1" />
                                                            Frecuente
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                    {customer.documentNumber && (
                                                        <span>{customer.documentType}: {customer.documentNumber}</span>
                                                    )}
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                    {customer.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {customer.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(customer)}
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm('¿Eliminar este cliente?')) {
                                                        deleteMutation.mutate(customer.id)
                                                    }
                                                }}
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
            </div>

            {/* Modal de Formulario */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Documento</Label>
                                <select
                                    className="w-full h-10 px-3 border rounded-md"
                                    value={formData.documentType}
                                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                >
                                    <option value="DNI">DNI</option>
                                    <option value="RUC">RUC</option>
                                    <option value="CE">Carnet Extranjería</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Número de Documento</Label>
                                <Input
                                    value={formData.documentNumber}
                                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notas</Label>
                            <Input
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isFrequent"
                                checked={formData.isFrequent}
                                onChange={(e) => setFormData({ ...formData, isFrequent: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="isFrequent">Cliente frecuente</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}