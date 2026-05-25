// src/features/superadmin/SuperDashboard.jsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI, backupsAPI, auditAPI } from '@services/django.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import { Progress } from '@components/ui/progress'
import { Separator } from '@components/ui/separator'
import {
    Building2, Users, TrendingUp, Activity, Database,
    HardDrive, Cpu, Server, ArrowUpRight, ArrowDownRight,
    RefreshCw, CheckCircle2, AlertCircle, Clock, Shield
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'

// Colores para gráficos
const COLORS = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    cyan: '#06b6d4',
}

const PIE_COLORS = [COLORS.blue, COLORS.purple, COLORS.green, COLORS.amber, COLORS.red]

export const SuperDashboard = () => {
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Fetch datos de analytics
    const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
        queryKey: ['global-stats'],
        queryFn: async () => {
            const response = await analyticsAPI.getGlobalStats()
            return response.data
        }
    })

    // Fetch actividad reciente
    const { data: activity, isLoading: loadingActivity, refetch: refetchActivity } = useQuery({
        queryKey: ['system-activity'],
        queryFn: async () => {
            const response = await analyticsAPI.getActivity()
            return response.data
        }
    })

    // Fetch backups
    const { data: backups, isLoading: loadingBackups, refetch: refetchBackups } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            try {
                const response = await backupsAPI.list()
                return Array.isArray(response.data) ? response.data : []
            } catch {
                return []
            }
        }
    })

    // Fetch auditoría
    const { data: auditSummary, isLoading: loadingAudit, refetch: refetchAudit } = useQuery({
        queryKey: ['audit-summary'],
        queryFn: async () => {
            try {
                const response = await auditAPI.summary()
                return response.data
            } catch {
                return null
            }
        }
    })

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await Promise.all([
            refetchStats(),
            refetchActivity(),
            refetchBackups(),
            refetchAudit()
        ])
        setTimeout(() => setIsRefreshing(false), 500)
    }

    const isLoading = loadingStats || loadingActivity || loadingBackups || loadingAudit

    // Preparar datos para gráficos
    const prepareChartData = () => {
        // Negocios por tipo (gráfico de barras)
        const businessesByType = stats?.businesses_by_type?.map((item, idx) => ({
            name: item.type || 'Sin tipo',
            value: item.count,
            fill: PIE_COLORS[idx % PIE_COLORS.length]
        })) || []

        // Usuarios por estado (gráfico de dona)
        const usersByStatus = stats?.users_by_status?.map((item, idx) => ({
            name: item.estado || 'Sin estado',
            value: item.count,
            fill: item.estado === 'ACTIVO' ? COLORS.green : COLORS.red
        })) || []

        // Crecimiento mensual (gráfico de área)
        const usersGrowth = stats?.users_growth?.map(item => ({
            month: item.month,
            usuarios: item.count
        })) || []

        return { businessesByType, usersByStatus, usersGrowth }
    }

    const chartData = prepareChartData()

    const totalUsers = stats?.totals?.users || 0
    const totalBusinesses = stats?.totals?.businesses || 0
    const activeUsers = stats?.totals?.active_users || 0
    const activeBusinesses = stats?.totals?.active_businesses || 0
    const totalBackups = backups?.length || 0
    const totalAuditLogs = auditSummary?.total_logs || 0
    const activityToday = auditSummary?.activity_today || 0

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Panel de administración global del sistema SMART ERP
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Sistema Online
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* KPIs Principales - 4 columnas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                +{totalBusinesses}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Negocios</p>
                            <h3 className="text-3xl font-bold mt-1">{totalBusinesses}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {activeBusinesses} activos ({totalBusinesses > 0 ? Math.round((activeBusinesses / totalBusinesses) * 100) : 0}%)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                +{totalUsers}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                            <h3 className="text-3xl font-bold mt-1">{totalUsers}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {activeUsers} activos ({totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%)
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {totalBackups}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Backups</p>
                            <h3 className="text-3xl font-bold mt-1">{totalBackups}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {backups && backups.length > 0 ? backups[0].size_mb + ' MB último' : 'Sin backups'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <Clock className="w-3 h-3" />
                                Hoy
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Actividad Hoy</p>
                            <h3 className="text-3xl font-bold mt-1">{activityToday}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {totalAuditLogs} logs totales
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FILA 2: Gráficos Principales */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Crecimiento de Usuarios - Gráfico de Área */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Crecimiento de Usuarios
                        </CardTitle>
                        <CardDescription>Registro de nuevos usuarios por mes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {chartData.usersGrowth.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.usersGrowth}>
                                        <defs>
                                            <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="usuarios"
                                            stroke={COLORS.blue}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorUsuarios)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Sin datos de crecimiento disponibles</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Negocios por Tipo - Gráfico de Barras */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-purple-600" />
                            Negocios por Tipo
                        </CardTitle>
                        <CardDescription>Distribución de negocios según categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {chartData.businessesByType.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.businessesByType}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.businessesByType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Sin datos de negocios disponibles</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FILA 3: Estado de Usuarios + Auditoría */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Estado de Usuarios - Gráfico de Dona */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            Estado de Usuarios
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            {chartData.usersByStatus.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.usersByStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.usersByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Sin datos de usuarios</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Totales debajo del gráfico */}
                        <div className="mt-4 space-y-2">
                            {chartData.usersByStatus.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-semibold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Actividad de Auditoría - Gráfico de Barras Horizontales */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-600" />
                            Actividad de Auditoría
                        </CardTitle>
                        <CardDescription>Resumen de acciones recientes en el sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {auditSummary ? (
                            <div className="space-y-6">
                                {/* Stats de auditoría */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-3xl font-bold text-green-600">
                                            {auditSummary.actions_breakdown?.find(a => a.action === 'Adición')?.count || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">Adiciones</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-3xl font-bold text-blue-600">
                                            {auditSummary.actions_breakdown?.find(a => a.action === 'Modificación')?.count || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">Modificaciones</p>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <p className="text-3xl font-bold text-red-600">
                                            {auditSummary.actions_breakdown?.find(a => a.action === 'Eliminación')?.count || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">Eliminaciones</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Top Usuarios */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-3">Top 5 Usuarios Más Activos</h4>
                                    <div className="space-y-2">
                                        {auditSummary.top_users?.slice(0, 5).map((user, idx) => (
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
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Sin datos de auditoría disponibles</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* FILA 4: Backups Recientes + Negocios Recientes */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Backups Recientes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-green-600" />
                            Backups Recientes
                        </CardTitle>
                        <CardDescription>Últimos respaldos de la base de datos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {backups?.length > 0 ? (
                            <div className="space-y-3">
                                {backups.slice(0, 5).map((backup, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <Database className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{backup.name || backup.filename}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {backup.size_mb} MB • {new Date(backup.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {backup.status === 'completed' ? '✓ Completo' : backup.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                <div className="text-center">
                                    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay backups disponibles</p>
                                    <p className="text-sm mt-1">Crea tu primer backup en la sección de Backups</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actividad Reciente */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Actividad Reciente
                        </CardTitle>
                        <CardDescription>Últimos movimientos del sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activity?.recent_users?.slice(0, 3).map((user, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                                        {(user.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{user.username || 'Usuario'}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        Nuevo registro
                                    </Badge>
                                </div>
                            ))}

                            {activity?.recent_businesses?.slice(0, 2).map((biz, idx) => (
                                <div key={`biz-${idx}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{biz.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{biz.type}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        Negocio creado
                                    </Badge>
                                </div>
                            ))}

                            {(!activity?.recent_users?.length && !activity?.recent_businesses?.length) && (
                                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                                    <div className="text-center">
                                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Sin actividad reciente</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Estado del Sistema */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        Estado del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="font-medium">Base de Datos</p>
                                    <p className="text-sm text-muted-foreground">MySQL 8.0</p>
                                </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Online
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Server className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="font-medium">API Django</p>
                                    <p className="text-sm text-muted-foreground">localhost:8000</p>
                                </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Online
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <HardDrive className="w-5 h-5 text-amber-600" />
                                <div>
                                    <p className="font-medium">Almacenamiento</p>
                                    <p className="text-sm text-muted-foreground">45.8 GB / 100 GB</p>
                                </div>
                            </div>
                            <div className="w-24">
                                <Progress value={45.8} className="h-2" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SuperDashboard