// src/services/django.api.js
import axios from 'axios'

// =============================================================================
// ⚙️ CONFIGURACIÓN BASE
// =============================================================================
const API_URL = import.meta.env.VITE_AUTH_API || 'http://localhost:8000/api/v1'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || 'smart_erp_refresh'
const BUSINESS_KEY = import.meta.env.VITE_BUSINESS_KEY || 'smart_erp_business'
const USER_KEY = import.meta.env.VITE_USER_KEY || 'smart_erp_user'

// Crear instancia base de axios
const djangoApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
})

// =============================================================================
// 🔐 INTERCEPTOR DE REQUEST (ÚNICO)
// =============================================================================
djangoApi.interceptors.request.use(
    (config) => {
        // Agregar token
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Agregar X-Business-ID
        let businessId = null

        try {
            const business = JSON.parse(localStorage.getItem(BUSINESS_KEY) || 'null')
            if (business?.id) {
                businessId = business.id
            }
        } catch (e) { }

        if (!businessId) {
            try {
                const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
                const membership = user?.business_memberships?.[0]
                if (membership) {
                    businessId = membership.business || membership.id
                }
            } catch (e) { }
        }

        if (businessId && !config.skipBusinessHeader) {
            config.headers['X-Business-ID'] = businessId
            console.log('🔗 [Interceptor] X-Business-ID agregado:', businessId)
        }

        return config
    },
    (error) => Promise.reject(error)
)

// =============================================================================
// 🔐 INTERCEPTOR DE RESPONSE (ÚNICO - VERSIÓN ROBUSTA)
// =============================================================================
djangoApi.interceptors.response.use(
    // Respuesta exitosa
    (response) => response,

    // ❌ Manejo de errores - VERSIÓN ROBUSTA CON TRY-CATCH
    async (error) => {
        // ✅ PROTEGER TODO EL INTERCEPTOR
        try {
            // Verificar que error.config exista antes de acceder a sus propiedades
            const originalRequest = error?.config

            // Si no hay config, no podemos hacer nada más
            if (!originalRequest) {
                console.warn('⚠️ [Interceptor] Error sin config:', error?.message)
                return Promise.reject(error)
            }

            // ✅ VERIFICACIÓN SEGURA: acceder a url solo si existe
            const requestUrl = originalRequest?.url || ''

            // ✅ NO intentar refresh si es el endpoint de login o refresh
            if (requestUrl.includes('/auth/login/') ||
                requestUrl.includes('/auth/token/refresh/')) {
                return Promise.reject(error)
            }

            // Si es 401 y no es un re-intento, intentar refresh
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true

                try {
                    const refresh = localStorage.getItem(REFRESH_KEY)

                    // ✅ VALIDAR QUE EXISTA REFRESH TOKEN
                    if (!refresh) {
                        console.warn('⚠️ No hay refresh token, redirigiendo a login')
                        clearSession()
                        redirectToLogin()
                        return Promise.reject(new Error('No refresh token'))
                    }

                    // Intentar obtener nuevo access token
                    const response = await axios.post(
                        `${API_URL}/auth/token/refresh/`,
                        { refresh: refresh },
                        { headers: { 'Content-Type': 'application/json' } }
                    )

                    const { access } = response.data
                    localStorage.setItem(TOKEN_KEY, access)

                    // Reintentar la petición original con el nuevo token
                    originalRequest.headers.Authorization = `Bearer ${access}`
                    return djangoApi(originalRequest)

                } catch (refreshError) {
                    console.error('❌ Error al refresh token:', refreshError)
                    clearSession()
                    redirectToLogin()
                    return Promise.reject(refreshError)
                }
            }

            // ✅ Manejo especial para otros errores
            if (error.response?.status === 403) {
                console.warn(`⚠️ [Interceptor] Acceso denegado en ${requestUrl}`)
            }

            if (error.response?.status >= 500) {
                console.error('❌ [Interceptor] Error del servidor:', error.response?.data)
            }

        } catch (interceptorError) {
            // ✅ NUNCA dejar que el interceptor falle
            console.error('❌ [Interceptor] Error interno en el interceptor:', interceptorError)
        }

        // ✅ SIEMPRE retornar el error original
        return Promise.reject(error)
    }
)

// =============================================================================
// 🛠️ FUNCIONES HELPER
// =============================================================================

/**
 * Limpiar toda la sesión del localStorage
 */
const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(BUSINESS_KEY)
    localStorage.removeItem(USER_KEY)
}

/**
 * Redirigir al login si no estamos ya ahí
 */
const redirectToLogin = () => {
    if (window.location.pathname !== '/login') {
        window.location.href = '/login'
    }
}

