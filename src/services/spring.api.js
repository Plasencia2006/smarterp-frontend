import axios from 'axios'
import { authStore } from '@store/authStore'

const INVENTORY_URL = import.meta.env.VITE_INVENTORY_API || 'http://localhost:8081/api/v1'
const SALES_URL = import.meta.env.VITE_SALES_API || 'http://localhost:8082/api/v1'
const REPORTS_URL = import.meta.env.VITE_REPORTS_API || 'http://localhost:8084/api/v1'

// Crear función base para clientes
const createClient = (baseURL) => {
    const client = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    })

    client.interceptors.request.use(
        (config) => {
            const token = authStore.getAccessToken()
            const businessId = authStore.getBusinessId()

            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }

            if (businessId) {
                config.headers['X-BUSINESS-ID'] = businessId
            }

            return config
        },
        (error) => Promise.reject(error)
    )

    return client
}

// Clientes para cada microservicio
export const inventoryApi = createClient(INVENTORY_URL)
export const salesApi = createClient(SALES_URL)
export const reportsApi = createClient(REPORTS_URL)

// Servicios de inventario
export const inventoryAPI = {
    products: {
        list: () => inventoryApi.get('/products/'),
        create: (data) => inventoryApi.post('/products/', data),
        update: (id, data) => inventoryApi.put(`/products/${id}/`, data),
        delete: (id) => inventoryApi.delete(`/products/${id}/`),
    },
    categories: {
        list: () => inventoryApi.get('/categories/'),
        create: (data) => inventoryApi.post('/categories/', data),
    },
    stock: {
        list: () => inventoryApi.get('/stock/'),
        adjust: (data) => inventoryApi.post('/stock/adjust/', data),
    },
}

// Servicios de ventas
export const salesAPI = {
    orders: {
        list: () => salesApi.get('/orders/'),
        create: (data) => salesApi.post('/orders/', data),
        get: (id) => salesApi.get(`/orders/${id}/`),
        cancel: (id) => salesApi.post(`/orders/${id}/cancel/`),
    },
    cashier: {
        open: (data) => salesApi.post('/cashier/open/', data),
        close: () => salesApi.post('/cashier/close/'),
        getCurrent: () => salesApi.get('/cashier/current/'),
    },
}

// Servicios de reportes
export const reportsAPI = {
    sales: {
        daily: (params) => reportsApi.get('/reports/sales/daily/', { params }),
        monthly: (params) => reportsApi.get('/reports/sales/monthly/', { params }),
    },
    inventory: {
        stock: () => reportsApi.get('/reports/inventory/stock/'),
        movements: (params) => reportsApi.get('/reports/inventory/movements/', { params }),
    },
}

export default { inventoryApi, salesApi, reportsApi }