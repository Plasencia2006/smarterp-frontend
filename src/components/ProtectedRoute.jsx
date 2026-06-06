// src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
    const { user, isAuthenticated, hasPermission } = useAuth()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // ✅ SI ES SUPER ADMIN → Acceso total
    if (user.is_super_admin) {
        return children
    }

    // ✅ SI ES ADMINISTRADOR DEL NEGOCIO → Acceso total a todos los módulos
    const isAdminBusiness = user.business_memberships?.some(m =>
        m.membership_role?.toUpperCase() === 'ADMIN' ||
        m.role?.toUpperCase() === 'ADMIN'
    )

    if (isAdminBusiness) {
        return children
    }

    // ✅ SI ES ADMIN DE ROLES → Acceso total
    const isAdminRole = user.roles?.some(r =>
        r.name?.toLowerCase() === 'administrador' ||
        r.name?.toLowerCase() === 'admin'
    )

    if (isAdminRole) {
        return children
    }

    // Verificar permiso específico (solo para usuarios NO admin)
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
                    <p className="text-muted-foreground mb-4">No tienes los permisos necesarios</p>
                    {requiredPermission && (
                        <p className="text-sm text-gray-500 mb-6">
                            Permisos requeridos: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
                        </p>
                    )}
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
                    >
                        Volver
                    </button>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </div>
        )
    }

    return children
}

export default ProtectedRoute