// =============================================================================
// 🔐 AUTH API
// =============================================================================
export const authAPI = {
    login: (credentials) => djangoApi.post('/auth/login/', credentials),
    register: (data) => djangoApi.post('/auth/register/', data),
    refreshToken: (refresh) => djangoApi.post('/auth/token/refresh/', { refresh }),
    getProfile: () => djangoApi.get('/auth/me/'),
    logout: () => djangoApi.post('/auth/logout/'),

    listUsers: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/auth/users/${qs ? '?' + qs : ''}`)
    },
    getUser: (id) => djangoApi.get(`/auth/users/${id}/`),
    updateUser: (id, data) => djangoApi.patch(`/auth/users/${id}/`, data),
    deleteUser: (id) => djangoApi.delete(`/auth/users/${id}/`),
}

// =============================================================================
// 🏢 BUSINESS API
// =============================================================================
export const businessAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/businesses/${qs ? '?' + qs : ''}`)
    },
    get: (id) => djangoApi.get(`/business/businesses/${id}/`),
    create: (data) => djangoApi.post('/business/businesses/', data),
    update: (id, data) => djangoApi.patch(`/business/businesses/${id}/`, data),
    delete: (id) => djangoApi.delete(`/business/businesses/${id}/`),

    listMemberships: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/memberships/${qs ? '?' + qs : ''}`)
    },
    assignAdmin: (data) => djangoApi.post('/business/memberships/assign/', data),
    getBusinessAdmins: (businessId) =>
        djangoApi.get(`/business/memberships/business/${businessId}/admins/`),
    revokeAccess: (membershipId) =>
        djangoApi.post(`/business/memberships/${membershipId}/revoke/`),

    getUsers: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/users/${qs ? '?' + qs : ''}`)
    },
    getUser: (id) => djangoApi.get(`/business/users/${id}/`),
    createUser: (data) => djangoApi.post('/business/users/', data),
    updateUser: (id, data) => djangoApi.patch(`/business/users/${id}/`, data),
    deleteUser: (id) => djangoApi.delete(`/business/users/${id}/`),

    assignRole: (businessUserId, roleId, notes = '') =>
        djangoApi.post(`/business/users/${businessUserId}/assign_role/`, {
            role_id: roleId,
            notes
        }),
    revokeRole: (businessUserId, roleId) =>
        djangoApi.post(`/business/users/${businessUserId}/revoke_role/`, {
            role_id: roleId
        }),

    listRoleAssignments: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/role-assignments/${qs ? '?' + qs : ''}`)
    },
    getUsersWithActiveRoles: () => djangoApi.get('/business/users/with-active-roles/'),

    getRoles: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/roles/${qs ? '?' + qs : ''}`)
    },
    getRole: (id) => djangoApi.get(`/business/roles/${id}/`),
    createRole: (data) => djangoApi.post('/business/roles/', data),
    updateRole: (id, data) => djangoApi.patch(`/business/roles/${id}/`, data),
    deleteRole: (id) => djangoApi.delete(`/business/roles/${id}/`),
    getRoleUsers: (roleId) => djangoApi.get(`/business/roles/${roleId}/users/`),

    getPermissions: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/permissions/${qs ? '?' + qs : ''}`)
    },
    getPermission: (id) => djangoApi.get(`/business/permissions/${id}/`),
}

// =============================================================================
// 👥 MEMBERSHIP API
// =============================================================================
export const membershipAPI = {
    assignAdmin: (data) => djangoApi.post('/business/memberships/assign/', data),
    getBusinessAdmins: (businessId) =>
        djangoApi.get(`/business/memberships/business/${businessId}/admins/`),
    revokeAccess: (membershipId) =>
        djangoApi.post(`/business/memberships/${membershipId}/revoke/`),
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/memberships/${qs ? '?' + qs : ''}`)
    },
}

// =============================================================================
// 👤 USERS API
// =============================================================================
export const usersAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/auth/users/${qs ? '?' + qs : ''}`)
    },
    create: (data) => djangoApi.post('/auth/users/', data),
    update: (id, data) => djangoApi.patch(`/auth/users/${id}/`, data),
    delete: (id) => djangoApi.delete(`/auth/users/${id}/`),
    getHistory: (id) => djangoApi.get(`/auth/users/${id}/history/`)
}

// =============================================================================
// ⚙️ SETTINGS API
// =============================================================================
export const settingsAPI = {
    getGlobal: () => djangoApi.get('/settings/'),
    updateGlobal: (data) => djangoApi.put('/settings/', data),
    getSystemInfo: () => djangoApi.get('/system-info/'),
}

// =============================================================================
// 💾 BACKUPS API
// =============================================================================
export const backupsAPI = {
    list: () => djangoApi.get('/backups/'),
    create: () => djangoApi.post('/backups/'),
    restore: (id) => djangoApi.post(`/backups/${id}/restore/`),
    delete: (id) => djangoApi.delete(`/backups/${id}/`),
    download: (id) => djangoApi.get(`/backups/${id}/download/`, {
        responseType: 'blob'
    }),
}

// =============================================================================
// 📊 ANALYTICS API
// =============================================================================
export const analyticsAPI = {
    getGlobalStats: () => djangoApi.get('/analytics/global-stats/'),
    getActivity: () => djangoApi.get('/analytics/activity/'),
}

// =============================================================================
// 🔍 AUDIT API
// =============================================================================
export const auditAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/audit-logs/${qs ? '?' + qs : ''}`)
    },
    summary: () => djangoApi.get('/audit-logs/summary/'),
    getUserSessions: () => djangoApi.get('/audit-logs/user-sessions/'),
    getActivityTimeline: () => djangoApi.get('/audit-logs/activity-timeline/'),
}

// =============================================================================
// 🎯 EXPORT DEFAULT
// =============================================================================
export default djangoApi