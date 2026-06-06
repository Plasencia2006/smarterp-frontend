// src/contexts/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '@/services/django.api'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || 'smart_erp_refresh'
const USER_KEY = import.meta.env.VITE_USER_KEY || 'smart_erp_user'
const BUSINESS_KEY = import.meta.env.VITE_BUSINESS_KEY || 'smart_erp_business' //  ESTA FALTABA

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
    const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || 'smart_erp_refresh'
    const USER_KEY = import.meta.env.VITE_USER_KEY || 'smart_erp_user'

    // Cargar usuario desde localStorage
    useEffect(() => {
        const initAuth = () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY)
                const userData = localStorage.getItem(USER_KEY)

                if (token && userData) {
                    setUser(JSON.parse(userData))
                }
            } catch (err) {
                console.error('❌ Error loading auth:', err)
                clearAuth()
            } finally {
                setLoading(false)
            }
        }
        initAuth()
    }, [])

    const clearAuth = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
    }, [])

    const login = async (email, password) => {
        try {
            setError(null)
            setLoading(true)

            console.log('🔐 Intentando login...')

            const response = await authAPI.login({ email, password })
            const { access, refresh, user: userData } = response.data

            // Validar respuesta
            if (!access || !userData) {
                throw new Error('Respuesta incompleta del servidor')
            }

            // Guardar tokens y usuario
            localStorage.setItem(TOKEN_KEY, access)
            localStorage.setItem(REFRESH_KEY, refresh)
            localStorage.setItem(USER_KEY, JSON.stringify(userData))

            // Guardar negocio
            if (userData.business_memberships && userData.business_memberships.length > 0) {
                const membership = userData.business_memberships[0]
                const businessId = membership.business || membership.id

                const businessData = {
                    id: businessId,
                    name: membership.business_name || 'Mi Negocio',
                    role: membership.membership_role || 'USER',
                }

                localStorage.setItem(BUSINESS_KEY, JSON.stringify(businessData))
            }

            // Actualizar estado
            setUser(userData)

            // Configurar axios
            if (typeof djangoApi !== 'undefined' && djangoApi) {
                djangoApi.defaults.headers.common['Authorization'] = `Bearer ${access}`
            }

            console.log('✅ Login exitoso')
            return { success: true, user: userData }

        } catch (err) {
            console.error('❌ Login error:', err)

            // ✅ MANEJO DE ERRORES ESPECÍFICOS
            let message = 'Error al iniciar sesión'

            if (err.response) {
                // Error del servidor
                const status = err.response.status
                const data = err.response.data

                switch (status) {
                    case 400:
                        message = data.detail || data.error || 'Datos inválidos'
                        break
                    case 401:
                        // ✅ MENSAJE CLARO PARA CREDENCIALES INCORRECTAS
                        message = 'Email o contraseña incorrectos'
                        break
                    case 403:
                        message = 'Cuenta suspendida o inactiva'
                        break
                    case 500:
                        message = 'Error del servidor. Intente más tarde'
                        break
                    default:
                        message = data.detail || data.error || message
                }
            } else if (err.request) {
                // No hubo respuesta del servidor
                message = 'No hay conexión con el servidor'
            } else {
                // Error al configurar la petición
                message = err.message || message
            }

            setError(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }

    const logout = useCallback(() => {
        // ❌ NO llames a la API si no existe (evita 404)
        // authAPI.logout().catch(() => {})

        // ✅ Solo limpia localStorage y estado
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)

        // ✅ Redirige al login
        window.location.href = '/login'
    }, [])

    const refreshToken = useCallback(async () => {
        try {
            const refresh = localStorage.getItem(REFRESH_KEY)
            if (!refresh) throw new Error('No refresh token')

            const response = await authAPI.refreshToken(refresh)
            const { access } = response.data
            localStorage.setItem(TOKEN_KEY, access)
            return access
        } catch (err) {
            console.error('❌ Refresh error:', err)
            logout()
            throw err
        }
    }, [logout])

    // Helpers de permisos
    const hasPermission = useCallback((permissionCode) => {
        if (!user?.permissions) return false
        return user.permissions.some(p => p.code === permissionCode)
    }, [user?.permissions])

    const hasRole = useCallback((roleName) => {
        if (!user?.roles) return false
        return user.roles.some(r => r.name.toLowerCase() === roleName.toLowerCase())
    }, [user?.roles])

    const hasAnyPermission = useCallback((permissionCodes) => {
        if (!user?.permissions) return false
        const userCodes = new Set(user.permissions.map(p => p.code))
        return permissionCodes.some(code => userCodes.has(code))
    }, [user?.permissions])

    const hasAllPermissions = useCallback((permissionCodes) => {
        if (!user?.permissions) return false
        const userCodes = new Set(user.permissions.map(p => p.code))
        return permissionCodes.every(code => userCodes.has(code))
    }, [user?.permissions])

    const isSuperAdmin = useCallback(() => {
        if (!user) return false
        return (
            user.is_super_admin === true ||
            user.is_super_admin === 'true' ||
            user.is_superuser === true ||
            user.role === 'SUPER_ADMIN'
        )
    }, [user])

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshToken,
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        businessMemberships: user?.business_memberships || [],
        roles: user?.roles || [],
        permissions: user?.permissions || [],
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext