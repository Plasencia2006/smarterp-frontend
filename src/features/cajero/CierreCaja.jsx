import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Lock, Loader2, DollarSign, ArrowLeft, CheckCircle2,
    AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react'

export default function CierreCaja() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [finalCash, setFinalCash] = useState('')
    const [notes, setNotes] = useState('')

    // Obtener turno activo
    const { data: activeRegister } = useQuery({
        queryKey: ['active-register'],
        queryFn: async () => {
            const res = await cashierAPI.getActiveRegister()
            return res.data?.success ? res.data.data : null
        }
    })

    // Obtener resumen del turno
    const { data: summary } = useQuery({
        queryKey: ['register-summary', activeRegister?.id],
        queryFn: async () => {
            if (!activeRegister?.id) return null
            const res = await cashierAPI.getRegisterSummary(activeRegister.id)
            return res.data?.success ? res.data.data : null
        },
        enabled: !!activeRegister?.id
    })

    const closeMutation = useMutation({
        mutationFn: (data) => cashierAPI.closeRegister(activeRegister.id, data),
        onSuccess: (res) => {
            if (res.data?.success) {
                const data = res.data.data
                const diff = data.cashDifference || 0
                if (Math.abs(diff) < 0.01) {
                    toast.success('✅ Caja cerrada - Cuadre perfecto')
                } else if (diff > 0) {
                    toast.success(`✅ Caja cerrada - Sobrante: S/ ${diff.toFixed(2)}`)
                } else {
                    toast.warning(`⚠️ Caja cerrada - Faltante: S/ ${Math.abs(diff).toFixed(2)}`)
                }
                queryClient.invalidateQueries(['active-register'])
                navigate('/cajero')
            } else {
                toast.error(res.data?.message || 'Error al cerrar caja')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al cerrar caja')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        const cash = parseFloat(finalCash)
        if (isNaN(cash) || cash < 0) {
            toast.error('Ingresa un monto válido')
            return
        }
        if (!confirm('¿Confirmas el cierre de caja? Esta acción no se puede deshacer.')) {
            return
        }
        closeMutation.mutate({
            finalCash: cash,
            closingNotes: notes
        })
    }

    if (!activeRegister) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-xl font-bold mb-2">No hay caja abierta</h2>
                        <p className="text-muted-foreground mb-4">
                            Debes abrir caja antes de poder cerrarla
                        </p>
                        <Button onClick={() => navigate('/cajero')}>Volver al panel</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const expectedCash = summary?.expectedCash || 0
    const finalCashNum = parseFloat(finalCash) || 0
    const difference = finalCashNum - expectedCash

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate('/cajero')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al panel
                </Button>

                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-red-500">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cierre de Caja</h1>
                        <p className="text-muted-foreground">Finaliza tu turno de trabajo</p>
                    </div>
                </div>

                {/* Resumen del turno */}
                {summary && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen del Turno</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Apertura</p>
                                    <p className="font-bold">
                                        {new Date(activeRegister.openingTime).toLocaleString('es-PE')}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Ventas realizadas</p>
                                    <p className="font-bold">{summary.totalVentas || 0}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Efectivo inicial:</span>
                                    <span className="font-medium">S/ {activeRegister.initialCash?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" /> Ingresos:
                                    </span>
                                    <span className="font-medium">+ S/ {(summary.totalIngresos || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span className="flex items-center gap-1">
                                        <TrendingDown className="w-4 h-4" /> Egresos:
                                    </span>
                                    <span className="font-medium">- S/ {(summary.totalEgresos || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                    <span>💰 Efectivo esperado:</span>
                                    <span className="text-blue-600">S/ {expectedCash.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Formulario de cierre */}
                <Card>
                    <CardHeader>
                        <CardTitle>Conteo Final</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ⚠️ <strong>Atención:</strong> Cuenta físicamente todo el efectivo en caja
                                    e ingresa el monto total. El sistema comparará con lo esperado.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="finalCash">Efectivo Contado (S/) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="finalCash"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={finalCash}
                                        onChange={(e) => setFinalCash(e.target.value)}
                                        className="pl-10 h-12 text-lg font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Diferencia en tiempo real */}
                            {finalCash && (
                                <div className={`p-4 rounded-lg border-2 ${Math.abs(difference) < 0.01
                                        ? 'bg-green-50 dark:bg-green-950/30 border-green-500'
                                        : difference > 0
                                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500'
                                            : 'bg-red-50 dark:bg-red-950/30 border-red-500'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Diferencia:</span>
                                        <span className={`text-2xl font-bold ${Math.abs(difference) < 0.01
                                                ? 'text-green-600'
                                                : difference > 0
                                                    ? 'text-blue-600'
                                                    : 'text-red-600'
                                            }`}>
                                            {difference >= 0 ? '+' : ''} S/ {difference.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-2">
                                        {Math.abs(difference) < 0.01 && '✅ Cuadre perfecto'}
                                        {difference > 0.01 && '💵 Sobrante en caja'}
                                        {difference < -0.01 && '⚠️ Faltante en caja'}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas de cierre (Opcional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Ej: Cliente pagó con billete grande, etc."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/cajero')}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={closeMutation.isPending}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    {closeMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Cerrando...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4 mr-2" />
                                            Cerrar Caja
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}