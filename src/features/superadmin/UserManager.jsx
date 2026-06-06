// src/features/superadmin/UsersManager.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@/services/django.api'  // ← Asegúrate de tener esta API
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    UserCog,
    Search,
    Shield,
    Mail,
    Loader2,
    Edit,
    Trash2,
    RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

export default function UsersManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [editingUser, setEditingUser] = useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Fetch usuarios
    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['superadmin-users', searchTerm],
        queryFn: async () => {
            const params = searchTerm ? { search: searchTerm } : {}
            const res = await usersAPI.list(params)
            return res.data?.results || res.data || []
        }
    })

    // Mutación: Actualizar usuario (INCLUYENDO is_super_admin)
    const updateUserMutation = useMutation({
        mutationFn: ({ userId, data }) => usersAPI.update(userId, data),
        onSuccess: () => {
            toast.success('Usuario actualizado exitosamente')
            // ✅ INVALIDAR QUERY para que se recargue la lista
            queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
            // ✅ O hacer refetch manual
            // refetch()
            setIsEditModalOpen(false)
            setEditingUser(null)
        },
        onError: (error) => {
            console.error('Error al actualizar:', error)
            toast.error(error.response?.data?.error || 'Error al actualizar usuario')
        }
    })

    // Mutación: Eliminar/Desactivar usuario
    const deleteUserMutation = useMutation({
        mutationFn: (userId) => usersAPI.delete(userId),
        onSuccess: () => {
            toast.success('Usuario eliminado exitosamente')
            queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Error al eliminar usuario')
        }
    })

    const handleEdit = (user) => {
        setEditingUser(user)
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = (updatedData) => {
        if (editingUser) {
            // ✅ Asegúrate de enviar TODOS los campos necesarios
            updateUserMutation.mutate({
                userId: editingUser.id,
                data: {
                    ...updatedData,
                    // Si el backend espera campos específicos:
                    // is_super_admin: updatedData.is_super_admin,
                    // first_name: updatedData.first_name,
                    // last_name: updatedData.last_name,
                    // email: updatedData.email,
                }
            })
        }
    }

    const handleDelete = (userId) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            deleteUserMutation.mutate(userId)
        }
    }

    // Filtrar usuarios
    const filteredUsers = users?.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground mt-1">
                        Administra todos los usuarios del sistema
                    </p>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, email o username..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Usuarios */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Usuario</th>
                                        <th className="text-left py-3 px-4">Email</th>
                                        <th className="text-left py-3 px-4">Estado</th>
                                        <th className="text-left py-3 px-4">Rol</th>
                                        <th className="text-left py-3 px-4">Último Acceso</th>
                                        <th className="text-right py-3 px-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {user.username}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm">{user.email}</td>
                                            <td className="py-3 px-4">
                                                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                                    {user.is_active ? 'ACTIVO' : 'INACTIVO'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.is_super_admin ? (
                                                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Super Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Usuario</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modal de Edición */}
            {isEditModalOpen && editingUser && (
                <EditUserModal
                    user={editingUser}
                    onSave={handleSaveEdit}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        setEditingUser(null)
                    }}
                    isLoading={updateUserMutation.isPending}
                />
            )}
        </div>
    )
}

// ✅ Modal de Edición con Switch para Super Admin
function EditUserModal({ user, onSave, onClose, isLoading }) {
    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        is_active: user.is_active ?? true,
        is_super_admin: user.is_super_admin ?? false,  // ← IMPORTANTE: Inicializar con el valor actual
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Editar Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nombre</label>
                                <Input
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Apellido</label>
                                <Input
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Estado</label>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <span className="text-sm">{formData.is_active ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>

                        {/* ✅ SWITCH PARA SUPER ADMIN - ESTO ES LO QUE PROBABLEMENTE FALTA */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rol de Super Admin</label>
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                                <Switch
                                    checked={formData.is_super_admin}
                                    onCheckedChange={(checked) => {
                                        console.log('Cambiando is_super_admin a:', checked)
                                        setFormData({ ...formData, is_super_admin: checked })
                                    }}
                                    id="super-admin-switch"
                                />
                                <label htmlFor="super-admin-switch" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-purple-600" />
                                        <div>
                                            <p className="font-medium text-sm">Super Admin</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formData.is_super_admin
                                                    ? 'Este usuario tiene acceso total al sistema'
                                                    : 'Este usuario es un usuario normal'}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar Cambios'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default UsersManager