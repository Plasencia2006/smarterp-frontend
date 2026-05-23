import axios from 'axios'

const API_URL = import.meta.env.VITE_AUTH_API || 'http://localhost:8000/api/v1'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || 'smart_erp_refresh'
const BUSINESS_KEY = import.meta.env.VITE_BUSINESS_KEY || 'smart_erp_business'

// Crear instancia base
const djangoApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Interceptor de request
djangoApi.interceptors.request.use(
    (config) => {
        // Obtener token directamente del localStorage (más confiable)
        const token = localStorage.getItem(TOKEN_KEY)
        const business = localStorage.getItem(BUSINESS_KEY)
        const businessId = business ? JSON.parse(business).id : null

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        if (businessId && !config.skipBusinessHeader) {
            config.headers['X-BUSINESS-ID'] = businessId
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Interceptor de response
djangoApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refresh = localStorage.getItem(REFRESH_KEY)
                if (!refresh) {
                    throw new Error('No refresh token')
                }

                // Intentar refresh del token
                const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
                    refresh: refresh
                })

                const { access } = response.data
                localStorage.setItem(TOKEN_KEY, access)

                originalRequest.headers.Authorization = `Bearer ${access}`
                return djangoApi(originalRequest)
            } catch (refreshError) {
                // Refresh falló - limpiar sesión
                localStorage.removeItem(TOKEN_KEY)
                localStorage.removeItem(REFRESH_KEY)
                localStorage.removeItem(BUSINESS_KEY)
                localStorage.removeItem('smart_erp_user')

                // Redirigir a login
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

// Servicios de autenticación
export const authAPI = {
    login: (credentials) => djangoApi.post('/auth/login/', credentials),
    register: (data) => djangoApi.post('/auth/register/', data),
    refreshToken: (refresh) => djangoApi.post('/auth/token/refresh/', { refresh }),
    getProfile: () => djangoApi.get('/auth/me/'),
    logout: () => djangoApi.post('/auth/logout/'),
}

// Servicios de negocios
// Agregar al archivo django.api.js

export const businessAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/?${qs}`)
    },

    // ✅ AGREGAR ESTE MÉTODO
    get: (id) => djangoApi.get(`/business/${id}/`),

    create: (data) => djangoApi.post('/business/', data),
    update: (id, data) => djangoApi.patch(`/business/${id}/`, data),
    delete: (id) => djangoApi.delete(`/business/${id}/`),
}

export const membershipAPI = {
    // Asignar admin a negocio
    assignAdmin: (data) => djangoApi.post('/business/memberships/assign/', data),

    // Obtener admins de un negocio
    getBusinessAdmins: (businessId) =>
        djangoApi.get(`/business/memberships/business/${businessId}/admins/`),

    // Revocar acceso
    revokeAccess: (membershipId) =>
        djangoApi.post(`/business/memberships/${membershipId}/revoke/`),

    // Listar todas las membresías
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/business/memberships/${qs ? '?' + qs : ''}`)
    },
}

// Servicios de usuarios
export const usersAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return djangoApi.get(`/users/${qs ? '?' + qs : ''}`)
    },

    // ✅ CREATE: POST a /users/
    create: (data) => djangoApi.post('/users/', data),

    // UPDATE: PATCH a /users/{id}/
    update: (id, data) => djangoApi.patch(`/users/${id}/`, data),

    // DELETE: DELETE a /users/{id}/
    delete: (id) => djangoApi.delete(`/users/${id}/`),

    // HISTORY: GET a /users/{id}/history/
    getHistory: (id) => djangoApi.get(`/users/${id}/history/`)
}

// Agregar al final de src/services/django.api.js

export const settingsAPI = {
    getGlobal: () => djangoApi.get('/settings/'),
    updateGlobal: (data) => djangoApi.put('/settings/', data),
    getSystemInfo: () => djangoApi.get('/system-info/'),
}

export const backupsAPI = {
    list: () => djangoApi.get('/backups/'),
    create: () => djangoApi.post('/backups/'),
    restore: (id) => djangoApi.post(`/backups/${id}/restore/`),
    delete: (id) => djangoApi.delete(`/backups/${id}/`),
    download: (id) => djangoApi.get(`/backups/${id}/download/`, {
        responseType: 'blob'
    }),
}

export const analyticsAPI = {
    getGlobalStats: () => djangoApi.get('/analytics/global-stats/'),
    getActivity: () => djangoApi.get('/analytics/activity/'),
}

export const auditAPI = {
    list: () => djangoApi.get('/audit-logs/'),
    summary: () => djangoApi.get('/audit-logs/summary/'),
}


export default djangoApi