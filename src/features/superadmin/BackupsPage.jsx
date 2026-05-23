// src/features/superadmin/BackupsPage.jsx

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupsAPI } from '@services/django.api'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Progress } from '@components/ui/progress'
import {
    Database, Download, Upload, Trash2, RefreshCw,
    Check, X, Clock, HardDrive, Calendar, FileText,
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export const BackupsPage = () => {
    const queryClient = useQueryClient()
    const [isCreating, setIsCreating] = useState(false)
    const [creatingProgress, setCreatingProgress] = useState(0)

    // Fetch backups reales del backend
    const { data: backups, isLoading, refetch } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            const response = await backupsAPI.list()
            return response.data || []
        },
        refetchInterval: 10000 // Refrescar cada 10 segundos
    })

    // Crear backup
    const createMutation = useMutation({
        mutationFn: () => backupsAPI.create(),
        onMutate: () => {
            setIsCreating(true)
            setCreatingProgress(0)
            // Simular progreso
            const interval = setInterval(() => {
                setCreatingProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval)
                        return 90
                    }
                    return prev + 10
                })
            }, 500)
        },
        onSuccess: (data) => {
            setCreatingProgress(100)
            setTimeout(() => {
                toast.success(`Backup creado: ${data.data?.size_mb} MB`)
                queryClient.invalidateQueries(['backups'])
                setIsCreating(false)
                setCreatingProgress(0)
            }, 500)
        },
        onError: (error) => {
            toast.error('Error al crear backup')
            setIsCreating(false)
            setCreatingProgress(0)
        }
    })

    // Restaurar backup
    const restoreMutation = useMutation({
        mutationFn: (id) => backupsAPI.restore(id),
        onSuccess: () => {
            toast.success('Backup restaurado exitosamente')
            queryClient.invalidateQueries(['backups'])
        },
        onError: () => {
            toast.error('Error al restaurar backup')
        }
    })

    // Eliminar backup
    const deleteMutation = useMutation({
        mutationFn: (id) => backupsAPI.delete(id),
        onSuccess: () => {
            toast.success('Backup eliminado')
            queryClient.invalidateQueries(['backups'])
        }
    })

    // Descargar backup
    const downloadBackup = async (backup) => {
        try {
            const response = await backupsAPI.download(backup.id)
            const blob = new Blob([response.data])
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = backup.filename || `backup-${backup.id}.sql`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success('Backup descargado')
        } catch (error) {
            toast.error('Error al descargar backup')
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            'completed': (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                    <Check className="w-3 h-3 mr-1" /> Completado
                </Badge>
            ),
            'pending': (
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                    <Clock className="w-3 h-3 mr-1" /> Pendiente
                </Badge>
            ),
            'failed': (
                <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" /> Fallido
                </Badge>
            ),
        }
        return badges[status] || <Badge>{status}</Badge>
    }

    const getTotalSize = () => {
        if (!backups) return '0 MB'
        const totalMB = backups.reduce((acc, b) => acc + (b.size_mb || 0), 0)
        if (totalMB > 1024) {
            return (totalMB / 1024).toFixed(2) + ' GB'
        }
        return totalMB.toFixed(2) + ' MB'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Database className="w-8 h-8 text-primary" />
                        Gestión de Backups
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Respaldos reales de la base de datos
                    </p>
                </div>
                <Button
                    onClick={() => createMutation.mutate()}
                    disabled={isCreating || createMutation.isPending}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isCreating && 'animate-spin'}`} />
                    {isCreating ? 'Creando...' : 'Crear Backup'}
                </Button>
            </div>

            {/* Progreso de creación */}
            {isCreating && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Creando backup...</span>
                                <span>{creatingProgress}%</span>
                            </div>
                            <Progress value={creatingProgress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{backups?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Espacio Total</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getTotalSize()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-bold">
                            {backups && backups.length > 0
                                ? new Date(backups[0].created_at).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : 'Sin backups'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Backups */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Backups</CardTitle>
                    <CardDescription>
                        Backups almacenados en el servidor
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                            Cargando backups...
                        </div>
                    ) : backups?.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No hay backups disponibles</p>
                            <p className="text-sm mt-1">Crea tu primer backup para comenzar</p>
                            <Button
                                className="mt-4"
                                onClick={() => createMutation.mutate()}
                            >
                                Crear primer backup
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {backups.map((backup) => (
                                <div
                                    key={backup.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold truncate">{backup.name}</h4>
                                                {getStatusBadge(backup.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(backup.created_at).toLocaleString('es-ES')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <HardDrive className="w-3 h-3" />
                                                    {backup.size_mb} MB
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => downloadBackup(backup)}
                                            disabled={backup.status !== 'completed'}
                                            title="Descargar"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                if (confirm('⚠️ ¿Restaurar este backup?\n\nEsta acción reemplazará TODOS los datos actuales y NO se puede deshacer.')) {
                                                    restoreMutation.mutate(backup.id)
                                                }
                                            }}
                                            disabled={backup.status !== 'completed' || restoreMutation.isPending}
                                            title="Restaurar"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                if (confirm(`¿Eliminar permanentemente el backup "${backup.name}"?`)) {
                                                    deleteMutation.mutate(backup.id)
                                                }
                                            }}
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Información importante */}
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="space-y-1 text-sm text-amber-800">
                            <p className="font-semibold">Información importante:</p>
                            <ul className="list-disc list-inside space-y-1 text-amber-700">
                                <li>Los backups se almacenan en el servidor en <code className="bg-amber-100 px-1 rounded">/backups/</code></li>
                                <li>Se recomienda descargar copias periódicamente</li>
                                <li>La restauración reemplazará todos los datos actuales</li>
                                <li>Los backups incluyen toda la base de datos MySQL</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default BackupsPage