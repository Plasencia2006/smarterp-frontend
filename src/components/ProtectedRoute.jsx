// src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Lock, LogIn, Shield } from 'lucide-react'

/**
 * Componente para proteger rutas por autenticación, rol o permiso
 */
const ProtectedRoute = ({
    children,
    requireAuth = true,
    requiredRole,
    requiredPermission,
    requireAll = false,
    redirectTo = '/login',
    fallback
}) => {
    const { user, loading, hasPermission, hasRole, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useAuth()
    const location = useLocation()

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Verificar autenticación
    if (requireAuth && !user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    // Verificar rol (si se especifica)
    if (requiredRole) {
        if (requiredRole === 'super_admin' && !isSuperAdmin()) {
            return fallback || <AccessDenied message="Requiere rol de Super Admin" />
        }
        if (requiredRole !== 'super_admin' && !hasRole(requiredRole)) {
            return fallback || <AccessDenied message={`Requiere rol: ${requiredRole}`} />
        }
    }

    // Verificar permisos (si se especifica)
    if (requiredPermission) {
        const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
        const hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions)

        if (!hasAccess) {
            return fallback || <AccessDenied
                message="No tienes los permisos necesarios"
                requiredPermissions={permissions}
            />
        }
    }

    // Todo OK, renderizar children
    return children
}

// ✅ Componente UI para acceso denegado (sin depender de shadcn alert)
const AccessDenied = ({ message, requiredPermissions }) => (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
        <div className="p-4 bg-red-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-red-600" />
        </div>

        <div className="max-w-md text-center space-y-4">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
                <p className="text-gray-600">{message}</p>
            </div>

            {requiredPermissions?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Permisos requeridos:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {requiredPermissions.map((perm, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                                {perm}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                    Volver
                </Button>
                <Button size="sm" onClick={() => window.location.href = '/login'}>
                    <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión
                </Button>
            </div>
        </div>
    </div>
)

export default ProtectedRoute