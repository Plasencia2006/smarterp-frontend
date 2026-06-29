import { useState, useMemo, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
    LayoutDashboard, Menu, LogOut, ChevronDown, Building2,
    Bell, Search, Settings, User, X, ChevronRight,
    Package, ShoppingCart, Users, BarChart3, Wrench,
    CreditCard, Shield, Activity, Users2, DollarSign,
    FileText, ClipboardList, HeadphonesIcon, AlertTriangle, Tag,
    Receipt, Lock, Unlock, Sun, Moon, Wallet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import DarkModeToggle from '@/components/DarkModeToggle'

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
            CAJERO: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Mi Caja', path: '/cajero/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Operaciones', items: [
                        { id: 'procesar-pago', label: 'Procesar Pago', path: '/cajero/procesar-pago', icon: DollarSign },
                        { id: 'facturas', label: 'Facturas', path: '/cajero/facturas', icon: FileText },
                        { id: 'venta-directa', label: 'Venta Directa', path: '/cajero/venta-directa', icon: ShoppingCart },
                    ]
                },
                {
                    section: 'Control de Efectivo', items: [
                        { id: 'arqueos', label: 'Arqueos', path: '/cajero/arqueos', icon: Shield },
                        { id: 'retiros', label: 'Retiros', path: '/cajero/retiros', icon: Wallet },
                        { id: 'flujo', label: 'Flujo de Efectivo', path: '/cajero/flujo-efectivo', icon: BarChart3 },
                    ]
                },
                {
                    section: 'Gestión', items: [
                        { id: 'apertura', label: 'Abrir Caja', path: '/cajero/apertura', icon: Unlock },
                        { id: 'cierre', label: 'Cerrar Caja', path: '/cajero/cierre', icon: Lock },
                    ]
                },
            ],

            VENDEDOR: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Mi Panel', path: '/vendedor/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Operaciones', items: [
                        { id: 'pos', label: 'Nueva Cotización', path: '/vendedor/pos', icon: ShoppingCart },
                        { id: 'quotes', label: 'Mis Cotizaciones', path: '/vendedor/cotizaciones', icon: Receipt },
                        { id: 'customers', label: 'Clientes', path: '/vendedor/clientes', icon: Users },
                    ]
                },
            ],
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
            INVENTARIO: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Panel Inventario', path: '/inventario/dashboard', icon: LayoutDashboard },
                    ]
                },
                {
                    section: 'Gestión', items: [
                        { id: 'products', label: 'Productos', path: '/inventario/products', icon: Package },
                        { id: 'categories', label: 'Categorías', path: '/inventario/categories', icon: Tag },
                        { id: 'stock', label: 'Control Stock', path: '/inventario/stock', icon: BarChart3 },
                        { id: 'alerts', label: 'Alertas', path: '/inventario/alerts', icon: AlertTriangle },
                    ]
                },
                {
                    section: 'Compras', items: [
                        { id: 'suppliers', label: 'Proveedores', path: '/inventario/suppliers', icon: Users2 },
                        { id: 'purchases', label: 'Órdenes de Compra', path: '/inventario/purchases', icon: ShoppingCart },
                    ]
                },
            ],
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
            USER: [
                {
                    section: 'Principal', items: [
                        { id: 'dashboard', label: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard },
                    ]
                },
            ],
        }

        return allMenus[userRole] || allMenus.USER
    }, [userRole])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* ==================== SIDEBAR ==================== */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 border-r flex flex-col",
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                sidebarOpen ? "w-64" : "w-20",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>

                {/* Header del Sidebar */}
                <div className={cn("flex h-16 items-center justify-between px-4 border-b shrink-0",
                    "border-gray-200 dark:border-gray-700"
                )}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn("p-2 rounded-lg shrink-0",
                            "bg-primary/10 dark:bg-primary/20"
                        )}>
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        {sidebarOpen && (
                            <div className="min-w-0">
                                <p className={cn("font-semibold text-sm truncate",
                                    "text-gray-900 dark:text-white"
                                )}>{businessName}</p>
                                <Badge variant="outline" className="text-[10px]">
                                    {userRole === 'ADMIN' ? 'Administrador' : userRole}
                                </Badge>
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMobileMenuOpen(false)}>
                        <X className={cn("w-4 h-4",
                            "text-gray-900 dark:text-gray-300"
                        )} />
                    </Button>
                </div>

                {/* Navegación (Scrollable) */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    {menuConfig.map((section) => (
                        <div key={section.section}>
                            {sidebarOpen && (
                                <h3 className={cn("px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                                    "text-gray-400"
                                )}>
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
                                                    ? "bg-primary/10 dark:bg-primary/20 text-primary"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                                                !sidebarOpen && "justify-center px-2"
                                            )}
                                            title={!sidebarOpen ? item.label : undefined}
                                        >
                                            <Icon className={cn("w-5 h-5 shrink-0",
                                                isActive ? "text-primary" : "text-gray-400"
                                            )} />
                                            {sidebarOpen && <span>{item.label}</span>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer del Sidebar */}
                <div className={cn("p-3 border-t bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shrink-0")}>
                    {/* User Profile */}
                    <div className={cn("flex items-center gap-3 p-2 rounded-lg", sidebarOpen ? "" : "justify-center")}>
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            "bg-primary/10 dark:bg-primary/20"
                        )}>
                            <span className="text-sm font-semibold text-primary">{userAvatar}</span>
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium truncate",
                                    "text-gray-900 dark:text-white"
                                )}>{userName}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>

                    {/* Acciones: Contraer y Salir */}
                    <div className={cn("mt-4 space-y-2", sidebarOpen ? "" : "flex flex-col items-center gap-2")}>

                        {/* Botón Contraer Sidebar */}
                        <Button
                            variant="ghost"
                            size={sidebarOpen ? "sm" : "icon"}
                            className={cn("w-full text-gray-500 dark:text-gray-400", sidebarOpen ? "justify-start" : "justify-center")}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? (
                                <>
                                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                                    Contraer
                                </>
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </Button>

                        {/* Botón Salir */}
                        <Button
                            variant="ghost"
                            size={sidebarOpen ? "sm" : "icon"}
                            className={cn("w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20", sidebarOpen ? "justify-start" : "justify-center")}
                            onClick={logout}
                        >
                            <LogOut className={cn("w-4 h-4", sidebarOpen && "mr-2")} />
                            {sidebarOpen && "Salir"}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* ==================== CONTENIDO PRINCIPAL ==================== */}
            <div className={cn("transition-all duration-300 min-h-screen",
                sidebarOpen ? "lg:ml-64" : "lg:ml-20"
            )}>

                {/* Header Superior */}
                <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 border-b backdrop-blur px-6",
                    "bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                )}>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className={cn("w-5 h-5",
                            "text-gray-600 dark:text-gray-300"
                        )} />
                    </Button>

                    {/* Búsqueda */}
                    <div className="flex-1 max-w-md hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar..."
                                className={cn("pl-9",
                                    "bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                                )}
                            />
                        </div>
                    </div>

                    {/* Acciones Derecha */}
                    <div className="flex items-center gap-2 ml-auto">

                        {/* ✅ MODO OSCURO - Toggle */}
                        <DarkModeToggle />


                        {/* Menú de Usuario */}
                        <div className="relative">
                            <Button variant="ghost" className={cn("flex items-center gap-2 px-3",
                                "hover:bg-gray-100 dark:hover:bg-gray-700"
                            )} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                                    "bg-primary/10 dark:bg-primary/20"
                                )}>
                                    <span className="text-sm font-semibold text-primary">{userAvatar}</span>
                                </div>
                                {sidebarOpen && (
                                    <>
                                        <div className="hidden md:block text-left">
                                            <p className={cn("text-sm font-medium",
                                                "text-gray-900 dark:text-white"
                                            )}>{userName}</p>
                                            <p className="text-xs text-gray-500">{businessName}</p>
                                        </div>
                                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform",
                                            userMenuOpen && "rotate-180"
                                        )} />
                                    </>
                                )}
                            </Button>
                            {userMenuOpen && (
                                <div className={cn("absolute right-0 mt-2 w-48 border rounded-lg shadow-lg z-50",
                                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                )}>
                                    <button onClick={() => { navigate('/business/profile'); setUserMenuOpen(false); }}
                                        className={cn("w-full text-left px-4 py-2 text-sm flex items-center gap-2",
                                            "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                        )}>
                                        <User className="w-4 h-4" /> Perfil
                                    </button>
                                    <button onClick={() => { navigate('/business/settings'); setUserMenuOpen(false); }}
                                        className={cn("w-full text-left px-4 py-2 text-sm flex items-center gap-2",
                                            "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                                        )}>
                                        <Settings className="w-4 h-4" /> Configuración
                                    </button>
                                    <div className={cn("border-t my-1",
                                        "border-gray-200 dark:border-gray-700"
                                    )}></div>
                                    <button onClick={() => { logout(); setUserMenuOpen(false); }}
                                        className={cn("w-full text-left px-4 py-2 text-sm flex items-center gap-2",
                                            "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                                        )}>
                                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ÁREA DE CONTENIDO */}
                <main className={cn("p-4 lg:p-6",
                    "bg-gray-50 dark:bg-gray-900"
                )}>
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