// src/store/authStore.js

import { create } from 'zustand'
import { authAPI } from '@services/django.api'

// =============================================================================
// ✅ CLAVES DE LOCALSTORAGE
// =============================================================================
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
const REFRESH_KEY = import.meta.env.VITE_REFRESH_KEY || 'smart_erp_refresh'
const BUSINESS_KEY = import.meta.env.VITE_BUSINESS_KEY || 'smart_erp_business'
const USER_KEY = 'smart_erp_user'
const BUSINESSES_KEY = 'smart_erp_businesses'

// =============================================================================
// ✅ FUNCIONES DE PERSISTENCIA
// =============================================================================
const loadFromStorage = (key) => {
    try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
    } catch (error) {
        console.error(`❌ Error loading ${key}:`, error)
        return null
    }
}

const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        console.error(`❌ Error saving ${key}:`, error)
    }
}

const clearStorage = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(BUSINESS_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(BUSINESSES_KEY)
}

// =============================================================================
// ✅ STORE PRINCIPAL
// =============================================================================
const useAuthStore = create((set, get) => {
    // Cargar estado inicial desde localStorage
    const storedUser = loadFromStorage(USER_KEY)
    const storedBusinesses = loadFromStorage(BUSINESSES_KEY)
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedBusiness = loadFromStorage(BUSINESS_KEY)

    return {
        // Estado
        user: storedUser || null,
        isAuthenticated: !!storedToken && !!storedUser,
        isLoading: false,
        error: null,

        // Negocios y selección
        businesses: storedBusinesses || [],
        userBusinesses: storedBusinesses || [],
        selectedBusiness: storedBusiness || null,

        // Actions
        login: async (credentials) => {
            console.log('🔐 [AuthStore] Iniciando login...')
            set({ isLoading: true, error: null })

            try {
                const response = await authAPI.login(credentials)
                const { access, refresh, user } = response.data

                if (!user) {
                    throw new Error('El backend no devolvió datos del usuario')
                }

                console.log('🔑 [AuthStore] Response user:', user)

                // Extraer membresías
                const businessesFromBackend = user?.business_memberships || user?.memberships || []

                console.log('💼 [AuthStore] Membresías encontradas:', businessesFromBackend)
                console.log('💼 [AuthStore] Cantidad:', businessesFromBackend.length)

                // Guardar tokens y datos
                localStorage.setItem(TOKEN_KEY, access)
                localStorage.setItem(REFRESH_KEY, refresh)
                localStorage.setItem(USER_KEY, JSON.stringify(user))
                saveToStorage(BUSINESSES_KEY, businessesFromBackend)

                // Actualizar estado
                set({
                    user,
                    isAuthenticated: true,
                    businesses: businessesFromBackend,
                    userBusinesses: businessesFromBackend,
                    isLoading: false,
                    error: null,
                })

                // ❌ ELIMINADO: Auto-selección del negocio
                // Ahora el usuario SIEMPRE debe seleccionar manualmente en /select-business

                console.log('✅ [AuthStore] Login exitoso. Redirigiendo a select-business')
                return response.data
            } catch (error) {
                console.error('❌ [AuthStore] Error en login:', error)

                const errorMessage = error.response?.data?.message ||
                    error.response?.data?.detail ||
                    error.message ||
                    'Error al iniciar sesión'

                set({ error: errorMessage, isLoading: false })
                throw error
            }
        },

        register: async (data) => {
            set({ isLoading: true, error: null })
            try {
                const response = await authAPI.register(data)
                set({ isLoading: false })
                return response.data
            } catch (error) {
                set({
                    error: error.response?.data?.message || 'Error al registrar',
                    isLoading: false
                })
                throw error
            }
        },

        logout: async () => {
            console.log('🚪 [AuthStore] Cerrando sesión...')
            try {
                await authAPI.logout?.().catch(() => { })
            } finally {
                clearStorage()
                set({
                    user: null,
                    isAuthenticated: false,
                    businesses: [],
                    userBusinesses: [],
                    selectedBusiness: null,
                    error: null,
                })
            }
        },

        loadUser: async () => {
            const token = localStorage.getItem(TOKEN_KEY)
            if (!token) {
                set({ isLoading: false, isAuthenticated: false })
                return null
            }

            try {
                const response = await (authAPI.me?.() || authAPI.getProfile?.())
                const user = response.data

                localStorage.setItem(USER_KEY, JSON.stringify(user))

                const storedBusinesses = loadFromStorage(BUSINESSES_KEY)

                set({
                    user,
                    isAuthenticated: true,
                    businesses: storedBusinesses || user?.memberships || user?.business_memberships || [],
                    userBusinesses: storedBusinesses || user?.memberships || user?.business_memberships || [],
                    isLoading: false,
                    error: null,
                })

                console.log('✅ [AuthStore] loadUser exitoso')
                return user
            } catch (error) {
                console.error('❌ [AuthStore] Error en loadUser:', error)
                clearStorage()
                set({
                    user: null,
                    isAuthenticated: false,
                    businesses: [],
                    userBusinesses: [],
                    isLoading: false,
                    error: null,
                })
                return null
            }
        },

        selectBusiness: (businessId, businessName) => {
            console.log(`🏢 [AuthStore] Seleccionando negocio: ${businessName} (${businessId})`)

            const businessData = { id: businessId, name: businessName }
            localStorage.setItem(BUSINESS_KEY, JSON.stringify(businessData))

            set({
                selectedBusiness: businessData
            })
        },

        refreshToken: async () => {
            const refresh = localStorage.getItem(REFRESH_KEY)
            if (!refresh) throw new Error('No refresh token')

            const response = await authAPI.refreshToken?.(refresh)
            const { access } = response.data

            localStorage.setItem(TOKEN_KEY, access)
            return access
        },

        hasPermission: (permission) => {
            const state = get()
            const { user, selectedBusiness, businesses } = state

            if (user?.is_super_admin) {
                return true
            }

            if (!user || !selectedBusiness) return false

            const membershipList = businesses || user?.memberships || user?.business_memberships || []

            const membership = membershipList.find(
                m => (m.business_id || m.business || m.id) === selectedBusiness.id
            )

            return membership?.permissions?.includes(permission) ?? false
        },

        clearError: () => set({ error: null }),

        getUserBusinesses: () => get().userBusinesses || get().businesses || [],
    }
})

// =============================================================================
// ✅ EXPORTS
// =============================================================================
export default useAuthStore
export { useAuthStore as authStore }

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY)

export const getBusinessId = () => {
    const business = localStorage.getItem(BUSINESS_KEY)
    return business ? JSON.parse(business).id : null
}

export const getUser = () => {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
}