// src/layouts/BusinessLayout.jsx

import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
    LayoutDashboard,
    Menu,
    LogOut,
    ChevronDown,
    Building2,
    Bell,
    Search,
    Settings,
    User,
    X,
    ChevronRight,
    Package,
    ShoppingCart,
    Users,
    BarChart3,
    Wrench,
    CreditCard,
    FileText,
    AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const BusinessLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, loading, hasPermission } = useAuth()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)

    const businessName = user?.business_memberships?.[0]?.business_name || 'Mi Negocio'
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email
    const primaryRole = user?.roles?.[0]?.name || 'Usuario'

    // Módulos del negocio con permisos requeridos
    const businessModules = [
        { id: 'dashboard', title: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard, permission: null, color: 'text-blue-600' },
        { id: 'sales', title: 'Ventas', path: '/business/sales', icon: ShoppingCart, permission: 'sales.view', color: 'text-green-600' },
        { id: 'inventory', title: 'Inventario', path: '/business/inventory', icon: Package, permission: 'inventory.read', color: 'text-purple-600' },
        { id: 'cashier', title: 'Caja', path: '/business/cashier', icon: CreditCard, permission: 'cashier.manage', color: 'text-orange-600' },
        { id: 'users', title: 'Usuarios', path: '/business/users', icon: Users, permission: 'users.view', color: 'text-indigo-600' },
        { id: 'services', title: 'Servicios', path: '/business/services', icon: Wrench, permission: 'services.view', color: 'text-cyan-600' },
        { id: 'reports', title: 'Reportes', path: '/business/reports', icon: BarChart3, permission: 'reports.view', color: 'text-rose-600' },
        { id: 'settings', title: 'Configuración', path: '/business/settings', icon: Settings, permission: 'business.update', color: 'text-gray-600' },
    ]

    // Filtrar módulos según permisos
    const visibleModules = businessModules.filter(m => !m.permission || hasPermission(m.permission))

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* ==================== SIDEBAR ==================== */}
            <aside className={cn(
                "fixed left-0 top-0 z-50 h-screen transition-all duration-300 bg-white border-r shadow-sm",
                sidebarOpen ? "w-64" : "w-20",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="flex h-full flex-col">

                    {/* Logo / Business Header */}
                    <div className="flex h-16 items-center justify-between px-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            {sidebarOpen && (
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm text-gray-900 truncate">{businessName}</p>
                                    <Badge variant="outline" className="text-[10px] mt-1">{primaryRole}</Badge>
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMobileMenuOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {visibleModules.map((module) => {
                            const Icon = module.icon
                            const isActive = location.pathname.startsWith(module.path)

                            return (
                                <button
                                    key={module.id}
                                    onClick={() => navigate(module.path)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
                                        isActive
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                        !sidebarOpen && "justify-center px-2"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 shrink-0", module.color)} />
                                    {sidebarOpen && <span className="flex-1 text-left">{module.title}</span>}
                                </button>
                            )
                        })}
                    </nav>

                    {/* User Footer */}
                    <div className="p-3 border-t bg-gray-50/50 space-y-2">
                        <div className={cn("flex items-center gap-3 p-2 rounded-lg", sidebarOpen ? "" : "justify-center")}>
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            )}
                        </div>

                        <div className={cn("flex gap-2", sidebarOpen ? "" : "flex-col")}>
                            <Button variant="ghost" size={sidebarOpen ? "sm" : "icon"} className="w-full justify-start text-gray-600" onClick={() => setSidebarOpen(!sidebarOpen)}>
                                {sidebarOpen ? <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
                                {sidebarOpen && "Contraer"}
                            </Button>
                            <Button variant="ghost" size={sidebarOpen ? "sm" : "icon"} className="w-full justify-start text-red-600 hover:text-red-700" onClick={logout}>
                                <LogOut className="w-4 h-4" />
                                {sidebarOpen && "Salir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ==================== MAIN CONTENT ==================== */}
            <div className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "lg:ml-64" : "lg:ml-20")}>

                {/* Header */}
                <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-6 shadow-sm">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>

                    {/* Search */}
                    <div className="flex-1 max-w-md hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Buscar..." className="pl-9 bg-gray-50" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>

                    {/* Right Actions - SIN dropdown-menu */}
                    <div className="flex items-center gap-2 ml-auto">

                        {/* Notifications (simple) */}
                        <div className="relative">
                            <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                                <Bell className="w-5 h-5 text-gray-600" />
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500">3</Badge>
                            </Button>

                            {/* Notificaciones simples con div */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg z-50">
                                    <div className="p-3 border-b font-medium text-sm">Notificaciones</div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <div className="p-3 hover:bg-gray-50 cursor-pointer border-b">
                                            <p className="text-sm font-medium">📦 Stock bajo: Mouse</p>
                                            <p className="text-xs text-gray-500">Hace 10 min</p>
                                        </div>
                                        <div className="p-3 hover:bg-gray-50 cursor-pointer border-b">
                                            <p className="text-sm font-medium">💰 Nueva venta: $120</p>
                                            <p className="text-xs text-gray-500">Hace 25 min</p>
                                        </div>
                                    </div>
                                    <div className="p-2 border-t text-center">
                                        <button onClick={() => setNotificationsOpen(false)} className="text-xs text-primary hover:underline">Cerrar</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu (simple) */}
                        <div className="relative">
                            <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-gray-100" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                {sidebarOpen && (
                                    <>
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium text-gray-900">{userName}</p>
                                            <p className="text-xs text-gray-500">{businessName}</p>
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", userMenuOpen && "rotate-180")} />
                                    </>
                                )}
                            </Button>

                            {/* Menú de usuario simple con div */}
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

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Click outside to close menus */}
            {(userMenuOpen || notificationsOpen) && (
                <div className="fixed inset-0 z-30" onClick={() => { setUserMenuOpen(false); setNotificationsOpen(false); }} />
            )}
        </div>
    )
}

export default BusinessLayout