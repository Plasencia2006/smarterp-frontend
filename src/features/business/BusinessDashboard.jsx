// src/features/business/BusinessDashboard.jsx
// ✅ RESPONSABLE: Solo del contenido del dashboard principal del negocio
// ✅ NO maneja layout, sidebar, header, ni navegación global

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    Users,
    Package,
    TrendingUp,
    UserCog,
    ShoppingCart,
    BarChart3,
    Settings,
    ArrowRight,
    AlertCircle,
    Loader2
} from 'lucide-react'

// ✅ Componente: Stats del Dashboard
function DashboardStats({ businessId }) {
    // Fetch stats del negocio (ejemplo con React Query)
    const { data: stats, isLoading } = useQuery({
        queryKey: ['business-stats', businessId],
        queryFn: async () => {
            // TODO: Conectar con API real
            // const res = await businessAPI.getStats(businessId)
            // return res.data
            return {
                members: 0,
                products: 0,
                sales: 0,
                status: 'active'
            }
        },
        enabled: !!businessId,
        staleTime: 5 * 60 * 1000, // 5 minutos
    })

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                                <div className="h-8 bg-gray-200 rounded w-16"></div>
                                <div className="h-3 bg-gray-200 rounded w-32"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const statsData = [
        {
            title: 'Miembros',
            value: stats?.members ?? 0,
            description: 'Usuarios del negocio',
            icon: Users,
            color: 'text-blue-600',
            trend: null
        },
        {
            title: 'Productos',
            value: stats?.products ?? 0,
            description: 'En inventario',
            icon: Package,
            color: 'text-green-600',
            trend: null
        },
        {
            title: 'Ventas',
            value: `$${(stats?.sales ?? 0).toFixed(2)}`,
            description: 'Este mes',
            icon: TrendingUp,
            color: 'text-purple-600',
            trend: null
        },
        {
            title: 'Estado',
            value: stats?.status === 'active' ? 'Activo' : 'Inactivo',
            description: 'Negocio operativo',
            icon: Building2,
            color: stats?.status === 'active' ? 'text-green-600' : 'text-red-600',
            trend: null
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat) => {
                const Icon = stat.icon
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// ✅ Componente: Acciones Rápidas
function QuickActions({ onNavigate }) {
    const { hasPermission } = useAuth()

    const actions = [
        {
            title: 'Gestionar Usuarios',
            description: 'Crea y administra usuarios del negocio',
            icon: UserCog,
            color: 'bg-blue-100 text-blue-600',
            path: '/business/users',
            permission: 'users.view'
        },
        {
            title: 'Inventario',
            description: 'Gestiona productos y stock',
            icon: Package,
            color: 'bg-green-100 text-green-600',
            path: '/business/inventory',
            permission: 'inventory.read'
        },
        {
            title: 'Ventas',
            description: 'Registro y seguimiento de ventas',
            icon: ShoppingCart,
            color: 'bg-purple-100 text-purple-600',
            path: '/business/sales',
            permission: 'sales.view'
        },
        {
            title: 'Reportes',
            description: 'Análisis y estadísticas',
            icon: BarChart3,
            color: 'bg-orange-100 text-orange-600',
            path: '/business/reports',
            permission: 'reports.view'
        },
        {
            title: 'Configuración',
            description: 'Ajustes del negocio',
            icon: Settings,
            color: 'bg-gray-100 text-gray-600',
            path: '/business/settings',
            permission: 'business.update'
        }
    ]

    // Filtrar acciones según permisos (opcional, se puede hacer en ProtectedRoute también)
    const visibleActions = actions.filter(action =>
        !action.permission || hasPermission(action.permission)
    )

    if (visibleActions.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        No tienes acceso a ningún módulo. Contacta al administrador.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleActions.map((action) => {
                    const Icon = action.icon
                    return (
                        <Card
                            key={action.title}
                            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-gray-200"
                            onClick={() => onNavigate(action.path)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${action.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {action.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

// ✅ Componente: Información del Negocio
function BusinessInfo({ business }) {
    if (!business) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    No hay información disponible del negocio
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Negocio</CardTitle>
                <CardDescription>
                    Detalles de tu negocio
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <span className="text-muted-foreground font-medium">Nombre:</span>
                        <p className="font-semibold">{business.business_name}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-muted-foreground font-medium">Tu Rol:</span>
                        <Badge variant="outline" className="capitalize">
                            {business.membership_role || 'Miembro'}
                        </Badge>
                    </div>
                    {business.email && (
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium">Email:</span>
                            <p className="font-medium">{business.email}</p>
                        </div>
                    )}
                    {business.phone && (
                        <div className="space-y-1">
                            <span className="text-muted-foreground font-medium">Teléfono:</span>
                            <p className="font-medium">{business.phone}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// ✅ Componente Principal del Dashboard
export const BusinessDashboard = () => {
    const navigate = useNavigate()
    const { user, loading } = useAuth()

    // Obtener el negocio actual del usuario (del contexto, no hace fetch adicional)
    const business = user?.business_memberships?.[0]
    const businessId = business?.business || business?.id
    const businessName = business?.business_name || 'Mi Negocio'

    // Loading del contexto de autenticación
    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    // Si no hay negocio asignado
    if (!business) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Sin Negocio Asignado</h2>
                        <p className="text-muted-foreground mb-6">
                            Tu cuenta está activa pero no tienes ningún negocio asignado.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/select-business')}>
                            Seleccionar Negocio
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header del Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{businessName}</h1>
                    <p className="text-muted-foreground mt-1">
                        Panel de administración del negocio 
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                            {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Componente separado */}
            <DashboardStats businessId={businessId} />

            {/* Quick Actions - Componente separado */}
            <QuickActions onNavigate={navigate} />

            {/* Business Info - Componente separado */}
            <BusinessInfo business={business} />

            {/* Sección de Actividad Reciente (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>
                        Últimas acciones en tu negocio
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay actividad reciente para mostrar</p>
                        <p className="text-xs mt-1">
                            Las acciones aparecerán aquí automáticamente
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default BusinessDashboard