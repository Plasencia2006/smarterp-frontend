import axios from 'axios'

// URLs de producción (Railway)
const SPRING_API_URL = 'https://smarterp-api-production.up.railway.app/api'
const TOKEN_KEY = 'smart_erp_token'
const BUSINESS_KEY = 'smart_erp_business'

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

        // ✅ NUEVO: Subir imagen de producto
        uploadImage: (productId, file) => {
            const formData = new FormData()
            formData.append('image', file)
            return springApi.post(`/inventory/products/${productId}/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },

        // ✅ NUEVO: Eliminar imagen de producto
        deleteImage: (productId, filename) => {
            return springApi.delete(`/inventory/products/${productId}/delete-image`, {
                params: { filename }
            })
        },
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

    // Admin Dashboard
    getAdminDashboard: () => springApi.get('/admin/inventory/dashboard'),

    // Admin Products
    getAdminProducts: (page, size) => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        })
        return springApi.get(`/admin/inventory/products?${params}`)
    },

    // Admin Stats by Category
    getAdminStatsByCategory: () => springApi.get('/admin/inventory/stats-by-category'),
}

// ✅ Helper para obtener URL de imagen

export const getImageUrl = (filename) => {
    if (!filename) return null

    // ✅ Usar variable de entorno para la URL base
    const baseUrl = import.meta.env.VITE_SPRING_API || 'http://localhost:8080/api'
    return `${baseUrl}/uploads/products/${filename}`
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
        responseType: 'blob'
    }),

    getDashboard: () => springApi.get('/sales/quotes/dashboard'),

    getAdminDashboard: (startDate, endDate) => {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/sales/dashboard?${params}`)
    },

    getAllQuotes: (page, size, status, sellerId, startDate, endDate) => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        })
        if (status) params.append('status', status)
        if (sellerId) params.append('sellerId', sellerId)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/sales/quotes?${params}`)
    },

    getSalesBySeller: (startDate, endDate) => {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/sales/stats-by-seller?${params}`)
    },

    getSalesByPeriod: (period, startDate, endDate) => {
        const params = new URLSearchParams({ period })
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/sales/sales-by-period?${params}`)
    },
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

// ✅ VENDEDOR DASHBOARD
export const vendedorAPI = {
    getDashboard: () => springApi.get('/sales/quotes/dashboard'),
}

// ✅ CAJA (CASH) - ADMIN
export const cashAPI = {
    getAdminDashboard: () => springApi.get('/admin/cash/dashboard'),
    getAdminRegisters: (page = 0, size = 20) => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        })
        return springApi.get(`/admin/cash/registers?${params}`)
    },
    getAdminRegisterTransactions: (registerId) =>
        springApi.get(`/admin/cash/registers/${registerId}/transactions`),
    getAdminPendingAudits: () => springApi.get('/admin/cash/audits/pending'),
    approveAudit: (id, notes) => {
        const params = new URLSearchParams()
        if (notes) params.append('notes', notes)
        return springApi.post(`/admin/cash/audits/${id}/approve?${params}`)
    },
    rejectAudit: (id, notes) => {
        const params = new URLSearchParams()
        if (notes) params.append('notes', notes)
        return springApi.post(`/admin/cash/audits/${id}/reject?${params}`)
    },
    getAdminPendingWithdrawals: () => springApi.get('/admin/cash/withdrawals/pending'),
    approveWithdrawal: (id, notes) => {
        const params = new URLSearchParams()
        if (notes) params.append('notes', notes)
        return springApi.post(`/admin/cash/withdrawals/${id}/approve?${params}`)
    },
    rejectWithdrawal: (id, notes) => {
        const params = new URLSearchParams()
        if (notes) params.append('notes', notes)
        return springApi.post(`/admin/cash/withdrawals/${id}/reject?${params}`)
    },
}

// ✅ REPORTES - API para Admin
export const reportAPI = {
    getReportTypes: () => springApi.get('/admin/reports/types'),
    getReportPreview: (type, startDate, endDate) => {
        const params = new URLSearchParams()
        params.append('type', type)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/reports/preview?${params}`)
    },
    downloadReport: (type, format, startDate, endDate) => {
        const params = new URLSearchParams()
        params.append('type', type)
        params.append('format', format)
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/reports/generate?${params}`, {
            responseType: 'blob'
        })
    },
    downloadFile: async (type, format, startDate, endDate, fileName) => {
        try {
            const response = await springApi.get(`/admin/reports/generate?type=${type}&format=${format}${startDate ? '&startDate=' + startDate : ''}${endDate ? '&endDate=' + endDate : ''}`, {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            const extension = format === 'EXCEL' ? 'xlsx' : 'csv'
            const timestamp = new Date().toISOString().split('T')[0]
            link.setAttribute('download', fileName || `${type.toLowerCase()}_reporte_${timestamp}.${extension}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            return true
        } catch (error) {
            console.error('❌ Error descargando reporte:', error)
            throw error
        }
    }
}

// ✅ AUDITORÍA - API para Admin
export const auditAPI = {
    getAuditLogs: (params = {}) => {
        const queryParams = new URLSearchParams()
        if (params.page) queryParams.append('page', params.page)
        if (params.size) queryParams.append('size', params.size)
        if (params.action) queryParams.append('action', params.action)
        if (params.entityType) queryParams.append('entityType', params.entityType)
        if (params.userId) queryParams.append('userId', params.userId)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        return springApi.get(`/admin/audit/logs?${queryParams}`)
    },
    getRecentActivities: (limit = 10) =>
        springApi.get(`/admin/audit/recent?limit=${limit}`),
    getActionStats: (startDate, endDate) => {
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        return springApi.get(`/admin/audit/stats?${params}`)
    },
    getByEntity: (entityType, entityId, page = 0, size = 20) =>
        springApi.get(`/admin/audit/entity/${entityType}/${entityId}?page=${page}&size=${size}`),
    getByUser: (userId, page = 0, size = 20) =>
        springApi.get(`/admin/audit/user/${userId}?page=${page}&size=${size}`),
}

// ✅ DASHBOARD - API para Admin
export const dashboardAPI = {
    getStats: () => springApi.get('/admin/dashboard/stats'),
    getRecentActivity: () => springApi.get('/admin/dashboard/recent-activity'),
}

export default springApi