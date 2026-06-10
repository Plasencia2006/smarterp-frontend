// src/contexts/AuthContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '@/services/django.api'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || 'smart_erp_refresh'
const USER_KEY = import.meta.env.VITE_USER_KEY || 'smart_erp_user'
const BUSINESS_KEY = import.meta.env.VITE_BUSINESS_KEY || 'smart_erp_business'

const AuthContext = createContext(null)

// ✅ FUNCIÓN HELPER: Extraer mensaje de error SIEMPRE como string
const extractErrorMessage = (error) => {
    // Caso 1: No hay response (error de red)
    if (!error.response) {
        if (error.request) return 'No hay conexión con el servidor'
        return error.message || 'Error de conexión'
    }

    const data = error.response.data
    const status = error.response.status

    // Caso 2: data.detail es un string directo
    if (typeof data?.detail === 'string') {
        return data.detail
    }

    // Caso 3: data.detail es un array
    if (Array.isArray(data?.detail)) {
        return data.detail.join(', ')
    }

    // Caso 4: data.detail es un objeto (ej: { password: ["..."] })
    if (data?.detail && typeof data.detail === 'object') {
        const firstKey = Object.keys(data.detail)[0]
        if (firstKey) {
            const value = data.detail[firstKey]
            return Array.isArray(value) ? value.join(', ') : String(value)
        }
    }

    // Caso 5: non_field_errors (típico de Django)
    if (data?.non_field_errors) {
        return Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join(', ')
            : String(data.non_field_errors)
    }

    // Caso 6: error directo
    if (typeof data?.error === 'string') {
        return data.error
    }

    // Caso 7: data es un objeto con campos (ej: { email: ["..."] })
    if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        if (firstKey) {
            const value = data[firstKey]
            const msg = Array.isArray(value) ? value[0] : value
            if (typeof msg === 'string') return `${firstKey}: ${msg}`
        }
    }

    // Caso 8: Mensajes por status
    switch (status) {
        case 400: return 'Datos inválidos'
        case 401: return 'Email o contraseña incorrectos'
        case 403: return 'Acceso denegado'
        case 404: return 'Recurso no encontrado'
        case 500: return 'Error del servidor. Intente más tarde'
        default: return 'Error al iniciar sesión'
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
        localStorage.removeItem(BUSINESS_KEY)
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

            console.log('✅ Login exitoso:', userData.email)
            return { success: true, user: userData }

        } catch (err) {
            console.error('❌ Login error:', err)
            console.error('❌ Response data:', err.response?.data)

            // ✅ EXTRAER MENSAJE COMO STRING (SIEMPRE)
            const message = extractErrorMessage(err)

            console.log('📝 Mensaje de error extraído:', message)
            console.log('📝 Tipo de mensaje:', typeof message)

            setError(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(BUSINESS_KEY)
        setUser(null)
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