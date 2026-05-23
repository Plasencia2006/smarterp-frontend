import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessAPI, usersAPI, membershipAPI } from '@services/django.api'
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@components/ui/dialog'
import { Label } from '@components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { Badge } from '@components/ui/badge'
import {
    Building2, Plus, Search, Users, UserPlus, Mail, Phone, MapPin,
    Shield, Trash2, Edit, X
} from 'lucide-react'
import { toast } from 'sonner'

export const BusinessPage = () => {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false)
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [viewingAdmins, setViewingAdmins] = useState(null)

    // Form states
    const [businessForm, setBusinessForm] = useState({
        name: '', description: '', type: 'RETAIL',
        email: '', phone: '', address: ''
    })
    const [adminForm, setAdminForm] = useState({
        user_id: '', role: 'ADMIN'
    })

    // Fetch negocios
    const { data: businesses, isLoading: loadingBusinesses } = useQuery({
        queryKey: ['businesses', searchTerm],
        queryFn: async () => {
            const params = searchTerm ? { search: searchTerm } : {}
            const res = await businessAPI.list(params)
            return res.data?.results || res.data || []
        }
    })

    // Fetch usuarios disponibles - ✅ AHORA MUESTRA TODOS LOS USUARIOS
    const { data: users, isLoading: loadingUsers } = useQuery({
        queryKey: ['users-for-admins'],
        queryFn: async () => {
            const res = await usersAPI.list()
            return res.data?.results || res.data || []
        }
    })

    // Fetch admins de un negocio específico
    const { data: businessAdmins, isLoading: loadingAdmins } = useQuery({
        queryKey: ['business-admins', viewingAdmins?.id],
        queryFn: () => membershipAPI.getBusinessAdmins(viewingAdmins.id),
        enabled: !!viewingAdmins
    })

    // Mutación: Crear negocio
    const createMutation = useMutation({
        mutationFn: (data) => businessAPI.create(data),
        onSuccess: () => {
            toast.success('Negocio creado exitosamente')
            queryClient.invalidateQueries(['businesses'])
            setIsCreateOpen(false)
            resetBusinessForm()
        }
    })

    // Mutación: Editar negocio
    const editMutation = useMutation({
        mutationFn: ({ id, data }) => businessAPI.update(id, data),
        onSuccess: () => {
            toast.success('Negocio actualizado exitosamente')
            queryClient.invalidateQueries(['businesses'])
            setIsEditOpen(false)
            setSelectedBusiness(null)
        }
    })

    // Mutación: Eliminar negocio
    const deleteMutation = useMutation({
        mutationFn: (id) => businessAPI.delete(id),
        onSuccess: () => {
            toast.success('Negocio eliminado exitosamente')
            queryClient.invalidateQueries(['businesses'])
        }
    })

    // Mutación: Asignar admin
    const assignAdminMutation = useMutation({
        mutationFn: (data) => membershipAPI.assignAdmin(data),
        onSuccess: () => {
            toast.success('Administrador asignado exitosamente')
            queryClient.invalidateQueries(['business-admins'])
            setAdminForm({ user_id: '', role: 'ADMIN' })
        }
    })

    // Mutación: Revocar acceso
    const revokeMutation = useMutation({
        mutationFn: (membershipId) => membershipAPI.revokeAccess(membershipId),
        onSuccess: () => {
            toast.success('Acceso revocado exitosamente')
            queryClient.invalidateQueries(['business-admins'])
        }
    })

    const resetBusinessForm = () => setBusinessForm({
        name: '', description: '', type: 'RETAIL',
        email: '', phone: '', address: ''
    })

    const handleCreateBusiness = () => {
        if (!businessForm.name) {
            toast.error('El nombre del negocio es requerido')
            return
            
        }
        createMutation.mutate(businessForm)
    }

    const handleEditBusiness = () => {
        if (!selectedBusiness || !businessForm.name) {
            toast.error('El nombre del negocio es requerido')
            return
        }
        editMutation.mutate({ id: selectedBusiness.id, data: businessForm })
    }

    const handleAssignAdmin = () => {
        if (!selectedBusiness || !adminForm.user_id) {
            toast.error('Seleccione un usuario')
            return
        }
        assignAdminMutation.mutate({
            business_id: selectedBusiness.id,
            user_id: adminForm.user_id,
            role: adminForm.role
        })
    }

    const openEditModal = (business) => {
        setSelectedBusiness(business)
        setBusinessForm({
            name: business.name || '',
            description: business.description || '',
            type: business.type || 'RETAIL',
            email: business.email || '',
            phone: business.phone || '',
            address: business.address || ''
        })
        setIsEditOpen(true)
    }

    const openAssignDialog = (business) => {
        setSelectedBusiness(business)
        setViewingAdmins(business)
        setIsAssignAdminOpen(true)
    }

    const getRoleBadgeColor = (role) => {
        const colors = {
            'OWNER': 'bg-purple-100 text-purple-800 border-purple-300',
            'ADMIN': 'bg-blue-100 text-blue-800 border-blue-300',
            'MANAGER': 'bg-green-100 text-green-800 border-green-300',
            'VENDEDOR': 'bg-gray-100 text-gray-800 border-gray-300',
            'CLIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300'
        }
        return colors[role] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Negocios</h1>
                    <p className="text-muted-foreground">Administra los negocios y asigna administradores</p>
                </div>
                <Button onClick={() => { resetBusinessForm(); setIsCreateOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Negocio
                </Button>
            </div>

            {/* Búsqueda */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar negocio..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista de Negocios */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loadingBusinesses ? (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">Cargando negocios...</p>
                    </div>
                ) : businesses?.length === 0 ? (
                    <div className="col-span-full text-center py-10">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay negocios registrados</p>
                    </div>
                ) : (
                    businesses?.map(business => (
                        <Card key={business.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary" />
                                        <CardTitle className="text-lg">{business.name}</CardTitle>
                                    </div>
                                    <Badge variant={business.is_active ? 'default' : 'secondary'}>
                                        {business.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground line-clamp-2">{business.description || 'Sin descripción'}</p>
                                    {business.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            <span>{business.email}</span>
                                        </div>
                                    )}
                                    {business.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3" />
                                            <span>{business.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3 h-3" />
                                        <span>{business.total_members || 0} miembros</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Tipo: {business.type}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openAssignDialog(business)}
                                    >
                                        <UserPlus className="w-3 h-3 mr-1" /> Admins
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditModal(business)}
                                    >
                                        <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            if (confirm(`¿Eliminar "${business.name}"?`)) {
                                                deleteMutation.mutate(business.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal: Crear Negocio */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Negocio</DialogTitle>
                        <DialogDescription>
                            Ingresa la información del nuevo negocio
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre del Negocio *</Label>
                            <Input
                                value={businessForm.name}
                                onChange={e => setBusinessForm({ ...businessForm, name: e.target.value })}
                                placeholder="Ej: Tienda Principal"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Negocio</Label>
                            <Select
                                value={businessForm.type}
                                onValueChange={v => setBusinessForm({ ...businessForm, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RETAIL">Retail/Tienda</SelectItem>
                                    <SelectItem value="RESTAURANT">Restaurante</SelectItem>
                                    <SelectItem value="PHARMA">Farmacia</SelectItem>
                                    <SelectItem value="TECH">Tecnología</SelectItem>
                                    <SelectItem value="SERVICE">Servicios</SelectItem>
                                    <SelectItem value="MANUFACTURING">Manufactura</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                value={businessForm.description}
                                onChange={e => setBusinessForm({ ...businessForm, description: e.target.value })}
                                placeholder="Descripción del negocio"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={businessForm.email}
                                    onChange={e => setBusinessForm({ ...businessForm, email: e.target.value })}
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={businessForm.phone}
                                    onChange={e => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                    placeholder="+51 999 999 999"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                                value={businessForm.address}
                                onChange={e => setBusinessForm({ ...businessForm, address: e.target.value })}
                                placeholder="Av. Principal 123"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateBusiness} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creando...' : 'Crear Negocio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar Negocio */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Negocio</DialogTitle>
                        <DialogDescription>
                            Modifica la información del negocio
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre del Negocio *</Label>
                            <Input
                                value={businessForm.name}
                                onChange={e => setBusinessForm({ ...businessForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Negocio</Label>
                            <Select
                                value={businessForm.type}
                                onValueChange={v => setBusinessForm({ ...businessForm, type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RETAIL">Retail/Tienda</SelectItem>
                                    <SelectItem value="RESTAURANT">Restaurante</SelectItem>
                                    <SelectItem value="PHARMA">Farmacia</SelectItem>
                                    <SelectItem value="TECH">Tecnología</SelectItem>
                                    <SelectItem value="SERVICE">Servicios</SelectItem>
                                    <SelectItem value="MANUFACTURING">Manufactura</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                                value={businessForm.description}
                                onChange={e => setBusinessForm({ ...businessForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={businessForm.email}
                                    onChange={e => setBusinessForm({ ...businessForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    value={businessForm.phone}
                                    onChange={e => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                                value={businessForm.address}
                                onChange={e => setBusinessForm({ ...businessForm, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button onClick={handleEditBusiness} disabled={editMutation.isPending}>
                            {editMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Asignar/Ver Administradores */}
            <Dialog open={isAssignAdminOpen} onOpenChange={setIsAssignAdminOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedBusiness ? `Administrar: ${selectedBusiness.name}` : 'Administrar Negocio'}
                        </DialogTitle>
                        <DialogDescription>
                            Asigna usuarios como administradores de este negocio
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Formulario de asignación */}
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Asignar Nuevo Administrador
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Usuario</Label>
                                    <Select
                                        value={adminForm.user_id}
                                        onValueChange={v => setAdminForm({ ...adminForm, user_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar usuario" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingUsers ? (
                                                <div className="p-2 text-sm text-muted-foreground">Cargando usuarios...</div>
                                            ) : (
                                                users?.map(user => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.username} ({user.email})
                                                        {user.is_super_admin && ' - Super Admin'}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rol</Label>
                                    <Select
                                        value={adminForm.role}
                                        onValueChange={v => setAdminForm({ ...adminForm, role: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OWNER">Propietario</SelectItem>
                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                            <SelectItem value="MANAGER">Gerente</SelectItem>
                                            <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                className="mt-4 w-full"
                                onClick={handleAssignAdmin}
                                disabled={assignAdminMutation.isPending || !adminForm.user_id}
                            >
                                {assignAdminMutation.isPending ? 'Asignando...' : 'Asignar al Negocio'}
                            </Button>
                        </div>

                        {/* Lista de administradores actuales */}
                        <div>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Administradores Actuales
                            </h3>
                
                            {loadingAdmins ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Cargando administradores...
                                </p>
                            ) : !businessAdmins || (Array.isArray(businessAdmins) && businessAdmins.length === 0) ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay administradores asignados
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {Array.isArray(businessAdmins) && businessAdmins.map(admin => (
                                        <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{admin.user_details?.username || 'Usuario'}</p>
                                                    <p className="text-xs text-muted-foreground">{admin.user_details?.email || ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getRoleBadgeColor(admin.role)}>
                                                    {admin.role}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => revokeMutation.mutate(admin.id)}
                                                    disabled={revokeMutation.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignAdminOpen(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default BusinessPage