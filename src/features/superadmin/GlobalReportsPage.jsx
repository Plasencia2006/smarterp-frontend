// src/features/superadmin/GlobalReportsPage.jsx

import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '@services/django.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import {
    Users, Building2, TrendingUp, Activity,
    RefreshCw, AlertCircle, Download, BarChart3
} from 'lucide-react'
import { formatDate } from '@lib/utils'
import { toast } from 'sonner'

export const GlobalReportsPage = () => {
    const { data: stats, isLoading: loadingStats, error: errorStats, refetch: refetchStats } = useQuery({
        queryKey: ['global-stats'],
        queryFn: async () => {
            const response = await analyticsAPI.getGlobalStats()
            return response.data
        },
        staleTime: 5 * 60 * 1000, // Datos frescos por 5 min
    })

    const { data: activity, isLoading: loadingActivity, error: errorActivity, refetch: refetchActivity } = useQuery({
        queryKey: ['system-activity'],
        queryFn: async () => {
            const response = await analyticsAPI.getActivity()
            return response.data
        },
        staleTime: 2 * 60 * 1000, // Datos frescos por 2 min
    })

    const isLoading = loadingStats || loadingActivity
    const error = errorStats || errorActivity

    const totalUsers = stats?.totals?.users || 0
    const totalBusinesses = stats?.totals?.businesses || 0
    const activeUsers = stats?.totals?.active_users || 0
    const activeBusinesses = stats?.totals?.active_businesses || 0

    // ✅ FUNCIÓN: Actualizar datos con feedback visual
    const handleRefresh = async () => {
        toast.loading('Actualizando datos...')
        try {
            await Promise.all([
                refetchStats(),
                refetchActivity()
            ])
            toast.success('Datos actualizados correctamente')
        } catch (err) {
            toast.error('Error al actualizar datos')
            console.error('Refresh error:', err)
        }
    }

    // ✅ FUNCIÓN: Exportar datos a CSV
    const handleExport = () => {
        if (!stats && !activity) {
            toast.error('No hay datos para exportar')
            return
        }

        try {
            // Preparar datos para exportar
            const exportData = {
                resumen: {
                    fecha_generacion: new Date().toISOString(),
                    total_usuarios: totalUsers,
                    usuarios_activos: activeUsers,
                    total_negocios: totalBusinesses,
                    negocios_activos: activeBusinesses,
                    total_membresias: stats?.totals?.memberships || 0,
                },
                usuarios_por_estado: stats?.users_by_status || [],
                negocios_por_tipo: stats?.businesses_by_type || [],
                crecimiento_mensual: stats?.users_growth || [],
                ultimos_usuarios: activity?.recent_users?.slice(0, 10) || [],
                ultimos_negocios: activity?.recent_businesses?.slice(0, 10) || [],
            }

            // Convertir a CSV
            const csv = convertToCSV(exportData)

            // Crear y descargar archivo
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `reporte-smarterp-${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            toast.success('Reporte exportado correctamente')
        } catch (err) {
            console.error('Export error:', err)
            toast.error('Error al exportar el reporte')
        }
    }

    // ✅ Helper: Convertir objeto JSON a CSV
    const convertToCSV = (data) => {
        const rows = []

        // Header
        rows.push(['SMART ERP - Reporte Global'])
        rows.push([`Generado: ${new Date().toLocaleString('es-ES')}`])
        rows.push([])

        // Sección: Resumen
        rows.push(['=== RESUMEN ==='])
        rows.push(['Métrica', 'Valor'])
        Object.entries(data.resumen).forEach(([key, value]) => {
            rows.push([key, value])
        })
        rows.push([])

        // Sección: Usuarios por Estado
        rows.push(['=== USUARIOS POR ESTADO ==='])
        rows.push(['Estado', 'Cantidad'])
        data.usuarios_por_estado.forEach(item => {
            rows.push([item.estado, item.count])
        })
        rows.push([])

        // Sección: Negocios por Tipo
        rows.push(['=== NEGOCIOS POR TIPO ==='])
        rows.push(['Tipo', 'Cantidad'])
        data.negocios_por_tipo.forEach(item => {
            rows.push([item.type || 'Sin tipo', item.count])
        })
        rows.push([])

        // Sección: Crecimiento Mensual
        rows.push(['=== CRECIMIENTO MENSUAL ==='])
        rows.push(['Mes', 'Nuevos Usuarios'])
        data.crecimiento_mensual.forEach(item => {
            rows.push([item.month, item.count])
        })
        rows.push([])

        // Sección: Últimos Usuarios
        rows.push(['=== ÚLTIMOS USUARIOS REGISTRADOS ==='])
        rows.push(['Username', 'Email', 'Fecha Registro', 'Estado'])
        data.ultimos_usuarios.forEach(user => {
            rows.push([
                user.username || 'N/A',
                user.email || 'N/A',
                formatDate(user.date_joined, 'datetime'),
                user.is_active ? 'Activo' : 'Inactivo'
            ])
        })
        rows.push([])

        // Sección: Últimos Negocios
        rows.push(['=== ÚLTIMOS NEGOCIOS CREADOS ==='])
        rows.push(['Nombre', 'Tipo', 'Fecha Creación'])
        data.ultimos_negocios.forEach(biz => {
            rows.push([
                biz.name || 'N/A',
                biz.type || 'N/A',
                formatDate(biz.created_at, 'datetime')
            ])
        })

        // Convertir array de arrays a string CSV
        return rows.map(row =>
            row.map(cell => {
                // Escapar comillas y manejar valores con comas
                const value = String(cell ?? '')
                return value.includes(',') || value.includes('"')
                    ? `"${value.replace(/"/g, '""')}"`
                    : value
            }).join(',')
        ).join('\n')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Generando reportes...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6 p-6">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                            <div>
                                <p className="font-semibold text-destructive">Error al cargar datos</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    No se pudo conectar con el servicio de análisis.
                                </p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
                                    <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header Compacto con Botones Funcionales */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reportes Globales</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Estadísticas en tiempo real del sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={!stats && !activity}>
                        <Download className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* 🔹 FILA 1: KPIs Compactos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                            <p className="text-2xl font-bold mt-1">{totalUsers}</p>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> {activeUsers} activos
                            </p>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Negocios</p>
                            <p className="text-2xl font-bold mt-1">{totalBusinesses}</p>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> {activeBusinesses} activos
                            </p>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Membresías</p>
                            <p className="text-2xl font-bold mt-1">{stats?.totals?.memberships || 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Asignaciones activas</p>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Crecimiento</p>
                            <p className="text-2xl font-bold mt-1 text-green-600">+12%</p>
                            <p className="text-xs text-muted-foreground mt-1">Último mes</p>
                        </div>
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 🔹 FILA 2: Distribución (2 Columnas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Negocios por Tipo */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Distribución por Tipo de Negocio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats?.businesses_by_type?.length > 0 ? (
                            stats.businesses_by_type.map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium capitalize">{item.type || 'Sin categoría'}</span>
                                        <span className="text-muted-foreground">{item.count} ({totalBusinesses > 0 ? Math.round((item.count / totalBusinesses) * 100) : 0}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : idx === 2 ? 'bg-green-500' : 'bg-slate-400'
                                                }`}
                                            style={{ width: `${totalBusinesses > 0 ? (item.count / totalBusinesses) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">Sin datos disponibles</p>
                        )}
                    </CardContent>
                </Card>

                {/* Usuarios por Estado */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Estado de Usuarios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats?.users_by_status?.length > 0 ? (
                            stats.users_by_status.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${item.estado === 'ACTIVO' ? 'bg-green-500' : item.estado === 'INACTIVO' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} />
                                        <span className="text-sm font-medium capitalize">{item.estado || 'Sin estado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">{item.count} usuarios</span>
                                        <span className="text-sm font-semibold w-8 text-right">
                                            {totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">Sin datos disponibles</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 🔹 FILA 3: Actividad Reciente */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Actividad Reciente del Sistema</CardTitle>
                    <CardDescription>Últimos registros de usuarios y negocios</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nuevos Usuarios */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4" /> Usuarios Registrados
                            </h4>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                                {activity?.recent_users?.length > 0 ? (
                                    activity.recent_users.slice(0, 6).map((user) => (
                                        <div key={user.id} className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {(user.username || user.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{user.username || 'Usuario'}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center">Sin registros recientes</p>
                                )}
                            </div>
                        </div>

                        {/* Nuevos Negocios */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                <Building2 className="w-4 h-4" /> Negocios Creados
                            </h4>
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                                {activity?.recent_businesses?.length > 0 ? (
                                    activity.recent_businesses.slice(0, 6).map((biz) => (
                                        <div key={biz.id} className="flex items-center justify-between text-sm p-2 hover:bg-muted rounded transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Building2 className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{biz.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{biz.type}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDate(biz.created_at, 'short')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center">Sin negocios recientes</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default GlobalReportsPage