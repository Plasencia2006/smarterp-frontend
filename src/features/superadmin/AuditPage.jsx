// src/features/superadmin/AuditPage.jsx

import { useQuery } from '@tanstack/react-query'
import { auditAPI } from '@services/django.api'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Input } from '@components/ui/input'
import {
    Activity, FileText, User, Clock,
    Search, Calendar, Shield
} from 'lucide-react'
import { useState } from 'react'

export const AuditPage = () => {
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch logs de auditoría
    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const response = await auditAPI.list()
            return response.data || []
        },
        refetchInterval: 30000 // Refrescar cada 30 segundos
    })

    // Fetch resumen
    const { data: summary } = useQuery({
        queryKey: ['audit-summary'],
        queryFn: async () => {
            const response = await auditAPI.summary()
            return response.data
        }
    })

    const getActionBadge = (action) => {
        const colors = {
            'ADDITION': 'bg-green-100 text-green-800 border-green-300',
            'CHANGE': 'bg-blue-100 text-blue-800 border-blue-300',
            'DELETION': 'bg-red-100 text-red-800 border-red-300',
        }
        return colors[action] || 'bg-gray-100 text-gray-800'
    }

    const filteredLogs = logs?.filter(log =>
        log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.object?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando logs de auditoría...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Activity className="w-8 h-8 text-primary" />
                    Auditoría del Sistema
                </h1>
                <p className="text-muted-foreground mt-1">
                    Registro de todas las actividades del sistema
                </p>
            </div>

            {/* Resumen */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.total_logs || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Actividad Hoy</CardTitle>
                        <Clock className="h-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary?.activity_by_day?.length > 0
                                ? summary.activity_by_day[summary.activity_by_day.length - 1].count
                                : 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary?.activity_by_user?.length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por usuario, modelo u objeto..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredLogs?.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No se encontraron logs</p>
                            </div>
                        ) : (
                            filteredLogs?.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        {log.action === 'ADDITION' && <Shield className="w-5 h-5 text-green-600" />}
                                        {log.action === 'CHANGE' && <Shield className="w-5 h-5 text-blue-600" />}
                                        {log.action === 'DELETION' && <Shield className="w-5 h-5 text-red-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold">{log.user}</span>
                                            <Badge className={getActionBadge(log.action)}>
                                                {log.action}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {log.model}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {log.object}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {log.change_message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleString('es-ES')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AuditPage