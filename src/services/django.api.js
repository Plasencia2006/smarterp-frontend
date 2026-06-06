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
// 🔐 INTERCEPTORES
// =============================================================================

// Interceptor de Request - Agrega token y business_id automáticamente
djangoApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY)
        const business = localStorage.getItem(BUSINESS_KEY)
        const businessId = business ? JSON.parse(business).id : null

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        if (businessId && !config.skipBusinessHeader) {
            config.headers['X-Business-ID'] = businessId
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Interceptor de Response - Maneja refresh token y errores 401
djangoApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Si es 401 y no es un re-intento, intentar refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refresh = localStorage.getItem(REFRESH_KEY)
                if (!refresh) throw new Error('No refresh token')

                // Intentar obtener nuevo access token
                const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                    refresh: refresh
                }, {
                    headers: { 'Content-Type': 'application/json' }
                })

                const { access } = response.data
                localStorage.setItem(TOKEN_KEY, access)

                // Reintentar la petición original con el nuevo token
                originalRequest.headers.Authorization = `Bearer ${access}`
                return djangoApi(originalRequest)

            } catch (refreshError) {
                // Refresh falló - limpiar sesión completa
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem(REFRESH_KEY)
                localStorage.removeItem(BUSINESS_KEY)
                localStorage.removeItem(USER_KEY)

                // Redirigir a login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

// =============================================================================
// 🔐 AUTH API
// =============================================================================
export const authAPI = {
    /**
     * Iniciar sesión - Devuelve tokens + user data con roles/permisos
     */
    login: (credentials) => djangoApi.post('/auth/login/', credentials),

    /**
     * Registrar nuevo usuario (Super Admin)
     */
    register: (data) => djangoApi.post('/auth/register/', data),

    /**
     * Refresh de token
     */
    refreshToken: (refresh) => djangoApi.post('/auth/token/refresh/', { refresh }),

    /**
     * Obtener perfil del usuario actual con roles y permisos
     */
    getProfile: () => djangoApi.get('/auth/me/'),

    /**
     * Cerrar sesión (invalidar tokens si el backend lo soporta)
     */
    logout: () => djangoApi.post('/auth/logout/'),

    // Gestión de usuarios (Super Admin)
    listUsers: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/auth/users/?${qs}`)
    },
    getUser: (id) => djangoApi.get(`/auth/users/${id}/`),
    updateUser: (id, data) => djangoApi.patch(`/auth/users/${id}/`, data),
    deleteUser: (id) => djangoApi.delete(`/auth/users/${id}/`),
}

// =============================================================================
// 🏢 BUSINESS API (Negocios - Super Admin)
// =============================================================================
export const businessAPI = {
    // ── Negocios ──────────────────────────────────────────────────────────

    /**
     * Listar negocios (con paginación y filtros)
     */
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/businesses/?${qs}`)
    },

    /**
     * Obtener detalle de un negocio
     */
    get: (id) => djangoApi.get(`/business/businesses/${id}/`),

    /**
     * Crear nuevo negocio
     */
    create: (data) => djangoApi.post('/business/businesses/', data),

    /**
     * Actualizar negocio (PATCH)
     */
    update: (id, data) => djangoApi.patch(`/business/businesses/${id}/`, data),

    /**
     * Eliminar negocio
     */
    delete: (id) => djangoApi.delete(`/business/businesses/${id}/`),

    // ── Membresías ────────────────────────────────────────────────────────

    listMemberships: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/memberships/?${qs}`)
    },

    assignAdmin: (data) => djangoApi.post('/business/memberships/assign/', data),

    getBusinessAdmins: (businessId) =>
        djangoApi.get(`/business/memberships/business/${businessId}/admins/`),

    revokeAccess: (membershipId) =>
        djangoApi.post(`/business/memberships/${membershipId}/revoke/`),

    // ── Usuarios del Negocio (BusinessUser) - Gestión por Admin de Negocio ─

    /**
     * Listar usuarios del negocio actual (con roles asignados)
     */
    getUsers: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/users/?${qs}`)
    },

    /**
     * Obtener detalle de un usuario del negocio
     */
    getUser: (id) => djangoApi.get(`/business/users/${id}/`),

    /**
     * Crear usuario del negocio
     * @param {Object} data - { email, password, first_name, last_name, employee_code?, department?, position?, hire_date?, initial_role_id? }
     */
    createUser: (data) => djangoApi.post('/business/users/', data),

    /**
     * Actualizar usuario del negocio
     */
    updateUser: (id, data) => djangoApi.patch(`/business/users/${id}/`, data),

    /**
     * Eliminar usuario del negocio (desactiva BusinessUser, no borra CustomUser)
     */
    deleteUser: (id) => djangoApi.delete(`/business/users/${id}/`),

    // ── Asignación de Roles ───────────────────────────────────────────────

    /**
     * Asignar rol a un usuario del negocio (con auditoría)
     * @param {string} businessUserId - ID del BusinessUser
     * @param {string} roleId - ID del BusinessRole
     * @param {string} notes - Notas opcionales de auditoría
     */
    assignRole: (businessUserId, roleId, notes = '') =>
        djangoApi.post(`/business/users/${businessUserId}/assign_role/`, {
            role_id: roleId,
            notes
        }),

    /**
     * Revocar rol de un usuario del negocio
     * @param {string} businessUserId - ID del BusinessUser  
     * @param {string} roleId - ID del BusinessRole a revocar
     */
    revokeRole: (businessUserId, roleId) =>
        djangoApi.post(`/business/users/${businessUserId}/revoke_role/`, {
            role_id: roleId
        }),

    // ── Histórico de Asignaciones ─────────────────────────────────────────

    /**
     * Listar histórico completo de asignaciones de roles
     */
    listRoleAssignments: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/role-assignments/?${qs}`)
    },

    // ── Endpoints Especiales ──────────────────────────────────────────────

    /**
     * Obtener solo usuarios con roles activos asignados
     */
    getUsersWithActiveRoles: () => djangoApi.get('/business/users/with-active-roles/'),

    // ── Roles del Negocio ─────────────────────────────────────────────────

    /**
     * Listar roles disponibles para el negocio actual
     */
    getRoles: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/roles/?${qs}`)
    },

    getRole: (id) => djangoApi.get(`/business/roles/${id}/`),
    createRole: (data) => djangoApi.post('/business/roles/', data),
    updateRole: (id, data) => djangoApi.patch(`/business/roles/${id}/`, data),
    deleteRole: (id) => djangoApi.delete(`/business/roles/${id}/`),

    /**
     * Obtener usuarios que tienen un rol específico
     */
    getRoleUsers: (roleId) => djangoApi.get(`/business/roles/${roleId}/users/`),

    // ── Permisos del Sistema (Solo Lectura) ───────────────────────────────

    /**
     * Listar todos los permisos disponibles en el sistema
     */
    getPermissions: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/permissions/?${qs}`)
    },

    getPermission: (id) => djangoApi.get(`/business/permissions/${id}/`),
}

// =============================================================================
// 👥 MEMBERSHIP API (Gestión de accesos)
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
// 👤 USERS API (Usuarios globales - Super Admin)
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
        return djangoApi.get(`/audit-logs/?${qs}`)
    },
    summary: () => djangoApi.get('/audit-logs/summary/'),
    getUserSessions: () => djangoApi.get('/audit-logs/user-sessions/'),
    getActivityTimeline: () => djangoApi.get('/audit-logs/activity-timeline/'),
}

// Interceptor de Response - Maneja refresh token y errores 401
djangoApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // ✅ NO intentar refresh si es el endpoint de login
        if (originalRequest.url.includes('/auth/login/') ||
            originalRequest.url.includes('/auth/token/refresh/')) {
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
                    // Limpiar sesión
                    localStorage.removeItem(TOKEN_KEY)
                    localStorage.removeItem(REFRESH_KEY)
                    localStorage.removeItem(BUSINESS_KEY)
                    localStorage.removeItem(USER_KEY)

                    // Redirigir a login
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                    return Promise.reject(new Error('No refresh token'))
                }

                // Intentar obtener nuevo access token
                const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                    refresh: refresh
                }, {
                    headers: { 'Content-Type': 'application/json' }
                })

                const { access } = response.data
                localStorage.setItem(TOKEN_KEY, access)

                // Reintentar la petición original con el nuevo token
                originalRequest.headers.Authorization = `Bearer ${access}`
                return djangoApi(originalRequest)

            } catch (refreshError) {
                console.error('❌ Error al refresh token:', refreshError)

                // Refresh falló - limpiar sesión completa
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem(REFRESH_KEY)
                localStorage.removeItem(BUSINESS_KEY)
                localStorage.removeItem(USER_KEY)

                // Redirigir a login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

djangoApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY)

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // ✅ Obtener business_id
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

        // ✅ Agregar header SOLO si tenemos business_id
        if (businessId && !config.skipBusinessHeader) {
            config.headers['X-Business-ID'] = businessId
            console.log('🔗 [Interceptor] X-Business-ID agregado:', businessId)
        }

        return config
    },
    (error) => Promise.reject(error)
)
// =============================================================================
// 🎯 EXPORT DEFAULT
// =============================================================================
export default djangoApi