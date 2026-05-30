// src/features/business/config/modules.config.js

import {
    LayoutDashboard, ShoppingCart, Package, BarChart3,
    Wrench, Users, Settings, FileText, TrendingUp,
    AlertTriangle, Clock, CheckCircle, CreditCard
} from 'lucide-react'

export const BUSINESS_MODULES = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/business/dashboard',
        icon: LayoutDashboard,
        requiredPermission: null,
        order: 1,
        description: 'Vista general del negocio',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
    },
    {
        id: 'sales',
        title: 'Ventas',
        path: '/business/sales',
        icon: ShoppingCart,
        requiredPermission: 'sales.view',
        order: 2,
        description: 'Gestión de ventas y transacciones',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        subModules: [
            { id: 'new-sale', title: 'Nueva Venta', path: '/business/sales/new', icon: ShoppingCart },
            { id: 'history', title: 'Historial', path: '/business/sales/history', icon: FileText },
            { id: 'refunds', title: 'Devoluciones', path: '/business/sales/refunds', icon: AlertTriangle },
        ]
    },
    {
        id: 'inventory',
        title: 'Inventario',
        path: '/business/inventory',
        icon: Package,
        requiredPermission: 'inventory.read',
        order: 3,
        description: 'Control de stock y productos',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        subModules: [
            { id: 'products', title: 'Productos', path: '/business/inventory/products', icon: Package },
            { id: 'adjustments', title: 'Ajustes', path: '/business/inventory/adjustments', icon: TrendingUp },
            { id: 'alerts', title: 'Alertas', path: '/business/inventory/alerts', icon: AlertTriangle },
        ]
    },
    {
        id: 'cashier',
        title: 'Caja',
        path: '/business/cashier',
        icon: CreditCard,
        requiredPermission: 'cashier.manage',
        order: 4,
        description: 'Punto de venta y cierre de caja',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        subModules: [
            { id: 'pos', title: 'Punto de Venta', path: '/business/cashier/pos', icon: CreditCard },
            { id: 'close', title: 'Cierre de Caja', path: '/business/cashier/close', icon: Clock },
        ]
    },
    {
        id: 'users',
        title: 'Usuarios',
        path: '/business/users',
        icon: Users,
        requiredPermission: 'users.view',
        order: 5,
        description: 'Gestión de equipo y roles',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        subModules: [
            { id: 'team', title: 'Equipo', path: '/business/users/team', icon: Users },
            { id: 'roles', title: 'Roles', path: '/business/users/roles', icon: Settings },
        ]
    },
    {
        id: 'services',
        title: 'Servicios',
        path: '/business/services',
        icon: Wrench,
        requiredPermission: 'services.view',
        order: 6,
        description: 'Órdenes de servicio y soporte',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        subModules: [
            { id: 'orders', title: 'Órdenes', path: '/business/services/orders', icon: Clock },
            { id: 'new', title: 'Nueva Orden', path: '/business/services/new', icon: Wrench },
        ]
    },
    {
        id: 'reports',
        title: 'Reportes',
        path: '/business/reports',
        icon: BarChart3,
        requiredPermission: 'reports.view',
        order: 7,
        description: 'Análisis y reportes financieros',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100',
        subModules: [
            { id: 'financial', title: 'Financieros', path: '/business/reports/financial', icon: FileText },
            { id: 'sales', title: 'Ventas', path: '/business/reports/sales', icon: ShoppingCart },
        ]
    },
    {
        id: 'settings',
        title: 'Configuración',
        path: '/business/settings',
        icon: Settings,
        requiredPermission: 'business.update',
        order: 8,
        description: 'Ajustes del negocio',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        subModules: [
            { id: 'general', title: 'General', path: '/business/settings/general', icon: Settings },
            { id: 'billing', title: 'Facturación', path: '/business/settings/billing', icon: FileText },
        ]
    }
]

export const getVisibleModules = (userPermissions = []) => {
    const permissionCodes = new Set(userPermissions.map(p => p.code))

    return BUSINESS_MODULES
        .filter(module => {
            if (!module.requiredPermission) return true
            return permissionCodes.has(module.requiredPermission)
        })
        .sort((a, b) => a.order - b.order)
        .map(module => ({
            ...module,
            subModules: module.subModules?.filter(sub => {
                if (!sub.requiredPermission) return true
                return permissionCodes.has(sub.requiredPermission)
            })
        }))
}

export const isModuleVisible = (moduleId, userPermissions = []) => {
    const module = BUSINESS_MODULES.find(m => m.id === moduleId)
    if (!module) return false
    if (!module.requiredPermission) return true

    const permissionCodes = new Set(userPermissions.map(p => p.code))
    return permissionCodes.has(module.requiredPermission)
}

export default BUSINESS_MODULES