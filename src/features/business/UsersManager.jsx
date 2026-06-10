// src/features/business/UsersManager.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessAPI } from '@/services/django.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
    UserPlus, Search, Edit, Shield, Loader2, Mail, UserCog,
    Trash2, X, Check, UserX, Briefcase, Calendar,
    Lock  // ✅ AGREGAR ESTE IMPORT
} from 'lucide-react'
import { toast } from 'sonner'

export default function UsersManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // Usuario seleccionado
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedRoleId, setSelectedRoleId] = useState('')

    // Fetch usuarios del negocio
    const { data: users, isLoading } = useQuery({
        queryKey: ['business-users', searchTerm],
        queryFn: async () => {
            const params = searchTerm ? { search: searchTerm } : {}
            const res = await businessAPI.getUsers(params)
            return res.data
        }
    })

    // Fetch roles disponibles
    const { data: roles } = useQuery({
        queryKey: ['business-roles'],
        queryFn: async () => {
            const res = await businessAPI.getRoles()
            return res.data
        }
    })

    // Crear usuario
    const createUserMutation = useMutation({
        mutationFn: async (data) => {
            console.log('📤 Datos a enviar:', data)
            const response = await businessAPI.createUser(data)
            console.log('✅ Respuesta:', response.data)
            return response.data
        },
        onSuccess: (data) => {
            console.log('✨ Usuario creado:', data)
            toast.success('Usuario creado exitosamente')
            queryClient.invalidateQueries({ queryKey: ['business-users'] })
            setIsCreateModalOpen(false)
            resetForm()
        },
        onError: (error) => {
            console.error('❌ Error al crear:', error)
            console.error('📋 Detalle del error:', error.response?.data)

            const errorMsg = error.response?.data?.error ||
                error.response?.data?.non_field_errors?.[0] ||
                error.response?.data?.email?.[0] ||
                error.response?.data?.password?.[0] ||
                'Error al crear usuario'

            toast.error(errorMsg)
        }
    })

    // Actualizar usuario
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => businessAPI.updateUser(id, data),
        onSuccess: () => {
            console.log('✅ [MUTATION] Usuario actualizado correctamente')
            toast.success('Usuario actualizado exitosamente')
            queryClient.invalidateQueries({ queryKey: ['business-users'] })
            setIsEditModalOpen(false)
            resetForm()
        },
        onError: (error) => {
            console.error('❌ [MUTATION] Error al actualizar:', error.response?.data)

            const errorData = error.response?.data

            if (errorData?.detail && typeof errorData.detail === 'object') {
                Object.entries(errorData.detail).forEach(([field, msg]) => {
                    const message = Array.isArray(msg) ? msg[0] : msg
                    toast.error(`${field}: ${message}`)
                })
            } else {
                const message = errorData?.error ||
                    errorData?.detail ||
                    errorData?.message ||
                    'Error al actualizar usuario'
                toast.error(message)
            }
        }
    })

    // Asignar rol
    const assignRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }) => businessAPI.assignRole(userId, roleId),
        onSuccess: () => {
            toast.success('Rol asignado correctamente')
            queryClient.invalidateQueries({ queryKey: ['business-users'] })
            setIsAssignRoleModalOpen(false)
            setSelectedRoleId('')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Error al asignar rol')
        }
    })

    // Revocar rol
    const revokeRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }) => businessAPI.revokeRole(userId, roleId),
        onSuccess: () => {
            toast.success('Rol revocado correctamente')
            queryClient.invalidateQueries({ queryKey: ['business-users'] })
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Error al revocar rol')
        }
    })

    // Eliminar usuario
    const deleteUserMutation = useMutation({
        mutationFn: (id) => businessAPI.deleteUser(id),
        onSuccess: () => {
            toast.success('Usuario eliminado exitosamente')
            queryClient.invalidateQueries({ queryKey: ['business-users'] })
            setIsDeleteModalOpen(false)
            setSelectedUser(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Error al eliminar usuario')
        }
    })

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        employee_code: '',
        department: '',
        position: '',
        hire_date: '',
        initial_role_id: '',
        is_active: true,
    })

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            password_confirm: '',
            first_name: '',
            last_name: '',
            employee_code: '',
            department: '',
            position: '',
            hire_date: '',
            initial_role_id: '',
            is_active: true
        })
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()

        const business = JSON.parse(localStorage.getItem('smart_erp_business'))

        if (!business?.id) {
            toast.error('No se pudo determinar el negocio.')
            return
        }

        // ✅ DETERMINAR EL ROL DE MEMBERSHIP
        // Si hay initial_role_id, usar el nombre del rol
        // Si no, usar el rol por defecto del formulario o 'USER'
        let membershipRole = 'USER'

        if (formData.initial_role_id && roles) {
            const selectedRole = roles.find(r => r.id === formData.initial_role_id)
            if (selectedRole) {
                // Convertir nombre del rol a membership_role
                // Ej: "Cajero Principal" → "CAJERO"
                const roleName = selectedRole.name.toUpperCase()
                if (roleName.includes('CAJERO')) membershipRole = 'CAJERO'
                else if (roleName.includes('VENDEDOR')) membershipRole = 'VENDEDOR'
                else if (roleName.includes('CONTADOR')) membershipRole = 'CONTADOR'
                else if (roleName.includes('INVENTARIO')) membershipRole = 'INVENTARIO'
                else if (roleName.includes('SOPORTE')) membershipRole = 'SOPORTE'
                else if (roleName.includes('ADMIN')) membershipRole = 'ADMIN'
                else membershipRole = roleName.split(' ')[0] // Primera palabra
            }
        }

        const payload = {
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            employee_code: formData.employee_code || '',
            department: formData.department || '',
            position: formData.position || '',
            hire_date: formData.hire_date || null,
            initial_role_id: formData.initial_role_id || null,
            business_id: business.id,
            membership_role: membershipRole,  // ← ✅ ENVIAR EL ROL
            role: membershipRole  // ← Por compatibilidad
        }

        console.log('📤 Payload completo:', payload)
        console.log('🎭 Membership role:', membershipRole)

        try {
            await createUserMutation.mutateAsync(payload)
        } catch (error) {
            console.error('❌ Error:', error.response?.data)
            toast.error(error.response?.data?.error || 'Error al crear usuario')
        }
    }

    const handleUpdateUser = (e) => {
        e.preventDefault()

        // Validar contraseñas si se están cambiando
        if (formData.password || formData.password_confirm) {
            if (formData.password !== formData.password_confirm) {
                toast.error('Las contraseñas no coinciden')
                return
            }

            if (formData.password.length < 6) {
                toast.error('La contraseña debe tener al menos 6 caracteres')
                return
            }
        }

        const payload = {
            first_name: formData.first_name || '',
            last_name: formData.last_name || '',
            email: formData.email || '',
            employee_code: formData.employee_code || '',
            department: formData.department || '',
            position: formData.position || '',
            hire_date: formData.hire_date || null,
            is_active: formData.is_active !== undefined ? formData.is_active : true,

            // Solo enviar contraseña si se proporcionó
            ...(formData.password && {
                password: formData.password,
                password_confirm: formData.password_confirm
            }),
        }

        console.log('📤 [UPDATE] Payload final:', payload)
        console.log('📤 [UPDATE] Usuario ID:', selectedUser.id)

        updateUserMutation.mutate({
            id: selectedUser.id,
            data: payload
        })
    }

    const handleAssignRole = () => {
        if (!selectedUser || !selectedRoleId) {
            toast.error('Selecciona un usuario y un rol')
            return
        }
        assignRoleMutation.mutate({ userId: selectedUser.id, roleId: selectedRoleId })
    }

    const handleRevokeRole = (userId, roleId) => {
        if (confirm('¿Estás seguro de revocar este rol?')) {
            revokeRoleMutation.mutate({ userId, roleId })
        }
    }

    const openEditModal = (user) => {
        setSelectedUser(user)
        setFormData({
            first_name: user.user?.first_name || '',
            last_name: user.user?.last_name || '',
            email: user.user?.email || '',
            password: '',              // Siempre vacío al abrir
            password_confirm: '',      // Siempre vacío al abrir
            employee_code: user.employee_code || '',
            department: user.department || '',
            position: user.position || '',
            initial_role_id: '',
            is_active: user.is_active,
        })
        setIsEditModalOpen(true)
    }

    const openAssignRoleModal = (user) => {
        setSelectedUser(user)
        setIsAssignRoleModalOpen(true)
    }

    const openDeleteModal = (user) => {
        setSelectedUser(user)
        setIsDeleteModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground mt-1">
                        Crea y administra usuarios del negocio
                    </p>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsCreateModalOpen(true) }}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                                <p className="text-2xl font-bold">{users?.length || 0}</p>
                            </div>
                            <UserCog className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Activos</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {users?.filter(u => u.is_active).length || 0}
                                </p>
                            </div>
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Inactivos</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {users?.filter(u => !u.is_active).length || 0}
                                </p>
                            </div>
                            <UserX className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Con Roles</p>
                                <p className="text-2xl font-bold">
                                    {users?.filter(u => u.active_roles?.length > 0).length || 0}
                                </p>
                            </div>
                            <Shield className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por email o nombre..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Usuarios */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {users?.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-lg font-bold text-blue-600">
                                                {user.user?.first_name?.[0] || user.user?.email?.[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {user.user?.first_name} {user.user?.last_name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4" />
                                                    {user.user?.email}
                                                </div>
                                                {user.employee_code && (
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase className="w-4 h-4" />
                                                        {user.employee_code}
                                                    </div>
                                                )}
                                                {user.position && (
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase className="w-4 h-4" />
                                                        {user.position}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {user.active_roles?.map((assignment) => (
                                                    <Badge key={assignment.id} variant="outline" className="flex items-center gap-1">
                                                        <Shield className="w-3 h-3" />
                                                        {assignment.role.name}
                                                        <button
                                                            onClick={() => handleRevokeRole(user.id, assignment.role.id)}
                                                            className="ml-1 hover:text-red-600"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openAssignRoleModal(user)}
                                        >
                                            <Shield className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(user)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => openDeleteModal(user)}
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

            {/* Modal: Crear Usuario */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                            El usuario será asignado automáticamente a tu negocio
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">Nombre *</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Apellido *</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employee_code">Código Empleado</Label>
                                <Input
                                    id="employee_code"
                                    value={formData.employee_code}
                                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Departamento</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Cargo</Label>
                                <Input
                                    id="position"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="initial_role_id">Rol Inicial</Label>
                            <Select
                                value={formData.initial_role_id}
                                onValueChange={(value) => setFormData({ ...formData, initial_role_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles?.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={createUserMutation.isPending}
                            >
                                {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar Usuario */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modifica la información del usuario
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_first_name">Nombre</Label>
                                <Input
                                    id="edit_first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_last_name">Apellido</Label>
                                <Input
                                    id="edit_last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_email">Email</Label>
                            <Input
                                id="edit_email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_employee_code">Código</Label>
                                <Input
                                    id="edit_employee_code"
                                    value={formData.employee_code}
                                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_department">Departamento</Label>
                                <Input
                                    id="edit_department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_position">Cargo</Label>
                                <Input
                                    id="edit_position"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit_is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="edit_is_active">Usuario Activo</Label>
                        </div>

                        {/* ✅ SECCIÓN: Cambiar Contraseña */}
                        <div className="border-t pt-4 mt-2">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Cambiar Contraseña
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Deja estos campos vacíos si no deseas cambiar la contraseña
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-password">Nueva Contraseña</Label>
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-password-confirm">Confirmar Contraseña</Label>
                                    <Input
                                        id="edit-password-confirm"
                                        type="password"
                                        value={formData.password_confirm}
                                        onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {formData.password && formData.password !== formData.password_confirm && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <X className="w-3 h-3" />
                                    Las contraseñas no coinciden
                                </p>
                            )}

                            {formData.password && formData.password === formData.password_confirm && formData.password.length >= 6 && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Las contraseñas coinciden
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={updateUserMutation.isPending}
                            >
                                {updateUserMutation.isPending ? 'Actualizando...' : 'Actualizar Usuario'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Asignar Rol */}
            <Dialog open={isAssignRoleModalOpen} onOpenChange={setIsAssignRoleModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar Rol</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.user?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="membership_role">Tipo de Usuario *</Label>
                        <Select
                            value={formData.membership_role || 'USER'}
                            onValueChange={(value) => setFormData({ ...formData, membership_role: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">🏢 Administrador</SelectItem>
                                <SelectItem value="CAJERO">💵 Cajero</SelectItem>
                                <SelectItem value="VENDEDOR">💰 Vendedor</SelectItem>
                                <SelectItem value="CONTADOR">📊 Contador</SelectItem>
                                <SelectItem value="INVENTARIO">📦 Inventario</SelectItem>
                                <SelectItem value="SOPORTE">🔧 Soporte Técnico</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Este rol determina a qué panel accederá el usuario
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignRoleModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAssignRole}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!selectedRoleId || assignRoleMutation.isPending}
                        >
                            {assignRoleMutation.isPending ? 'Asignando...' : 'Asignar Rol'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Confirmar Eliminación */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar Usuario</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar a {selectedUser?.user?.first_name} {selectedUser?.user?.last_name}?
                            Esta acción desactivará el usuario del negocio pero no eliminará la cuenta global.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteUserMutation.mutate(selectedUser?.id)}
                            disabled={deleteUserMutation.isPending}
                        >
                            {deleteUserMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}