import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import cashierAPI from '@/services/cashier.api'  // ✅ IMPORT CORREGIDO
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
    DollarSign, Wallet, CheckCircle2, XCircle, Eye, Loader2,
    Calendar, User, ArrowUpRight, ArrowDownRight, Shield
} from 'lucide-react'
import { toast } from 'sonner'

export default function CashManagement() {
    const queryClient = useQueryClient()
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedRegister, setSelectedRegister] = useState(null)
    const [selectedAudit, setSelectedAudit] = useState(null)
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
    const [notes, setNotes] = useState('')
    const [activeTab, setActiveTab] = useState('dashboard')

    // 📊 Dashboard de Cajas
    const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
        queryKey: ['admin-cash-dashboard'],
        queryFn: async () => {
            try {
                const res = await cashierAPI.getAdminDashboard()  // ✅ cashAPI → cashierAPI
                console.log('📊 Dashboard:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error dashboard:', error)
                return null
            }
        }
    })

    // 📋 Historial de Cajas
    const { data: registersData, isLoading: loadingRegisters } = useQuery({
        queryKey: ['admin-cash-registers', currentPage],
        queryFn: async () => {
            try {
                const res = await cashierAPI.getAdminRegisters(currentPage, 20)  // ✅
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error historial:', error)
                return null
            }
        }
    })

    // 💵 Transacciones
    const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
        queryKey: ['admin-cash-transactions', selectedRegister?.id],
        queryFn: async () => {
            if (!selectedRegister?.id) return null
            try {
                const res = await cashierAPI.getAdminRegisterTransactions(selectedRegister.id)  // ✅
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error transacciones:', error)
                return null
            }
        },
        enabled: !!selectedRegister?.id
    })

    // 🔍 Arqueos Pendientes
    const { data: auditsData, isLoading: loadingAudits } = useQuery({
        queryKey: ['admin-cash-audits-pending'],
        queryFn: async () => {
            try {
                const res = await cashierAPI.getAdminPendingAudits()  // ✅
                console.log('🔍 Audits response:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error arqueos:', error)
                return null
            }
        }
    })

    // 💰 Retiros Pendientes
    const { data: withdrawalsData, isLoading: loadingWithdrawals } = useQuery({
        queryKey: ['admin-cash-withdrawals-pending'],
        queryFn: async () => {
            try {
                const res = await cashierAPI.getAdminPendingWithdrawals()  // ✅
                console.log('💰 Withdrawals response:', res.data)
                return res.data?.success ? res.data.data : null
            } catch (error) {
                console.error('❌ Error retiros:', error)
                return null
            }
        }
    })

    // ✅ Aprobar Arqueo
    const approveAuditMutation = useMutation({
        mutationFn: ({ id, notes }) => cashierAPI.approveAudit(id, notes),  // ✅
        onSuccess: () => {
            toast.success('✅ Arqueo aprobado correctamente')
            queryClient.invalidateQueries(['admin-cash-audits-pending'])
            setSelectedAudit(null)
            setNotes('')
        },
        onError: (error) => {
            toast.error('❌ Error: ' + error.response?.data?.message)
        }
    })

    // ❌ Rechazar Arqueo
    const rejectAuditMutation = useMutation({
        mutationFn: ({ id, notes }) => cashierAPI.rejectAudit(id, notes),  // ✅
        onSuccess: () => {
            toast.success('❌ Arqueo rechazado')
            queryClient.invalidateQueries(['admin-cash-audits-pending'])
            setSelectedAudit(null)
            setNotes('')
        },
        onError: (error) => {
            toast.error('❌ Error: ' + error.response?.data?.message)
        }
    })

    // ✅ Aprobar Retiro
    const approveWithdrawalMutation = useMutation({
        mutationFn: ({ id, notes }) => cashierAPI.approveWithdrawal(id, notes),  // ✅
        onSuccess: () => {
            toast.success('✅ Retiro aprobado correctamente')
            queryClient.invalidateQueries(['admin-cash-withdrawals-pending'])
            setSelectedWithdrawal(null)
            setNotes('')
        },
        onError: (error) => {
            toast.error('❌ Error: ' + error.response?.data?.message)
        }
    })

    // ❌ Rechazar Retiro
    const rejectWithdrawalMutation = useMutation({
        mutationFn: ({ id, notes }) => cashierAPI.rejectWithdrawal(id, notes),  // ✅
        onSuccess: () => {
            toast.success('❌ Retiro rechazado')
            queryClient.invalidateQueries(['admin-cash-withdrawals-pending'])
            setSelectedWithdrawal(null)
            setNotes('')
        },
        onError: (error) => {
            toast.error('❌ Error: ' + error.response?.data?.message)
        }
    })

    if (loadingDashboard || loadingRegisters) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando gestión de cajas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Gestión de Cajas
                </h1>
                <p className="text-muted-foreground">
                    Administra cajas, arqueos y retiros de dinero
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
                <Button
                    variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Dashboard
                </Button>
                <Button
                    variant={activeTab === 'registers' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('registers')}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    Historial de Cajas
                </Button>
            </div>

            {/* ==================== DASHBOARD ==================== */}
            {activeTab === 'dashboard' && dashboardData && (
                <div className="space-y-6">
                    {/* Stats Principales */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cajas Abiertas</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {dashboardData.cajasAbiertas || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Activas actualmente</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cajas Cerradas Hoy</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dashboardData.cajasCerradasHoy || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Hoy</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    S/ {parseFloat(dashboardData.totalIngresosHoy || 0).toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">Total ingresos</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Balance del Día</CardTitle>
                                <Wallet className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${parseFloat(dashboardData.balanceHoy || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    S/ {parseFloat(dashboardData.balanceHoy || 0).toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">Ingresos - Egresos</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Arqueos Pendientes */}
                    {auditsData?.content?.length > 0 && (
                        <Card className="border-2 border-orange-200">
                            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Arqueos Pendientes ({auditsData.content.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {auditsData.content.map((audit) => (
                                    <div key={audit.id} className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200">
                                        <div className="grid grid-cols-4 gap-4 mb-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">N° Arqueo</p>
                                                <p className="font-semibold">{audit.auditNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Esperado</p>
                                                <p className="font-bold text-blue-600">S/ {parseFloat(audit.expectedCash || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Contado</p>
                                                <p className="font-bold text-green-600">S/ {parseFloat(audit.countedCash || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Diferencia</p>
                                                <p className={`font-bold text-xl ${parseFloat(audit.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    S/ {parseFloat(audit.difference || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedAudit(audit); setNotes(''); }}>
                                                <Eye className="w-4 h-4 mr-1" /> Ver
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => {
                                                if (confirm('¿Rechazar este arqueo?')) rejectAuditMutation.mutate({ id: audit.id, notes: 'Rechazado' });
                                            }}>
                                                <XCircle className="w-4 h-4 mr-1" /> Rechazar
                                            </Button>
                                            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => {
                                                if (confirm('¿Aprobar este arqueo?')) approveAuditMutation.mutate({ id: audit.id, notes: 'Aprobado' });
                                            }}>
                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Retiros Pendientes */}
                    {withdrawalsData?.content?.length > 0 && (
                        <Card className="border-2 border-red-200">
                            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5" />
                                    Retiros Pendientes ({withdrawalsData.content.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                {withdrawalsData.content.map((withdrawal) => (
                                    <div key={withdrawal.id} className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
                                        <div className="grid grid-cols-4 gap-4 mb-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">N° Retiro</p>
                                                <p className="font-semibold">{withdrawal.withdrawalNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Monto</p>
                                                <p className="font-bold text-2xl text-red-600">
                                                    S/ {parseFloat(withdrawal.amount || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-muted-foreground">Motivo</p>
                                                <p className="font-semibold">{withdrawal.reason}</p>
                                                {withdrawal.userName && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        👤 {withdrawal.userName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedWithdrawal(withdrawal); setNotes(''); }}>
                                                <Eye className="w-4 h-4 mr-1" /> Ver
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => {
                                                if (confirm('¿Rechazar este retiro?')) rejectWithdrawalMutation.mutate({ id: withdrawal.id, notes: 'Rechazado' });
                                            }}>
                                                <XCircle className="w-4 h-4 mr-1" /> Rechazar
                                            </Button>
                                            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => {
                                                if (confirm('¿Aprobar este retiro?')) approveWithdrawalMutation.mutate({ id: withdrawal.id, notes: 'Aprobado' });
                                            }}>
                                                <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Mensaje si no hay pendientes */}
                    {auditsData?.content?.length === 0 && withdrawalsData?.content?.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    ¡Todo en orden!
                                </p>
                                <p className="text-muted-foreground">
                                    No hay arqueos ni retiros pendientes de aprobación
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ==================== HISTORIAL DE CAJAS ==================== */}
            {activeTab === 'registers' && registersData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Cajas ({registersData.totalElements})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {registersData.content && registersData.content.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cajero</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Apertura</TableHead>
                                            <TableHead>Cierre</TableHead>
                                            <TableHead className="text-right">Inicial</TableHead>
                                            <TableHead className="text-right">Final</TableHead>
                                            <TableHead className="text-right">Diferencia</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registersData.content.map((register) => (
                                            <TableRow key={register.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span className="font-medium">{register.userName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={register.status === 'ABIERTO' ? 'default' : register.status === 'CERRADO' ? 'secondary' : 'destructive'}>
                                                        {register.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(register.openingTime).toLocaleString('es-PE')}</TableCell>
                                                <TableCell>
                                                    {register.closingTime ? new Date(register.closingTime).toLocaleString('es-PE') : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">S/ {parseFloat(register.initialAmount).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">S/ {parseFloat(register.finalCash || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    {register.cashDifference && (
                                                        <span className={parseFloat(register.cashDifference) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                            S/ {parseFloat(register.cashDifference).toFixed(2)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => setSelectedRegister(register)}>
                                                        <Eye className="w-4 h-4 mr-1" /> Ver
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Mostrando {registersData.content.length} de {registersData.totalElements} cajas
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>Anterior</Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= registersData.totalPages - 1}>Siguiente</Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>No hay registros de cajas</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ==================== MODAL DETALLE CAJA ==================== */}
            <Dialog open={!!selectedRegister} onOpenChange={() => setSelectedRegister(null)}>
                <DialogContent className="max-w-[95vw] w-full min-w-[1100px] max-h-[92vh] overflow-y-auto p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Wallet className="w-6 h-6 text-blue-600" />
                                    Detalle de Caja
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-base">
                                    Información completa de la caja de {selectedRegister?.userName}
                                </DialogDescription>
                            </div>
                            <Badge className="text-lg px-4 py-2" variant={selectedRegister?.status === 'ABIERTO' ? 'default' : selectedRegister?.status === 'CERRADO' ? 'secondary' : 'destructive'}>
                                {selectedRegister?.status}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedRegister && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-2 p-5 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200">
                                    <p className="text-sm text-blue-600 dark:text-blue-300 font-medium mb-2">Cajero</p>
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedRegister?.userName}</p>
                                    <p className="text-sm text-muted-foreground mt-1">ID: {selectedRegister?.userId}</p>
                                </div>
                                <div className="col-span-1 p-5 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200">
                                    <p className="text-sm text-green-600 dark:text-green-300 font-medium mb-2">Estado</p>
                                    <Badge className="text-lg px-4 py-1" variant={selectedRegister?.status === 'ABIERTO' ? 'default' : selectedRegister?.status === 'CERRADO' ? 'secondary' : 'destructive'}>
                                        {selectedRegister?.status}
                                    </Badge>
                                </div>
                                <div className="col-span-1 p-5 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200">
                                    <p className="text-sm text-purple-600 dark:text-purple-300 font-medium mb-2">Diferencia</p>
                                    <p className={`text-2xl font-bold ${parseFloat(selectedRegister?.cashDifference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        S/ {parseFloat(selectedRegister?.cashDifference || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-5 border-2 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">Monto Inicial</p>
                                    <p className="text-3xl font-bold">S/ {parseFloat(selectedRegister?.initialAmount || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-5 border-2 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">Efectivo Esperado</p>
                                    <p className="text-3xl font-bold text-blue-600">S/ {parseFloat(selectedRegister?.expectedCash || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-5 border-2 rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-2">Efectivo Final</p>
                                    <p className="text-3xl font-bold text-green-600">S/ {parseFloat(selectedRegister?.finalCash || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-1">🕐 Apertura</p>
                                    <p className="font-semibold text-lg">{new Date(selectedRegister?.openingTime).toLocaleString('es-PE')}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground mb-1">🔒 Cierre</p>
                                    <p className="font-semibold text-lg">
                                        {selectedRegister?.closingTime ? new Date(selectedRegister?.closingTime).toLocaleString('es-PE') : 'Aún abierta'}
                                    </p>
                                </div>
                            </div>

                            {(selectedRegister?.openingNotes || selectedRegister?.closingNotes) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedRegister?.openingNotes && (
                                        <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">📝 Notas de Apertura</p>
                                            <p className="text-sm">{selectedRegister?.openingNotes}</p>
                                        </div>
                                    )}
                                    {selectedRegister?.closingNotes && (
                                        <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">📝 Notas de Cierre</p>
                                            <p className="text-sm">{selectedRegister?.closingNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="border-2 rounded-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                                    <p className="font-bold text-white text-lg flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        Transacciones ({transactionsData?.content?.length || 0})
                                    </p>
                                </div>
                                {loadingTransactions ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Cargando...</p>
                                    </div>
                                ) : transactionsData?.content?.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead>Método</TableHead>
                                                <TableHead>Usuario</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactionsData.content.map((t) => (
                                                <TableRow key={t.id}>
                                                    <TableCell>
                                                        <Badge variant={t.type === 'INGRESO' ? 'default' : t.type === 'EGRESO' ? 'destructive' : 'secondary'}>
                                                            {t.type === 'INGRESO' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                                                            {t.type === 'EGRESO' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                                                            {t.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                                                    <TableCell>{t.paymentMethod || '-'}</TableCell>
                                                    <TableCell>{t.createdBy}</TableCell>
                                                    <TableCell>{new Date(t.createdAt).toLocaleString('es-PE')}</TableCell>
                                                    <TableCell className={`text-right font-bold ${t.type === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {t.type === 'INGRESO' ? '+' : '-'} S/ {parseFloat(t.amount).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">No hay transacciones</div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ==================== MODAL ARQUEO ==================== */}
            <Dialog open={!!selectedAudit} onOpenChange={() => setSelectedAudit(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Arqueo</DialogTitle>
                        <DialogDescription>{selectedAudit?.auditNumber}</DialogDescription>
                    </DialogHeader>
                    {selectedAudit && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Esperado</Label>
                                    <p className="text-2xl font-bold text-blue-600">S/ {parseFloat(selectedAudit.expectedCash || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Contado</Label>
                                    <p className="text-2xl font-bold text-green-600">S/ {parseFloat(selectedAudit.countedCash || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Diferencia</Label>
                                    <p className={`text-2xl font-bold ${parseFloat(selectedAudit.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        S/ {parseFloat(selectedAudit.difference || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Label>Observaciones</Label>
                                <Input placeholder="Agregar observaciones..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedAudit(null)}>Cancelar</Button>
                                <Button variant="destructive" onClick={() => rejectAuditMutation.mutate({ id: selectedAudit.id, notes: notes || 'Rechazado' })}>
                                    <XCircle className="w-4 h-4 mr-2" /> Rechazar
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => approveAuditMutation.mutate({ id: selectedAudit.id, notes: notes || 'Aprobado' })}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ==================== MODAL RETIRO ==================== */}
            <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Retiro</DialogTitle>
                        <DialogDescription>{selectedWithdrawal?.withdrawalNumber}</DialogDescription>
                    </DialogHeader>
                    {selectedWithdrawal && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                                <Label className="text-sm text-red-600">Monto a Retirar</Label>
                                <p className="text-4xl font-bold text-red-600 mt-2">S/ {parseFloat(selectedWithdrawal.amount || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <Label>Motivo</Label>
                                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{selectedWithdrawal.reason}</p>
                            </div>
                            <div>
                                <Label>Observaciones</Label>
                                <Input placeholder="Agregar observaciones..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>Cancelar</Button>
                                <Button variant="destructive" onClick={() => rejectWithdrawalMutation.mutate({ id: selectedWithdrawal.id, notes: notes || 'Rechazado' })}>
                                    <XCircle className="w-4 h-4 mr-2" /> Rechazar
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => approveWithdrawalMutation.mutate({ id: selectedWithdrawal.id, notes: notes || 'Aprobado' })}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}