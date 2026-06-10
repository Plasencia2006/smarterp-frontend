// src/layouts/BusinessLayout.jsx
// ✅ RESPONSABLE: Estructura visual, navegación y filtrado por rol

import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
    LayoutDashboard, Menu, LogOut, ChevronDown, Building2,
    Bell, Search, Settings, User, X, ChevronRight,
    Package, ShoppingCart, Users, BarChart3, Wrench,
    CreditCard, Shield, Activity, Users2, DollarSign,
    FileText, ClipboardList, HeadphonesIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const BusinessLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, loading } = useAuth()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)

    // ✅ Datos básicos para mostrar en UI
    const businessName = user?.business_memberships?.[0]?.business_name || 'Mi Negocio'
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email
    const userAvatar = user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
    const userRole = user?.business_memberships?.[0]?.membership_role?.toUpperCase() || 'USER'

    // ✅ CONFIGURACIÓN DE MENÚS POR ROL
    const menuConfig = useMemo(() => {
        const allMenus = {
            // 🏢 ADMIN - Acceso completo
            ADMIN: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Operaciones', items: [
                        { id: 'sales', label: 'Ventas', path: '/business/sales', icon: ShoppingCart },
                        { id: 'inventory', label: 'Inventario', path: '/business/inventory', icon: Package },
                        { id: 'cashier', label: 'Caja', path: '/business/cashier', icon: CreditCard },
                        { id: 'services', label: 'Servicios', path: '/business/services', icon: Wrench },
                    ]
                },
                {
                    section: 'Gestión', items: [
                        { id: 'users', label: 'Usuarios', path: '/business/users', icon: Users },
                        { id: 'roles', label: 'Roles', path: '/business/roles', icon: Shield },
                        { id: 'members', label: 'Miembros', path: '/business/members', icon: Users2 },
                    ]
                },
                {
                    section: 'Análisis', items: [
                        { id: 'reports', label: 'Reportes', path: '/business/reports', icon: BarChart3 },
                        { id: 'audit', label: 'Auditoría', path: '/business/audit', icon: Activity },
                    ]
                },
                {
                    section: 'Configuración', items: [
                        { id: 'settings', label: 'Configuración', path: '/business/settings', icon: Settings },
                    ]
                },
            ],

            // 💵 CAJERO - Solo caja y ventas básicas
            CAJERO: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Mi Caja', path: '/cajero/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Operaciones', items: [
                        { id: 'cashier', label: 'Caja', path: '/business/cashier', icon: CreditCard },
                        { id: 'sales', label: 'Ventas', path: '/business/sales', icon: ShoppingCart },
                    ]
                },
                {
                    section: 'Reportes', items: [
                        { id: 'reports', label: 'Mis Ventas', path: '/business/reports', icon: BarChart3 },
                    ]
                },
            ],

            // 💰 VENDEDOR - Solo ventas y catálogo
            VENDEDOR: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Mis Ventas', path: '/vendedor/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Operaciones', items: [
                        { id: 'sales', label: 'Nueva Venta', path: '/business/sales', icon: ShoppingCart },
                        { id: 'inventory', label: 'Catálogo', path: '/business/inventory', icon: Package },
                    ]
                },
                {
                    section: 'Reportes', items: [
                        { id: 'reports', label: 'Mi Rendimiento', path: '/business/reports', icon: BarChart3 },
                    ]
                },
            ],

            // 📊 CONTADOR - Solo reportes financieros y auditoría
            CONTADOR: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Panel Contable', path: '/contador/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Finanzas', items: [
                        { id: 'reports', label: 'Reportes Financieros', path: '/business/reports', icon: BarChart3 },
                        { id: 'audit', label: 'Auditoría', path: '/business/audit', icon: Activity },
                    ]
                },
                {
                    section: 'Consultas', items: [
                        { id: 'sales', label: 'Historial Ventas', path: '/business/sales', icon: ShoppingCart },
                        { id: 'inventory', label: 'Valor Inventario', path: '/business/inventory', icon: Package },
                    ]
                },
            ],

            // 📦 INVENTARIO - Solo inventario y stock
            INVENTARIO: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Control Inventario', path: '/inventario/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Gestión', items: [
                        { id: 'inventory', label: 'Inventario', path: '/business/inventory', icon: Package },
                    ]
                },
                {
                    section: 'Reportes', items: [
                        { id: 'reports', label: 'Reportes Stock', path: '/business/reports', icon: BarChart3 },
                    ]
                },
            ],

            // 🔧 SOPORTE - Solo servicios y tickets
            SOPORTE: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Panel Soporte', path: '/soporte/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Operaciones', items: [
                        { id: 'services', label: 'Servicios', path: '/business/services', icon: Wrench },
                    ]
                },
                {
                    section: 'Reportes', items: [
                        { id: 'reports', label: 'Tickets', path: '/business/reports', icon: BarChart3 },
                    ]
                },
            ],

            // 👤 USER - Menú mínimo por defecto
            USER: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard },
                    ]
                },
            ],
        }

        // Retornar el menú correspondiente al rol, o USER por defecto
        return allMenus[userRole] || allMenus.USER
    }, [userRole])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ==================== SIDEBAR ==================== */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white border-r",
                sidebarOpen ? "w-64" : "w-20",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex h-full flex-col">

                    {/* Header del Sidebar */}
                    <div className="flex h-16 items-center justify-between px-4 border-b">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            {sidebarOpen && (
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{businessName}</p>
                                    <Badge variant="outline" className="text-[10px]">
                                        {userRole === 'ADMIN' ? 'Administrador' : userRole}
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMobileMenuOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* ✅ Navegación FILTRADA por rol */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                        {menuConfig.map((section) => (
                            <div key={section.section}>
                                {sidebarOpen && (
                                    <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {section.section}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const Icon = item.icon
                                        const isActive = location.pathname.startsWith(item.path)
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item.path)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                                    !sidebarOpen && "justify-center px-2"
                                                )}
                                                title={!sidebarOpen ? item.label : undefined}
                                            >
                                                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-gray-400")} />
                                                {sidebarOpen && <span>{item.label}</span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer del Sidebar */}
                    <div className="p-3 border-t bg-gray-50">
                        <div className={cn("flex items-center gap-3 p-2 rounded-lg", sidebarOpen ? "" : "justify-center")}>
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-sm font-semibold text-primary">{userAvatar}</span>
                            </div>
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            )}
                        </div>
                        <div className={cn("flex gap-2 mt-3", sidebarOpen ? "" : "flex-col")}>
                            <Button variant="ghost" size={sidebarOpen ? "sm" : "icon"} className="w-full justify-start" onClick={() => setSidebarOpen(!sidebarOpen)}>
                                {sidebarOpen ? <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
                                {sidebarOpen && "Contraer"}
                            </Button>
                            <Button variant="ghost" size={sidebarOpen ? "sm" : "icon"} className="w-full justify-start text-red-600" onClick={logout}>
                                <LogOut className="w-4 h-4" />
                                {sidebarOpen && "Salir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ==================== CONTENIDO PRINCIPAL ==================== */}
            <div className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "lg:ml-64" : "lg:ml-20")}>

                {/* Header Superior */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur px-6">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>

                    {/* Búsqueda */}
                    <div className="flex-1 max-w-md hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Buscar..." className="pl-9 bg-gray-50" />
                        </div>
                    </div>

                    {/* Acciones Derecha */}
                    <div className="flex items-center gap-2 ml-auto">

                        {/* Notificaciones */}
                        <div className="relative">
                            <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                                <Bell className="w-5 h-5 text-gray-600" />
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500">3</Badge>
                            </Button>
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg z-50">
                                    <div className="p-3 border-b font-medium text-sm">Notificaciones</div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <div className="p-3 hover:bg-gray-50 cursor-pointer border-b">
                                            <p className="text-sm font-medium">📦 Stock bajo: Mouse</p>
                                            <p className="text-xs text-gray-500">Hace 10 min</p>
                                        </div>
                                    </div>
                                    <div className="p-2 border-t text-center">
                                        <button onClick={() => setNotificationsOpen(false)} className="text-xs text-primary hover:underline">Cerrar</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Menú de Usuario */}
                        <div className="relative">
                            <Button variant="ghost" className="flex items-center gap-2 px-3" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-semibold text-primary">{userAvatar}</span>
                                </div>
                                {sidebarOpen && (
                                    <>
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium">{userName}</p>
                                            <p className="text-xs text-gray-500">{businessName}</p>
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
                                    </>
                                )}
                            </Button>
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                    <button onClick={() => { navigate('/business/profile'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Perfil
                                    </button>
                                    <button onClick={() => { navigate('/business/settings'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                                        <Settings className="w-4 h-4" /> Configuración
                                    </button>
                                    <div className="border-t my-1"></div>
                                    <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ÁREA DE CONTENIDO */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            {/* Overlay para móvil */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}
            {(userMenuOpen || notificationsOpen) && (
                <div className="fixed inset-0 z-20" onClick={() => { setUserMenuOpen(false); setNotificationsOpen(false); }} />
            )}
        </div>
    )
}

export default BusinessLayout