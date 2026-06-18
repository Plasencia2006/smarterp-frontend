import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Package, Bell, Loader2, RefreshCw } from 'lucide-react'

export default function StockAlerts() {
    const queryClient = useQueryClient()

    // ✅ Generar alertas al cargar la página
    useEffect(() => {
        generateAlertsMutation.mutate()
    }, [])

    const generateAlertsMutation = useMutation({
        mutationFn: () => inventoryAPI.alerts.generate(),
        onSuccess: () => {
            queryClient.invalidateQueries(['inventory-alerts'])
        }
    })

    const { data: alertsData, isLoading } = useQuery({
        queryKey: ['inventory-alerts'],
        queryFn: async () => {
            try {
                const res = await inventoryAPI.alerts.list()
                const apiData = res.data
                if (apiData?.success) {
                    return apiData.data
                }
                return { pending: [], attended: [], all: [], stats: { pending: 0, attended: 0, total: 0 } }
            } catch (error) {
                console.error('Error cargando alertas:', error)
                return { pending: [], attended: [], all: [], stats: { pending: 0, attended: 0, total: 0 } }
            }
        }
    })

    const attendMutation = useMutation({
        mutationFn: (id) => inventoryAPI.alerts.attend(id),
        onSuccess: () => {
            toast.success('✅ Alerta marcada como atendida')
            queryClient.invalidateQueries(['inventory-alerts'])
        },
        onError: () => toast.error('Error al marcar alerta')
    })

    const pendingAlerts = alertsData?.pending || []
    const attendedAlerts = alertsData?.attended || []
    const stats = alertsData?.stats || { pending: 0, attended: 0, total: 0 }

    const getAlertIcon = (type) => {
        return type === 'OUT_OF_STOCK' ? (
            <AlertTriangle className="w-6 h-6 text-red-600" />
        ) : (
            <AlertTriangle className="w-6 h-6 text-orange-500" />
        )
    }

    const getAlertBadge = (type) => {
        if (type === 'OUT_OF_STOCK') {
            return <Badge variant="destructive">Sin Stock</Badge>
        }
        return <Badge className="bg-orange-500">Stock Bajo</Badge>
    }

    const getAlertColor = (type) => {
        return type === 'OUT_OF_STOCK'
            ? 'border-red-300 bg-red-50'
            : 'border-orange-300 bg-orange-50'
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Bell className="w-8 h-8 text-orange-500" />
                        Alertas de Stock
                    </h1>
                    <p className="text-muted-foreground">Productos con stock bajo o sin stock</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => generateAlertsMutation.mutate()}
                    disabled={generateAlertsMutation.isPending}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
                    Actualizar Alertas
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={stats.pending > 0 ? 'border-red-300' : ''}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Alertas Pendientes</p>
                            <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Atendidas</p>
                            <p className="text-2xl font-bold text-green-600">{stats.attended}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Alertas</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contenido */}
            {isLoading || generateAlertsMutation.isPending ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : pendingAlerts.length === 0 && attendedAlerts.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">¡Todo en orden!</h3>
                        <p className="text-muted-foreground">No hay alertas de stock</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Alertas Pendientes */}
                    {pendingAlerts.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Pendientes ({pendingAlerts.length})
                            </h2>
                            <div className="grid gap-3">
                                {pendingAlerts.map((alert) => (
                                    <Card key={alert.id} className={`border-2 ${getAlertColor(alert.alertType)}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                                        {getAlertIcon(alert.alertType)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-lg">
                                                                {alert.productName}
                                                            </h3>
                                                            {getAlertBadge(alert.alertType)}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            SKU: {alert.productSku || 'N/A'}
                                                        </p>
                                                        <p className="text-sm mt-2 font-medium">{alert.message}</p>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                            <span>Creada: {new Date(alert.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => attendMutation.mutate(alert.id)}
                                                        disabled={attendMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        {attendMutation.isPending ? '...' : 'Atender'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Alertas Atendidas */}
                    {attendedAlerts.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Atendidas ({attendedAlerts.length})
                            </h2>
                            <div className="grid gap-3 opacity-60">
                                {attendedAlerts.map((alert) => (
                                    <Card key={alert.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold line-through">
                                                        {alert.productName}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {alert.message}
                                                    </p>
                                                    {alert.attendedAt && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Atendida: {new Date(alert.attendedAt).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}