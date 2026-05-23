import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authStore } from '@store/authStore'
import { usersAPI, businessAPI } from '@services/django.api'
import {
    Building2,
    Users,
    Server,
    Activity,
    AlertCircle,
    CheckCircle2,
    Package,
    HardDrive,
    Clock,
    Database,
    Shield,
    FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Button } from '@components/ui/button'

export const SuperDashboard = () => {
    const navigate = useNavigate()
    const { user } = authStore()

    useEffect(() => {
        if (!user?.is_super_admin) {
            navigate('/dashboard')
        }
    }, [user, navigate])

    // ✅ Fetch de usuarios - CORREGIDO
    const { data: usersResponse, isLoading: loadingUsers, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const response = await usersAPI.list()
                // La API retorna { results: [], count: N }
                const usersArray = response.data?.results || response.data || []
                console.log('✅ Usuarios cargados:', usersArray.length)
                return usersArray
            } catch (err) {
                console.error('❌ Error fetching users:', err)
                return []  // Retornar array vacío en caso de error
            }
        },
        enabled: !!user?.is_super_admin,
    })

    // ✅ Fetch de negocios
    const { data: businesses, isLoading: loadingBusinesses } = useQuery({
        queryKey: ['businesses'],
        queryFn: async () => {
            try {
                const response = await businessAPI.list()
                return response.data?.results || response.data || []
            } catch (err) {
                console.error('Error fetching businesses:', err)
                return []
            }
        },
        enabled: !!user?.is_super_admin,
    })

    if (!user?.is_super_admin) return null

    // ✅ Asegurar que siempre sean arrays
    const users = Array.isArray(usersResponse) ? usersResponse : []
    const businessesList = Array.isArray(businesses) ? businesses : []

    // Calcular estadísticas - AHORA FUNCIONA
    const totalBusinesses = businessesList.length
    const activeBusinesses = businessesList.filter(b => b.estado === 'ACTIVO').length

    const totalUsers = users.length
    const activeUsers = users.filter(u => u.estado === 'ACTIVO' || u.is_active).length
    const superAdmins = users.filter(u => u.is_super_admin || u.is_superuser).length

    // Contar negocios por tipo
    const businessByType = businessesList.reduce((acc, biz) => {
        acc[biz.type] = (acc[biz.type] || 0) + 1
        return acc
    }, {})

    // Métricas del sistema (simuladas - luego vienen del backend)
    const storageUsed = 45.8
    const storageTotal = 100
    const apiRequests24h = 15420
    const uptime = 99.98
    const lastBackup = '2 horas'
    const activeJobs = 12
    const auditLogsToday = 342

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Panel de administración global del sistema
                    </p>
                </div>
                <Button onClick={() => navigate('/superadmin/users')}>
                    <Users className="w-4 h-4 mr-2" />
                    Ver Usuarios
                </Button>
            </div>

            {/* Stats Grid - Métricas Principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Negocios */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Negocios
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingBusinesses ? '...' : totalBusinesses}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {activeBusinesses} activos
                        </p>
                    </CardContent>
                </Card>

                {/* Usuarios */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Usuarios
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingUsers ? '...' : totalUsers}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {activeUsers} activos • {superAdmins} admins
                        </p>
                    </CardContent>
                </Card>

                {/* Almacenamiento */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Almacenamiento
                        </CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{storageUsed} GB</div>
                        <p className="text-xs text-muted-foreground">
                            de {storageTotal} GB totales
                        </p>
                        <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                            <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${(storageUsed / storageTotal) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Peticiones API (24h) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Peticiones API
                        </CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(apiRequests24h / 1000).toFixed(1)}k
                        </div>
                        <p className="text-xs text-muted-foreground">
                            últimas 24 horas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Segunda fila - Métricas del Sistema */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Uptime del Sistema */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-600" />
                            Tiempo de Actividad
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{uptime}%</div>
                        <p className="text-sm text-muted-foreground">
                            Últimos 30 días
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span className="text-green-600">Sistema estable</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Último Backup */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Último Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{lastBackup}</span>
                            <span className="text-sm text-muted-foreground">hace</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Automático cada 24h
                        </p>
                    </CardContent>
                </Card>

                {/* Tareas Programadas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            Tareas Programadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeJobs}</div>
                        <p className="text-sm text-muted-foreground">
                            Jobs activos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tercera fila - Distribución y Logs */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Negocios por Tipo */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            Negocios por Tipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(businessByType).length > 0 ? (
                                Object.entries(businessByType).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground capitalize">{type}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary rounded-full h-2"
                                                    style={{ width: `${(count / totalBusinesses) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-8">{count}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">Sin negocios registrados</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Logs de Auditoría */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-orange-600" />
                            Logs de Auditoría
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-4">{auditLogsToday}</div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Eventos hoy
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                <span className="text-muted-foreground">Logins exitosos</span>
                                <span className="font-medium">156</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                <span className="text-muted-foreground">Negocios creados</span>
                                <span className="font-medium">3</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                                <span className="text-muted-foreground">Usuarios nuevos</span>
                                <span className="font-medium">8</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Estado del Sistema */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Estado del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Server className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-medium">API Django</p>
                                    <p className="text-xs text-muted-foreground">localhost:8000</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-green-600">OK</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-medium">Microservicios</p>
                                    <p className="text-xs text-muted-foreground">Spring Boot</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-green-600">OK</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="font-medium">Base de Datos</p>
                                    <p className="text-xs text-muted-foreground">PostgreSQL</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-green-600">OK</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Negocios Recientes */}
            {businessesList.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Negocios Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {businessesList.slice(0, 5).map((business) => (
                                <div
                                    key={business.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                    onClick={() => navigate(`/superadmin/businesses/${business.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="font-medium">{business.name}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{business.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(business.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default SuperDashboard