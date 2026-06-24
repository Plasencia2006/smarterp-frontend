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
    Search, ArrowLeft, Loader2, CheckCircle2, XCircle,
    AlertTriangle, Eye, Clock, FileText, Calculator,
    TrendingUp, TrendingDown, DollarSign, ClipboardList
} from 'lucide-react'

export default function ArqueosCaja() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeAudit, setActiveAudit] = useState(null)
    const [auditType, setAuditType] = useState('PARCIAL')
    const [countingData, setCountingData] = useState({
        bills200: '',
        bills100: '',
        bills50: '',
        bills20: '',
        bills10: '',
        coins: '',
        vouchers: '',
        notes: ''
    })

    // Obtener turno activo
    const { data: activeRegister } = useQuery({
        queryKey: ['active-register'],
        queryFn: async () => {
            const res = await cashierAPI.getActiveRegister()
            return res.data?.success ? res.data.data : null
        }
    })

    // Obtener arqueos del turno
    const { data: audits, isLoading } = useQuery({
        queryKey: ['audits', activeRegister?.id],
        queryFn: async () => {
            if (!activeRegister?.id) return []
            const res = await cashierAPI.getAudits(activeRegister.id)
            return res.data?.success ? res.data.data : []
        },
        enabled: !!activeRegister?.id
    })

    // Iniciar arqueo
    const startAuditMutation = useMutation({
        mutationFn: (data) => cashierAPI.startAudit(data),
        onSuccess: (res) => {
            if (res.data?.success) {
                setActiveAudit(res.data.data)
                toast.success('✅ Arqueo iniciado. Cuenta el efectivo físico.')
                queryClient.invalidateQueries(['audits'])
            } else {
                toast.error(res.data?.message || 'Error al iniciar arqueo')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al iniciar arqueo')
        }
    })

    // Completar arqueo
    const completeAuditMutation = useMutation({
        mutationFn: ({ id, data }) => cashierAPI.completeAudit(id, data),
        onSuccess: (res) => {
            if (res.data?.success) {
                const audit = res.data.data
                if (audit.isConcordant) {
                    toast.success('✅ Arqueo concordante. ¡Todo correcto!')
                } else {
                    toast.warning(`⚠️ Arqueo discordante. Diferencia: S/ ${audit.difference?.toFixed(2)}`)
                }
                setActiveAudit(null)
                resetCountingData()
                queryClient.invalidateQueries(['audits'])
            } else {
                toast.error(res.data?.message || 'Error al completar arqueo')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al completar arqueo')
        }
    })

    // Cancelar arqueo
    const cancelAuditMutation = useMutation({
        mutationFn: ({ id, reason }) => cashierAPI.cancelAudit(id, { reason }),
        onSuccess: (res) => {
            if (res.data?.success) {
                toast.success('Arqueo cancelado')
                setActiveAudit(null)
                resetCountingData()
                queryClient.invalidateQueries(['audits'])
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al cancelar arqueo')
        }
    })

    const resetCountingData = () => {
        setCountingData({
            bills200: '',
            bills100: '',
            bills50: '',
            bills20: '',
            bills10: '',
            coins: '',
            vouchers: '',
            notes: ''
        })
    }

    const handleStartAudit = () => {
        if (!activeRegister?.id) {
            toast.error('No hay turno activo')
            return
        }
        startAuditMutation.mutate({
            registerId: activeRegister.id,
            auditType: auditType
        })
    }

    const handleCompleteAudit = () => {
        if (!activeAudit?.id) return

        const data = {
            bills200: parseFloat(countingData.bills200) || 0,
            bills100: parseFloat(countingData.bills100) || 0,
            bills50: parseFloat(countingData.bills50) || 0,
            bills20: parseFloat(countingData.bills20) || 0,
            bills10: parseFloat(countingData.bills10) || 0,
            coins: parseFloat(countingData.coins) || 0,
            vouchers: parseFloat(countingData.vouchers) || 0,
            notes: countingData.notes
        }

        completeAuditMutation.mutate({ id: activeAudit.id, data })
    }

    const handleCancelAudit = () => {
        if (!activeAudit?.id) return
        const reason = prompt('Motivo de cancelación:')
        if (reason === null) return
        cancelAuditMutation.mutate({ id: activeAudit.id, reason })
    }

    const getTotalCounted = () => {
        return (parseFloat(countingData.bills200) || 0) +
            (parseFloat(countingData.bills100) || 0) +
            (parseFloat(countingData.bills50) || 0) +
            (parseFloat(countingData.bills20) || 0) +
            (parseFloat(countingData.bills10) || 0) +
            (parseFloat(countingData.coins) || 0) +
            (parseFloat(countingData.vouchers) || 0)
    }

    const getStatusBadge = (status) => {
        const badges = {
            'PENDIENTE': <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>,
            'CONCORDANTE': <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Concordante</Badge>,
            'DISCORDANTE': <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Discordante</Badge>,
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
                            Debes abrir caja antes de realizar arqueos
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
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Arqueos de Caja</h1>
                            <p className="text-muted-foreground">Auditorías rápidas de efectivo</p>
                        </div>
                    </div>
                </div>

                {/* Iniciar Arqueo */}
                {!activeAudit && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="w-5 h-5" />
                                Iniciar Nuevo Arqueo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    🔍 <strong>Arqueo a ciegas:</strong> El monto esperado se ocultará hasta que completes el conteo.
                                    Esto garantiza la imparcialidad de la auditoría.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipo de Arqueo</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={auditType === 'PARCIAL' ? 'default' : 'outline'}
                                        onClick={() => setAuditType('PARCIAL')}
                                    >
                                        Parcial
                                    </Button>
                                    <Button
                                        variant={auditType === 'CIERRE' ? 'default' : 'outline'}
                                        onClick={() => setAuditType('CIERRE')}
                                    >
                                        Cierre
                                    </Button>
                                    <Button
                                        variant={auditType === 'SORPRESA' ? 'default' : 'outline'}
                                        onClick={() => setAuditType('SORPRESA')}
                                    >
                                        Sorpresa
                                    </Button>
                                </div>
                            </div>

                            <Button
                                onClick={handleStartAudit}
                                disabled={startAuditMutation.isPending}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                {startAuditMutation.isPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Iniciando...</>
                                ) : (
                                    <><Search className="w-4 h-4 mr-2" /> Iniciar Arqueo</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Arqueo Activo - Conteo */}
                {activeAudit && (
                    <Card className="border-purple-500">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5" />
                                    Arqueo {activeAudit.auditNumber}
                                </CardTitle>
                                <Badge className="bg-yellow-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    En Progreso
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    💰 <strong>Cuenta el efectivo físico</strong> e ingresa los montos por denominación.
                                    El sistema calculará el total automáticamente.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Billetes de S/ 200</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.bills200}
                                        onChange={(e) => setCountingData({ ...countingData, bills200: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Billetes de S/ 100</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.bills100}
                                        onChange={(e) => setCountingData({ ...countingData, bills100: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Billetes de S/ 50</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.bills50}
                                        onChange={(e) => setCountingData({ ...countingData, bills50: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Billetes de S/ 20</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.bills20}
                                        onChange={(e) => setCountingData({ ...countingData, bills20: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Billetes de S/ 10</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.bills10}
                                        onChange={(e) => setCountingData({ ...countingData, bills10: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Monedas</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.coins}
                                        onChange={(e) => setCountingData({ ...countingData, coins: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Vales / Cupones</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={countingData.vouchers}
                                        onChange={(e) => setCountingData({ ...countingData, vouchers: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-2 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total Contado:</span>
                                    <span className="text-2xl font-bold text-purple-600">
                                        S/ {getTotalCounted().toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Notas (Opcional)</Label>
                                <Input
                                    placeholder="Observaciones del arqueo..."
                                    value={countingData.notes}
                                    onChange={(e) => setCountingData({ ...countingData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleCancelAudit}
                                    disabled={completeAuditMutation.isPending}
                                    className="flex-1"
                                >
                                    Cancelar Arqueo
                                </Button>
                                <Button
                                    onClick={handleCompleteAudit}
                                    disabled={completeAuditMutation.isPending || getTotalCounted() === 0}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {completeAuditMutation.isPending ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                                    ) : (
                                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Completar Arqueo</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Historial de Arqueos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Historial de Arqueos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : audits?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay arqueos registrados en este turno
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {audits?.map(audit => (
                                    <div key={audit.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-bold">{audit.auditNumber}</h4>
                                                    {getStatusBadge(audit.status)}
                                                    <Badge variant="outline">{audit.auditType}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                    <span> Supervisor: {audit.supervisorName}</span>
                                                    <span> {new Date(audit.startedAt).toLocaleString('es-PE')}</span>
                                                </div>
                                                {audit.countedCash && (
                                                    <div className="mt-2 flex gap-4 text-sm">
                                                        <span>Esperado: <strong>S/ {audit.expectedCash?.toFixed(2)}</strong></span>
                                                        <span>Contado: <strong>S/ {audit.countedCash?.toFixed(2)}</strong></span>
                                                        <span className={audit.difference === 0 ? 'text-green-600' : 'text-red-600'}>
                                                            Diferencia: <strong>S/ {audit.difference?.toFixed(2)}</strong>
                                                        </span>
                                                    </div>
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