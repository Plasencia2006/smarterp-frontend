// src/layouts/MainLayout.jsx

import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { authStore } from '@store/authStore'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    Menu,
    LogOut,
    ChevronDown,
    Building2,
    BarChart3,
    Shield,
    Store,
    FileText,
    CreditCard,
    Globe,
    Key,
    Database
} from 'lucide-react'
import { Button } from '@components/ui/button'
import { cn } from '@lib/utils'

export const MainLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const { user, userBusinesses, logout } = authStore()
    const isAuthenticated = authStore(state => state.isAuthenticated)

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [businessMenuOpen, setBusinessMenuOpen] = useState(false)

    // Verificar autenticación
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { replace: true })
        }
    }, [isAuthenticated, navigate])

    // Manejar logout
    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    // Obtener negocios y selección
    const businesses = userBusinesses || []
    const selectedBusiness = authStore(state => state.selectedBusiness)
    const handleSelectBusiness = authStore(state => state.selectBusiness)

    // ✅ Función para verificar si es Super Admin
    const isSuperAdmin = (
        user?.is_super_admin === true ||
        user?.is_super_admin === 'true' ||
        user?.is_superuser === true ||
        user?.role === 'SUPER_ADMIN'
    )

    // =============================================================================
    // ✅ MENÚ PARA SUPER ADMIN (Gestión Global del Sistema)
    // =============================================================================
    const superAdminMenu = [
        {
            section: 'Gestión Global',
            items: [
                {
                    icon: LayoutDashboard,
                    label: 'Dashboard Global',
                    path: '/superadmin/dashboard',
                    description: 'Vista general del sistema'
                },
                {
                    icon: Building2,
                    label: 'Negocios',
                    path: '/superadmin/businesses',
                    description: 'Crear y gestionar negocios'
                },
                {
                    icon: Users,
                    label: 'Usuarios',
                    path: '/superadmin/users',
                    description: 'Administrar usuarios del sistema'
                },
            ]
        },
        {
            section: 'Configuración',
            items: [
                {
                    icon: Shield,
                    label: 'Roles y Permisos',
                    path: '/superadmin/roles',
                    description: 'Gestionar roles del sistema'
                },
                {
                    icon: Globe,
                    label: 'Configuración Global',
                    path: '/superadmin/settings',
                    description: 'Ajustes del sistema'
                },
                {
                    icon: Database,
                    label: 'Backups',
                    path: '/superadmin/backups',
                    description: 'Gestión de respaldos'
                },
            ]
        },
        {
            section: 'Reportes',
            items: [
                {
                    icon: BarChart3,
                    label: 'Reportes Globales',
                    path: '/superadmin/reports',
                    description: 'Estadísticas del sistema'
                },
                {
                    icon: FileText,
                    label: 'Auditoría',
                    path: '/superadmin/audit',
                    description: 'Logs y actividad'
                },
            ]
        },
    ]

    // =============================================================================
    // ✅ MENÚ PARA USUARIOS DE NEGOCIO (Módulos Operativos)
    // =============================================================================
    const businessMenu = [
        {
            section: 'Principal',
            items: [
                {
                    icon: LayoutDashboard,
                    label: 'Dashboard',
                    path: '/dashboard',
                    description: 'Resumen del negocio'
                },
            ]
        },
        {
            section: 'Operaciones',
            items: [
                {
                    icon: Package,
                    label: 'Inventario',
                    path: '/inventory',
                    description: 'Gestionar productos'
                },
                {
                    icon: ShoppingCart,
                    label: 'Ventas',
                    path: '/sales',
                    description: 'Registrar ventas'
                },
                {
                    icon: CreditCard,
                    label: 'Caja',
                    path: '/cashier',
                    description: 'Punto de venta'
                },
            ]
        },
        {
            section: 'Análisis',
            items: [
                {
                    icon: BarChart3,
                    label: 'Reportes',
                    path: '/reports',
                    description: 'Estadísticas del negocio'
                },
                {
                    icon: FileText,
                    label: 'Facturación',
                    path: '/billing',
                    description: 'Documentos electrónicos'
                },
            ]
        },
        {
            section: 'Configuración',
            items: [
                {
                    icon: Users,
                    label: 'Miembros',
                    path: '/members',
                    description: 'Equipo del negocio'
                },
                {
                    icon: Settings,
                    label: 'Ajustes',
                    path: '/settings',
                    description: 'Configuración del negocio'
                },
            ]
        },
    ]

    // ✅ Seleccionar menú según el rol
    const menuSections = isSuperAdmin ? superAdminMenu : businessMenu

    // =============================================================================
    // ✅ RENDERIZADO DEL SIDEBAR
    // =============================================================================
    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-transform bg-sidebar border-r border-sidebar-border",
                sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0 lg:w-20"
            )}>
                <div className="flex h-full flex-col">

                    {/* Logo y Toggle */}
                    <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            {sidebarOpen && (
                                <div>
                                    <span className="font-semibold text-sidebar-foreground block">SMART ERP</span>
                                    <span className="text-xs text-muted-foreground">
                                        {isSuperAdmin ? 'Super Admin' : selectedBusiness?.name || 'Negocio'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu size={16} />
                        </Button>
                    </div>

                    {/* Selector de Negocio - Solo para usuarios normales */}
                    {sidebarOpen && !isSuperAdmin && businesses.length > 0 && (
                        <div className="p-4 border-b border-sidebar-border">
                            <div className="relative">
                                <button
                                    onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
                                    className="w-full flex items-center justify-between p-2 rounded-md bg-sidebar-accent text-sidebar-foreground text-sm hover:bg-sidebar-accent/80 transition-colors"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Building2 size={16} />
                                        <span className="truncate font-medium">{selectedBusiness?.name || 'Seleccionar'}</span>
                                    </div>
                                    <ChevronDown size={14} className={cn("transition-transform", businessMenuOpen && "rotate-180")} />
                                </button>

                                {businessMenuOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                                        {businesses.map((biz) => {
                                            const bizId = biz.business || biz.id || biz.business_id
                                            const bizName = biz.business_name || biz.name || 'Negocio'
                                            const isSelected = selectedBusiness?.id === bizId

                                            return (
                                                <button
                                                    key={bizId}
                                                    onClick={() => {
                                                        handleSelectBusiness(bizId, bizName)
                                                        setBusinessMenuOpen(false)
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between",
                                                        isSelected && "bg-accent font-medium"
                                                    )}
                                                >
                                                    <span className="truncate">{bizName}</span>
                                                    {isSelected && <span className="text-xs text-primary">✓</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Menú de Navegación */}
                    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
                        {menuSections.map((section, sectionIndex) => (
                            <div key={sectionIndex}>
                                {/* Título de sección */}
                                {sidebarOpen && (
                                    <div className="px-3 py-2">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {section.section}
                                        </h3>
                                    </div>
                                )}

                                {/* Items de la sección */}
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = location.pathname === item.path ||
                                            location.pathname.startsWith(item.path + '/')

                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => navigate(item.path)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                                                )}
                                                title={!sidebarOpen ? item.label : undefined}
                                            >
                                                <item.icon
                                                    size={18}
                                                    className={cn(
                                                        "flex-shrink-0",
                                                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                                                    )}
                                                />
                                                {sidebarOpen && (
                                                    <div className="flex-1 text-left">
                                                        <span className="block">{item.label}</span>
                                                        {item.description && sidebarOpen && (
                                                            <span className={cn(
                                                                "block text-xs",
                                                                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {item.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Menu - Footer */}
                    <div className="p-4 border-t border-sidebar-border space-y-2">
                        {/* Info del usuario */}
                        {sidebarOpen && (
                            <div className="px-2 py-3 rounded-md bg-sidebar-accent/50">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {user?.username || user?.email}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </p>
                                {isSuperAdmin ? (
                                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-purple-400">
                                        <Shield size={12} /> Super Admin
                                    </span>
                                ) : selectedBusiness && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-primary">
                                        <Building2 size={12} /> {selectedBusiness.name}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Botón de logout */}
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                                !sidebarOpen && "justify-center"
                            )}
                        >
                            <LogOut size={18} className="text-muted-foreground" />
                            {sidebarOpen && <span>Cerrar Sesión</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Contenido Principal */}
            <div className={cn(
                "transition-all duration-300",
                sidebarOpen ? "lg:ml-64" : "lg:ml-20"
            )}>
                {/* Header Superior */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
                    {/* Toggle Sidebar para móvil */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-md hover:bg-muted"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Título de la página */}
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">
                            {isSuperAdmin ? 'Panel de Super Admin' : selectedBusiness?.name || 'Dashboard'}
                        </h1>
                    </div>

                    {/* Acciones del header */}
                    <div className="flex items-center gap-4">
                        {/* Badge de entorno (solo dev) */}
                        {import.meta.env.DEV && (
                            <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800">
                                Desarrollo
                            </span>
                        )}

                        {/* Info rápida */}
                        <div className="text-sm text-muted-foreground hidden sm:block">
                            {user?.email}
                        </div>
                    </div>
                </header>

                {/* Contenido de la Página */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout