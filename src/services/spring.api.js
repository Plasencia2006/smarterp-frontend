import axios from 'axios'

const SPRING_API_URL = import.meta.env.VITE_SPRING_API || 'http://localhost:8080/api'
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'smart_erp_token'
const BUSINESS_KEY = import.meta.env.VITE_BUSINESS_KEY || 'smart_erp_business'

const springApi = axios.create({
    baseURL: SPRING_API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
})

springApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('🔑 JWT enviado:', token.substring(0, 20) + '...')
        }

        try {
            const business = JSON.parse(localStorage.getItem(BUSINESS_KEY) || '{}')
            if (business?.id) {
                config.headers['X-Business-ID'] = business.id
                console.log('🏢 Business-ID:', business.id)
            }
        } catch (e) {
            console.warn('⚠️ No se pudo agregar business_id')
        }

        console.log(`🚀 [Spring API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
    },
    (error) => {
        console.error('❌ Error en request interceptor:', error)
        return Promise.reject(error)
    }
)

springApi.interceptors.response.use(
    (response) => {
        console.log(`✅ [Spring API] ${response.status} ${response.config.url}`)
        return response
    },
    (error) => {
        console.error(`❌ [Spring API] Error ${error.response?.status}:`, error.response?.data)
        console.error('📍 URL:', error.config?.url)
        console.error('🔑 Headers:', error.config?.headers)
        return Promise.reject(error)
    }
)

// ✅ INVENTARIO
export const inventoryAPI = {
    products: {
        list: (params = {}) => springApi.get('/inventory/products', { params }),
        create: (data) => springApi.post('/inventory/products', data),
        get: (id) => springApi.get(`/inventory/products/${id}`),
        update: (id, data) => springApi.put(`/inventory/products/${id}`, data),
        delete: (id) => springApi.delete(`/inventory/products/${id}`),
    },
    stock: {
        list: (params = {}) => springApi.get('/inventory/stock', { params }),
        adjust: (data) => springApi.post('/inventory/stock/adjust', data),
        movements: (params = {}) => springApi.get('/inventory/stock/movements', { params }),
    },
    alerts: {
        generate: () => springApi.post('/inventory/alerts/generate'),
        list: () => springApi.get('/inventory/alerts'),
        attend: (id) => springApi.put(`/inventory/alerts/${id}/attend`),
        delete: (id) => springApi.delete(`/inventory/alerts/${id}`),
    },
    suppliers: {
        list: (params = {}) => springApi.get('/inventory/suppliers', { params }),
        create: (data) => springApi.post('/inventory/suppliers', data),
        update: (id, data) => springApi.put(`/inventory/suppliers/${id}`, data),
        delete: (id) => springApi.delete(`/inventory/suppliers/${id}`),
    },
    purchases: {
        list: (params = {}) => springApi.get('/inventory/purchases', { params }),
        create: (data) => springApi.post('/inventory/purchases', data),
        get: (id) => springApi.get(`/inventory/purchases/${id}`),
        update: (id, data) => springApi.put(`/inventory/purchases/${id}`, data),
        receive: (id, data) => springApi.post(`/inventory/purchases/${id}/receive`, data),
    },
    categories: {
        list: (params = {}) => springApi.get('/inventory/categories', { params }),
        create: (data) => springApi.post('/inventory/categories', data),
        get: (id) => springApi.get(`/inventory/categories/${id}`),
        update: (id, data) => springApi.put(`/inventory/categories/${id}`, data),
        delete: (id) => springApi.delete(`/inventory/categories/${id}`),
    },
    bulk: {
        importCategories: (file) => {
            const formData = new FormData()
            formData.append('file', file)
            return springApi.post('/inventory/bulk/categories', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        importProducts: (file, updateExisting = false) => {
            const formData = new FormData()
            formData.append('file', file)
            return springApi.post(`/inventory/bulk/products?updateExisting=${updateExisting}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        validate: (file, type) => {
            const formData = new FormData()
            formData.append('file', file)
            return springApi.post(`/inventory/bulk/validate?type=${type}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        downloadCategoriesTemplate: () => {
            return springApi.get('/inventory/bulk/templates/categories', {
                responseType: 'blob'
            }).then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', 'plantilla_categorias.csv')
                document.body.appendChild(link)
                link.click()
                link.remove()
            })
        },
        downloadProductsTemplate: () => {
            return springApi.get('/inventory/bulk/templates/products', {
                responseType: 'blob'
            }).then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', 'plantilla_productos.csv')
                document.body.appendChild(link)
                link.click()
                link.remove()
            })
        },
    },
    dashboard: {
        getStats: () => springApi.get('/inventory/dashboard/stats'),
        getMovementsChart: () => springApi.get('/inventory/dashboard/movements-chart'),
        getCategoriesDistribution: () => springApi.get('/inventory/dashboard/categories-distribution'),
        getLowStockProducts: () => springApi.get('/inventory/dashboard/low-stock-products'),
        getRecentMovements: () => springApi.get('/inventory/dashboard/recent-movements'),
    },
    quotes: {
        create: (data) => springApi.post('/sales/quotes', data),
        getPending: () => springApi.get('/sales/quotes/pending'),
        getByNumber: (number) => springApi.get(`/sales/quotes/number/${number}`),
        getAll: () => springApi.get('/sales/quotes'),
        block: (id, minutes) => springApi.post(`/sales/quotes/${id}/block?minutes=${minutes}`),
        release: (id) => springApi.post(`/sales/quotes/${id}/release`),
    },
    productBlocks: {
        check: (productId) => springApi.get(`/sales/quotes/product/${productId}/availability`),
    },
}

// ✅ COTIZACIONES
export const quoteAPI = {
    create: (data) => springApi.post('/sales/quotes', data),
    getPending: () => springApi.get('/sales/quotes/pending'),
    getAll: () => springApi.get('/sales/quotes'),
    getByNumber: (number) => springApi.get(`/sales/quotes/number/${number}`),
    block: (id, minutes = 20) => springApi.post(`/sales/quotes/${id}/block?minutes=${minutes}`),
    release: (id) => springApi.post(`/sales/quotes/${id}/release`),
    getProductAvailability: (productId) => springApi.get(`/sales/quotes/product/${productId}/availability`),
    downloadPdf: (id) => springApi.get(`/sales/quotes/${id}/pdf`, {
        responseType: 'blob'  // Importante para descargar archivos
    }),
}

// ✅ CLIENTES
export const customerAPI = {
    create: (data) => springApi.post('/sales/customers', data),
    update: (id, data) => springApi.put(`/sales/customers/${id}`, data),
    delete: (id) => springApi.delete(`/sales/customers/${id}`),
    getAll: () => springApi.get('/sales/customers'),
    search: (search) => springApi.get(`/sales/customers/search?search=${search}`),
    getFrequent: () => springApi.get('/sales/customers/frequent'),
    getByDocument: (documentNumber) => springApi.get(`/sales/customers/document/${documentNumber}`),
}

// ✅ VENDEDOR DASHBOARD - NUEVO
export const vendedorAPI = {
    getDashboard: () => springApi.get('/sales/quotes/dashboard'),
}

export default springApi