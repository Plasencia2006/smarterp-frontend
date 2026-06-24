import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    ArrowLeft, Loader2, CheckCircle2, XCircle, Clock,
    AlertTriangle, Wallet, DollarSign, Send, FileText,
    TrendingDown, ShieldCheck, ShieldX
} from 'lucide-react'

export default function RetirosEfectivo() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [destination, setDestination] = useState('Caja Fuerte')

    // Obtener turno activo
    const { data: activeRegister } = useQuery({
        queryKey: ['active-register'],
        queryFn: async () => {
            const res = await cashierAPI.getActiveRegister()
            return res.data?.success ? res.data.data : null
        }
    })

    // Obtener retiros del turno
    const { data: withdrawals, isLoading } = useQuery({
        queryKey: ['withdrawals', activeRegister?.id],
        queryFn: async () => {
            if (!activeRegister?.id) return []
            const res = await cashierAPI.getWithdrawals(activeRegister.id)
            return res.data?.success ? res.data.data : []
        },
        enabled: !!activeRegister?.id
    })

    // Verificar si excede límite
    const { data: exceedsLimit } = useQuery({
        queryKey: ['exceeds-limit', activeRegister?.id],
        queryFn: async () => {
            if (!activeRegister?.id) return false
            const res = await cashierAPI.exceedsCashLimit(activeRegister.id)
            return res.data?.success ? res.data.data : false
        },
        enabled: !!activeRegister?.id,
        refetchInterval: 30000
    })

    // Solicitar retiro
    const requestMutation = useMutation({
        mutationFn: (data) => cashierAPI.requestWithdrawal(data),
        onSuccess: (res) => {
            if (res.data?.success) {
                toast.success('✅ Retiro solicitado correctamente')
                setAmount('')
                setReason('')
                queryClient.invalidateQueries(['withdrawals'])
                queryClient.invalidateQueries(['exceeds-limit'])
            } else {
                toast.error(res.data?.message || 'Error al solicitar retiro')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al solicitar retiro')
        }
    })

    // Aprobar retiro
    const approveMutation = useMutation({
        mutationFn: ({ id, notes }) => cashierAPI.approveWithdrawal(id, { approvalNotes: notes }),
        onSuccess: (res) => {
            if (res.data?.success) {
                toast.success('✅ Retiro aprobado')
                queryClient.invalidateQueries(['withdrawals'])
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al aprobar')
        }
    })

    // Rechazar retiro
    const rejectMutation = useMutation({
        mutationFn: ({ id, notes }) => cashierAPI.rejectWithdrawal(id, { rejectionNotes: notes }),
        onSuccess: (res) => {
            if (res.data?.success) {
                toast.success('Retiro rechazado')
                queryClient.invalidateQueries(['withdrawals'])
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al rechazar')
        }
    })

    // Completar retiro
    const completeMutation = useMutation({
        mutationFn: (id) => cashierAPI.completeWithdrawal(id),
        onSuccess: (res) => {
            if (res.data?.success) {
                toast.success('✅ Retiro completado - Dinero enviado a caja fuerte')
                queryClient.invalidateQueries(['withdrawals'])
                queryClient.invalidateQueries(['cajero-dashboard'])
                queryClient.invalidateQueries(['exceeds-limit'])
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al completar')
        }
    })

    const handleRequest = () => {
        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Ingresa un monto válido')
            return
        }
        if (!reason.trim()) {
            toast.error('Indica el motivo del retiro')
            return
        }
        if (!activeRegister?.id) {
            toast.error('No hay turno activo')
            return
        }

        requestMutation.mutate({
            registerId: activeRegister.id,
            amount: amountNum,
            reason: reason.trim(),
            destination
        })
    }

    const handleApprove = (withdrawal) => {
        const notes = prompt('Notas de aprobación (opcional):') || 'Aprobado'
        approveMutation.mutate({ id: withdrawal.id, notes })
    }

    const handleReject = (withdrawal) => {
        const notes = prompt('Motivo del rechazo:')
        if (!notes) return
        rejectMutation.mutate({ id: withdrawal.id, notes })
    }

    const handleComplete = (withdrawal) => {
        if (!confirm(`¿Confirmas que el dinero fue entregado a ${withdrawal.destination}?`)) return
        completeMutation.mutate(withdrawal.id)
    }

    const getStatusBadge = (status) => {
        const badges = {
            'SOLICITADO': <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Solicitado</Badge>,
            'APROBADO': <Badge className="bg-blue-500"><ShieldCheck className="w-3 h-3 mr-1" />Aprobado</Badge>,
            'RECHAZADO': <Badge className="bg-red-500"><ShieldX className="w-3 h-3 mr-1" />Rechazado</Badge>,
            'COMPLETADO': <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completado</Badge>,
            'CANCELADO': <Badge className="bg-gray-500"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
        }
        return badges[status] || <Badge>{status}</Badge>
    }

    if (!activeRegister) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-xl font-bold mb-2">No hay caja abierta</h2>
                        <p className="text-muted-foreground mb-4">
                            Debes abrir caja antes de solicitar retiros
                        </p>
                        <Button onClick={() => navigate('/cajero')}>Volver al panel</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate('/cajero')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Retiros de Efectivo</h1>
                            <p className="text-muted-foreground">Gestiona retiros a caja fuerte</p>
                        </div>
                    </div>
                </div>

                {/* Alerta de exceso */}
                {exceedsLimit && (
                    <Card className="border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                                <div>
                                    <h3 className="font-bold text-red-900 dark:text-red-200">
                                        ⚠️ Exceso de efectivo en caja
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        El efectivo en caja supera el límite de S/ 10,000.
                                        Se recomienda realizar un retiro por seguridad.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Formulario de solicitud */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Solicitar Nuevo Retiro
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Monto a Retirar (S/) *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-10 h-12 text-lg font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo del Retiro *</Label>
                            <Input
                                placeholder="Ej: Exceso de efectivo, compra de insumos, etc."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Destino</Label>
                            <select
                                className="w-full h-10 px-3 border rounded-md bg-background"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            >
                                <option value="Caja Fuerte">Caja Fuerte</option>
                                <option value="Banco">Depósito Bancario</option>
                                <option value="Administración">Entrega a Administración</option>
                            </select>
                        </div>

                        <Button
                            onClick={handleRequest}
                            disabled={requestMutation.isPending}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                            {requestMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Solicitando...</>
                            ) : (
                                <><Wallet className="w-4 h-4 mr-2" /> Solicitar Retiro</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Lista de retiros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Historial de Retiros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : withdrawals?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay retiros registrados en este turno
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {withdrawals?.map(w => (
                                    <div key={w.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-start justify-between flex-wrap gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-bold">{w.referenceNumber}</h4>
                                                    {getStatusBadge(w.status)}
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <p><strong>Monto:</strong> S/ {w.amount?.toFixed(2)}</p>
                                                    <p><strong>Motivo:</strong> {w.reason}</p>
                                                    <p><strong>Destino:</strong> {w.destination}</p>
                                                    <p><strong>Solicitado por:</strong> {w.cashierName}</p>
                                                    {w.supervisorName && (
                                                        <p><strong>Supervisor:</strong> {w.supervisorName}</p>
                                                    )}
                                                    <p className="text-muted-foreground">
                                                        {new Date(w.requestedAt).toLocaleString('es-PE')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {w.status === 'SOLICITADO' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(w)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <ShieldCheck className="w-4 h-4 mr-1" />
                                                            Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(w)}
                                                            className="text-red-600"
                                                        >
                                                            <ShieldX className="w-4 h-4 mr-1" />
                                                            Rechazar
                                                        </Button>
                                                    </>
                                                )}
                                                {w.status === 'APROBADO' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleComplete(w)}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Completar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}