// src/features/superadmin/AuditPage.jsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditAPI } from '@services/django.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { Separator } from '@components/ui/separator'
import {
    Activity, FileText, User, Clock, Search, Calendar,
    LogOut, Users, AlertCircle, RefreshCw, Download,
    BarChart3, Trash2, Edit, Plus
} from 'lucide-react'
import { formatDate } from '@lib/utils'

export const AuditPage = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [timeFilter, setTimeFilter] = useState('today')

    const { data: logs, isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
        queryKey: ['audit-logs', timeFilter],
        queryFn: async () => {
            const response = await auditAPI.list()
            return response.data || []
        },
    })

    const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
        queryKey: ['audit-summary'],
        queryFn: async () => {
            const response = await auditAPI.summary()
            return response.data
        }
    })

    const { data: sessions, isLoading: loadingSessions } = useQuery({
        queryKey: ['user-sessions'],
        queryFn: async () => {
            const response = await auditAPI.getUserSessions()
            return response.data
        }
    })

    const isLoading = loadingLogs || loadingSummary

    const filteredLogs = logs?.filter(log =>
        log.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.object?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getActionConfig = (action) => {
        const configs = {
            'ADICIÓN': { color: 'bg-green-100 text-green-800 border-green-300', icon: Plus, bg: 'bg-green-50' },
            'MODIFICACIÓN': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Edit, bg: 'bg-blue-50' },
            'ELIMINACIÓN': { color: 'bg-red-100 text-red-800 border-red-300', icon: Trash2, bg: 'bg-red-50' },
        }
        return configs[action] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText, bg: 'bg-gray-50' }
    }

    const handleRefresh = () => {
        refetchLogs()
        refetchSummary()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="w-8 h-8 text-primary" />
                        </div>
                        Auditoría del Sistema
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Registro completo de actividades, sesiones y accesos
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-[150px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hoy</SelectItem>
                            <SelectItem value="week">Esta semana</SelectItem>
                            <SelectItem value="month">Este mes</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
                    </Button>
                </div>
            </div>

            {/* Stats - Vertical Stack */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                                <p className="text-3xl font-bold mt-1">{summary?.total_logs || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">{summary?.activity_today || 0} hoy</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Actividad Hoy</p>
                                <p className="text-3xl font-bold mt-1">{summary?.activity_today || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">{summary?.activity_yesterday || 0} ayer</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                                <p className="text-3xl font-bold mt-1">{summary?.active_users || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Con sesión hoy</p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Sesiones</p>
                                <p className="text-3xl font-bold mt-1">{sessions?.recent_sessions?.length || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Últimos 7 días</p>
                            </div>
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <LogOut className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            {/* SECCIÓN 1: REGISTRO DE ACTIVIDAD */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Registro de Actividad
                    </CardTitle>
                    <CardDescription>
                        Últimas {filteredLogs?.length || 0} actividades registradas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por usuario, modelo, objeto o acción..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {filteredLogs?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No se encontraron registros</p>
                            </div>
                        ) : (
                            filteredLogs?.map((log) => {
                                const config = getActionConfig(log.action)
                                const ActionIcon = config.icon

                                return (
                                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                            <ActionIcon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{log.user?.username}</span>
                                                <Badge className={config.color}>{log.action}</Badge>
                                                <span className="text-sm text-muted-foreground capitalize">
                                                    {log.model}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{log.object}</p>
                                            {log.change_message && (
                                                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                                    {log.change_message}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(log.timestamp, 'datetime')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* SECCIÓN 2: SESIONES DE USUARIOS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Sesiones de Usuarios
                    </CardTitle>
                    <CardDescription>
                        Últimos inicios de sesión y actividad de usuarios
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSessions ? (
                        <div className="text-center py-8">
                            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground">Cargando sesiones...</p>
                        </div>
                    ) : sessions?.recent_sessions?.length > 0 ? (
                        <div className="grid gap-3">
                            {sessions.recent_sessions.map((session) => (
                                <div key={session.user_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${session.is_active ? 'bg-green-100' : 'bg-gray-100'
                                            }`}>
                                            <User className={`w-6 h-6 ${session.is_active ? 'text-green-600' : 'text-gray-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold">{session.username}</p>
                                                <Badge variant={session.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {session.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{session.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {session.last_login ? formatDate(session.last_login, 'datetime') : 'Nunca'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Último acceso</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay sesiones registradas</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SECCIÓN 3: ESTADÍSTICAS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Estadísticas
                    </CardTitle>
                    <CardDescription>
                        Análisis de actividad del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Actividad por Tipo */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Actividad por Tipo</h4>
                        <div className="space-y-3">
                            {summary?.actions_breakdown?.map((action, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{action.action}</span>
                                        <span className="text-muted-foreground">
                                            {action.count} ({summary.total_logs > 0 ? Math.round((action.count / summary.total_logs) * 100) : 0}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${action.flag === 1 ? 'bg-green-500' :
                                                    action.flag === 2 ? 'bg-blue-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${summary.total_logs > 0 ? (action.count / summary.total_logs) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Top Usuarios */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Top 5 Usuarios Más Activos</h4>
                        <div className="grid gap-2">
                            {summary?.top_users?.map((user, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{user.username}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{user.count} acciones</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AuditPage