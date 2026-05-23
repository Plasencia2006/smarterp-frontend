import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '@services/django.api'
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@components/ui/dialog'
import { Label } from '@components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { Checkbox } from '@components/ui/checkbox'
import { Badge } from '@components/ui/badge'
import { Users, Search, Shield, Mail, Calendar, Plus, Pencil, Trash2, History, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@lib/utils'

export const UsersPage = () => {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')

    // Estados para modales
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)  // ← Separado para evitar conflictos de scope
    const [editingUser, setEditingUser] = useState(null)
    const [viewHistoryUser, setViewHistoryUser] = useState(null)

    // Estado del formulario
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', password_confirm: '',
        estado: 'ACTIVO', is_super_admin: false
    })

    // Fetch Usuarios
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['users', searchTerm],
        queryFn: async () => {
            const params = searchTerm ? { search: searchTerm } : {}
            const res = await usersAPI.list(params)
            return res.data?.results || res.data || []
        }
    })

    // Mutación: Crear Usuario
    const createMutation = useMutation({
        mutationFn: (data) => usersAPI.create(data),
        onSuccess: () => {
            toast.success('Usuario creado exitosamente')
            queryClient.invalidateQueries(['users'])
            setIsCreateOpen(false)
            resetForm()
        },
        onError: (err) => {
            const msg = err.response?.data?.message ||
                err.response?.data?.errors?.username?.[0] ||
                'Error al crear usuario'
            toast.error(msg)
        }
    })

    // Mutación: Actualizar Usuario
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => usersAPI.update(id, data),
        onSuccess: () => {
            toast.success('Usuario actualizado')
            queryClient.invalidateQueries(['users'])
            setIsEditOpen(false)  // ← Ahora sí funciona porque está en el mismo scope
            setEditingUser(null)
        },
        onError: (err) => {
            const errors = err.response?.data?.errors || err.response?.data?.detail
            if (errors && typeof errors === 'object') {
                const msgs = Object.entries(errors).map(
                    ([field, msg]) => `${field}: ${Array.isArray(msg) ? msg[0] : msg}`
                )
                toast.error(msgs.join('; '))
            } else {
                toast.error('Error al actualizar usuario')
            }
        }
    })

    // Mutación: Eliminar Usuario
    const deleteMutation = useMutation({
        mutationFn: (id) => usersAPI.delete(id),
        onSuccess: () => {
            toast.success('Usuario eliminado')
            queryClient.invalidateQueries(['users'])
        }
    })

    // Mutación: Obtener Historial
    const historyQuery = useQuery({
        queryKey: ['history', viewHistoryUser?.id],
        queryFn: () => usersAPI.getHistory(viewHistoryUser.id),
        enabled: !!viewHistoryUser
    })

    const users = Array.isArray(usersResponse) ? usersResponse : []

    // Helpers
    const resetForm = () => setFormData({
        username: '', email: '', password: '', password_confirm: '',
        estado: 'ACTIVO', is_super_admin: false
    })

    const openEdit = (user) => {
        setEditingUser(user)
        setFormData({
            username: user.username || '',
            email: user.email || '',
            password: '',           // ← Vacío para no cambiar contraseña
            password_confirm: '',   // ← Vacío
            estado: user.estado || 'ACTIVO',
            is_super_admin: user.is_super_admin || user.is_superuser || false
        })
        setIsEditOpen(true)
    }

    const handleSave = () => {
        const isChangingPassword = formData.password && formData.password.trim() !== ''

        if (isChangingPassword && formData.password !== formData.password_confirm) {
            return toast.error('Las contraseñas no coinciden')
        }

        const payload = {}

        if (editingUser) {
            // === ACTUALIZACIÓN ===

            // ✅ Username: solo incluir si cambió Y el usuario nunca ha iniciado sesión
            if (formData.username !== editingUser.username) {
                if (editingUser.last_login === null) {
                    // Permitir cambio: usuario nunca ha iniciado sesión
                    payload.username = formData.username
                } else {
                    // Bloquear: ya inició sesión, no permitir cambiar username
                    toast.warning('El nombre de usuario no puede modificarse después del primer inicio de sesión')
                }
            }

            if (formData.email && formData.email !== editingUser.email) {
                payload.email = formData.email
            }
            if (formData.estado !== editingUser.estado) {
                payload.estado = formData.estado
            }
            if (formData.is_super_admin !== (editingUser.is_super_admin || editingUser.is_superuser)) {
                payload.is_super_admin = formData.is_super_admin
            }
            if (isChangingPassword) {
                payload.password = formData.password
            }
        } else {
            // === CREACIÓN ===
            const cleanUsername = formData.username?.replace(/\s+/g, '_').toLowerCase() || 'usuario'
            payload.username = cleanUsername
            payload.email = formData.email
            payload.password = formData.password
            payload.password_confirm = formData.password_confirm
            payload.estado = formData.estado
            payload.is_super_admin = formData.is_super_admin
        }

        if (editingUser && Object.keys(payload).length === 0) {
            toast.info('No hay cambios para guardar')
            setIsEditOpen(false)
            return
        }

        console.log('📤 Payload final:', payload)

        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data: payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Administra cuentas, permisos y accesos</p>
                </div>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
                </Button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar usuario..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabla de Usuarios */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-4">Usuario</th>
                                <th className="text-left p-4">Email</th>
                                <th className="text-left p-4">Estado</th>
                                <th className="text-left p-4">Rol</th>
                                <th className="text-left p-4">Último Acceso</th>
                                <th className="text-right p-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b hover:bg-muted/30">
                                    <td className="p-4 font-medium">
                                        {user.first_name || user.last_name
                                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                            : user.username}
                                    </td>
                                    <td className="p-4 text-muted-foreground">{user.email}</td>
                                    <td className="p-4">
                                        <Badge variant={user.estado === 'ACTIVO' ? 'default' : 'destructive'}>
                                            {user.estado || 'ACTIVO'}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        {(user.is_super_admin || user.is_superuser) && (
                                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                                                <Shield className="w-3 h-3 mr-1" /> Super Admin
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {user.last_login ? formatDate(user.last_login) : 'Nunca'}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => setViewHistoryUser(user)}>
                                            <History className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan="6" className="p-8 text-center text-muted-foreground">No se encontraron usuarios</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* ================= MODAL CREAR ================= */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                            Ingresa los datos del nuevo usuario. El nombre de usuario no puede tener espacios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre de usuario *</Label>
                            <Input
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                placeholder="usuario_sin_espacios"
                            />
                            <p className="text-xs text-muted-foreground">
                                Solo letras, números y @/./+/-/_ (sin espacios)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contraseña *</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Contraseña *</Label>
                            <Input
                                type="password"
                                value={formData.password_confirm}
                                onChange={e => setFormData({ ...formData, password_confirm: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                value={formData.estado}
                                onValueChange={v => setFormData({ ...formData, estado: v })}
                            >
                                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                    <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded bg-muted/30">
                            <Checkbox
                                id="superadmin-create"
                                checked={formData.is_super_admin}
                                onCheckedChange={c => setFormData({ ...formData, is_super_admin: c })}
                            />
                            <Label htmlFor="superadmin-create" className="cursor-pointer flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Es Super Admin
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm() }}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creando...' : <><Save className="w-4 h-4 mr-2" /> Crear</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL EDITAR ================= */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuario: {editingUser?.username}</DialogTitle>
                        <DialogDescription>
                            Modifica los permisos y estado.
                            {editingUser?.last_login
                                ? " El nombre de usuario ya no puede modificarse."
                                : " El nombre de usuario puede corregirse UNA SOLA VEZ antes del primer inicio de sesión."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Username: editable SOLO si nunca ha iniciado sesión */}
                        <div className="space-y-2">
                            <Label>Nombre de usuario</Label>
                            <Input
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                disabled={editingUser?.last_login !== null}  // ← Deshabilitar si ya inició sesión
                                className={editingUser?.last_login ? 'bg-muted/50' : ''}
                                placeholder="usuario_sin_espacios"
                            />
                            {editingUser?.last_login ? (
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                    ⚠️ El username ya no puede modificarse (usuario ya ha iniciado sesión)
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    💡 Puede corregirse UNA VEZ. Después del primer inicio de sesión, quedará bloqueado.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Password: opcional al editar */}
                        <div className="space-y-2">
                            <Label>Nueva Contraseña (opcional)</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Dejar vacío para mantener la actual"
                            />
                        </div>
                        {formData.password && (
                            <div className="space-y-2">
                                <Label>Confirmar Nueva Contraseña</Label>
                                <Input
                                    type="password"
                                    value={formData.password_confirm}
                                    onChange={e => setFormData({ ...formData, password_confirm: e.target.value })}
                                    placeholder="Repetir nueva contraseña"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select
                                value={formData.estado}
                                onValueChange={v => setFormData({ ...formData, estado: v })}
                            >
                                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVO">Activo</SelectItem>
                                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                    <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 p-3 border rounded bg-muted/30">
                            <Checkbox
                                id="superadmin-edit"
                                checked={formData.is_super_admin}
                                onCheckedChange={c => setFormData({ ...formData, is_super_admin: c })}
                            />
                            <Label htmlFor="superadmin-edit" className="cursor-pointer flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Es Super Admin
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingUser(null) }}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL HISTORIAL ================= */}
            <Dialog open={!!viewHistoryUser} onOpenChange={(open) => !open && setViewHistoryUser(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" /> Historial: {viewHistoryUser?.username}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {historyQuery.isLoading ? (
                            <p className="text-center py-4">Cargando historial...</p>
                        ) : historyQuery.data?.history?.length > 0 ? (
                            historyQuery.data.history.map((log, i) => (
                                <div key={i} className="flex gap-4 border-b pb-3 last:border-0">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        {i < historyQuery.data.history.length - 1 && <div className="w-px h-full bg-border my-1" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-sm">{log.action}</p>
                                            <span className="text-xs text-muted-foreground">{formatDate(log.date)}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Por: {log.by}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UsersPage