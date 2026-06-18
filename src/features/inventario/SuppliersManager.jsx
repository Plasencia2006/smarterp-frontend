import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Users, Plus, Search, Edit, Trash2, Loader2, Phone, Mail, MapPin } from 'lucide-react'

export default function SuppliersManager() {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', ruc: '', contactName: '', phone: '', email: '', address: '' })

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['inventory-suppliers', searchTerm],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.suppliers.list({ search: searchTerm })
                return res.data?.success && Array.isArray(res.data.data) ? res.data.data : []
            } catch { return [] }
        }
    })

    const createMut = useMutation({
        mutationFn: (d) => inventoryAPI.suppliers.create(d),
        onSuccess: () => { toast.success('✅ Proveedor creado'); queryClient.invalidateQueries(['inventory-suppliers']); setIsCreateOpen(false); setForm({ name: '', ruc: '', contactName: '', phone: '', email: '', address: '' }) }
    })

    const updateMut = useMutation({
        mutationFn: ({ id, data }) => inventoryAPI.suppliers.update(id, data),
        onSuccess: () => { toast.success('✅ Proveedor actualizado'); queryClient.invalidateQueries(['inventory-suppliers']); setIsEditOpen(false) }
    })

    const deleteMut = useMutation({
        mutationFn: (id) => inventoryAPI.suppliers.delete(id),
        onSuccess: () => { toast.success('✅ Proveedor eliminado'); queryClient.invalidateQueries(['inventory-suppliers']); setIsDeleteOpen(false) }
    })

    const openEdit = (s) => { setSelected(s); setForm({ name: s.name, ruc: s.ruc, contactName: s.contactName, phone: s.phone, email: s.email, address: s.address }); setIsEditOpen(true) }
    const handleSubmit = (e, isEdit) => {
        e.preventDefault()
        if (!form.name) return toast.error('El nombre es obligatorio')
        isEdit ? updateMut.mutate({ id: selected.id, data: form }) : createMut.mutate(form)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-3xl font-bold">Proveedores</h1><p className="text-muted-foreground">Gestiona tus proveedores de confianza</p></div>
                <Button onClick={() => { setForm({ name: '', ruc: '', contactName: '', phone: '', email: '', address: '' }); setIsCreateOpen(true) }}><Plus className="w-4 h-4 mr-2" />Nuevo Proveedor</Button>
            </div>

            <Card><CardContent className="p-4"><Input placeholder="Buscar por nombre, RUC o contacto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></CardContent></Card>

            {isLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                : !suppliers?.length ? <Card><CardContent className="p-12 text-center text-muted-foreground">No hay proveedores registrados</CardContent></Card>
                    : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {suppliers.map(s => (
                                <Card key={s.id} className="hover:shadow-md"><CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">{s.name}</h3>
                                            <p className="text-sm text-muted-foreground">RUC: {s.ruc || 'N/A'}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                                                {s.contactName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.contactName}</span>}
                                                {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                                                {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                                                {s.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.address}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setSelected(s); setIsDeleteOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                </CardContent></Card>
                            ))}
                        </div>
                    )}

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}><DialogContent><DialogHeader><DialogTitle>Nuevo Proveedor</DialogTitle></DialogHeader>
                <form onSubmit={e => handleSubmit(e, false)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nombre / Razón Social *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>RUC</Label><Input value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Persona de Contacto</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? 'Creando...' : 'Crear'}</Button></DialogFooter>
                </form>
            </DialogContent></Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}><DialogContent><DialogHeader><DialogTitle>Editar Proveedor</DialogTitle></DialogHeader>
                <form onSubmit={e => handleSubmit(e, true)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nombre / Razón Social *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>RUC</Label><Input value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Persona de Contacto</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={updateMut.isPending}>{updateMut.isPending ? 'Guardando...' : 'Guardar'}</Button></DialogFooter>
                </form>
            </DialogContent></Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Eliminar Proveedor</DialogTitle><DialogDescription>¿Eliminar <strong>{selected?.name}</strong>? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
                <DialogFooter><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" onClick={() => deleteMut.mutate(selected.id)} disabled={deleteMut.isPending}>{deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}</Button></DialogFooter>
            </DialogContent></Dialog>
        </div>
    )
}