// src/features/business/hooks/useBusinessPermissions.js

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { BUSINESS_MODULES, getVisibleModules, isModuleVisible } from '../config/modules.config'

/**
 * Hook personalizado para gestionar permisos del negocio
 */
export const useBusinessPermissions = () => {
    const { user, hasPermission, hasRole } = useAuth()

    const permissions = useMemo(() => user?.permissions || [], [user?.permissions])
    const roles = useMemo(() => user?.roles || [], [user?.roles])
    const businessMembership = useMemo(() => user?.business_memberships?.[0] || null, [user?.business_memberships])

    const visibleModules = useMemo(() => {
        return getVisibleModules(permissions)
    }, [permissions])

    const canAccessModule = (moduleId) => {
        return isModuleVisible(moduleId, permissions)
    }

    const getModuleById = (moduleId) => {
        return BUSINESS_MODULES.find(m => m.id === moduleId)
    }

    const primaryRole = useMemo(() => {
        if (!businessMembership?.roles?.length) return null
        return businessMembership.roles[0]
    }, [businessMembership?.roles])

    return {
        // Datos
        permissions,
        roles,
        businessMembership,
        primaryRole,
        visibleModules,

        // Helpers de verificación (delegan a useAuth)
        hasPermission,
        hasRole,
        canAccessModule,
        getModuleById,

        // Utilidades
        BUSINESS_MODULES,
        getVisibleModules,
        isModuleVisible
    }
}

export default useBusinessPermissions