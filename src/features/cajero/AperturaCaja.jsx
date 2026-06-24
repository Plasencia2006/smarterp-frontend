import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Unlock, Loader2, DollarSign, ArrowLeft } from 'lucide-react'

export default function AperturaCaja() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [initialCash, setInitialCash] = useState('')
    const [notes, setNotes] = useState('')

    const openMutation = useMutation({
        mutationFn: (data) => cashierAPI.openRegister(data),
        onSuccess: (res) => {
            if (res.data?.success) {
                toast.success('✅ Caja abierta correctamente')
                queryClient.invalidateQueries(['active-register'])
                queryClient.invalidateQueries(['cajero-dashboard'])
                navigate('/cajero')
            } else {
                toast.error(res.data?.message || 'Error al abrir caja')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al abrir caja')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        const cash = parseFloat(initialCash)
        if (isNaN(cash) || cash < 0) {
            toast.error('Ingresa un monto válido')
            return
        }
        openMutation.mutate({
            initialCash: cash,
            openingNotes: notes
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate('/cajero')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al panel
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-green-500">
                                <Unlock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Apertura de Caja</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Inicia tu turno de trabajo
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    💡 <strong>Importante:</strong> Cuenta el efectivo inicial cuidadosamente.
                                    Este monto será la base para los cálculos del turno.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="initialCash">Efectivo Inicial (S/) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        id="initialCash"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={initialCash}
                                        onChange={(e) => setInitialCash(e.target.value)}
                                        className="pl-10 h-12 text-lg font-bold"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Ingresa el monto con el que inicias tu turno
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas (Opcional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Ej: Turno mañana, billetes pequeños, etc."
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
                                    disabled={openMutation.isPending}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {openMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Abriendo...
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="w-4 h-4 mr-2" />
                                            Abrir Caja
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