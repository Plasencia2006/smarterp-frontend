import springApi from './spring.api'

export const cashierAPI = {
    // ===== APERTURA / CIERRE DE CAJA =====
    openRegister: (data) => springApi.post('/cashier/register/open', data),
    closeRegister: (id, data) => springApi.post(`/cashier/register/${id}/close`, data),
    getActiveRegister: () => springApi.get('/cashier/register/active'),
    getRegisterHistory: () => springApi.get('/cashier/register/history'),
    getRegisterSummary: (id) => springApi.get(`/cashier/register/${id}/summary`),
    getRegisterTransactions: (id) => springApi.get(`/cashier/register/${id}/transactions`),

    // ===== COTIZACIONES Y PAGOS =====
    searchQuote: (number) => springApi.get(`/cashier/quote/search?number=${number}`),
    validateQuote: (data) => springApi.post('/cashier/quote/validate', data),
    processPayment: (data) => springApi.post('/cashier/payment/process', data),
    getPendingQuotes: () => springApi.get('/sales/quotes/pending'),

    // Generar PDF de factura
    generateInvoicePdf: (quoteId) => springApi.get(`/sales/quotes/${quoteId}/invoice/pdf`, {
        responseType: 'blob'
    }),

    // ===== FACTURAS =====
    searchInvoices: (filter) => springApi.post('/cashier/invoices/search', filter),
    getInvoiceDetail: (number) => springApi.get(`/cashier/invoices/${number}/detail`),
    voidInvoice: (number, data) => springApi.post(`/cashier/invoices/${number}/void`, data),
    getDailySummary: (date) => springApi.get(`/cashier/invoices/summary?date=${date}`),
    getSalesByPaymentMethod: (start, end) =>
        springApi.get(`/cashier/invoices/by-payment-method?startDate=${start}&endDate=${end}`),
    findInvoiceByNumber: (number) => springApi.get(`/cashier/invoices/find?number=${number}`),
    getInvoices: (params) => {
        const queryParams = new URLSearchParams(params).toString()
        return springApi.get(`/sales/quotes/invoices?${queryParams}`)
    },

    // ===== ARQUEOS =====
    startAudit: (data) => springApi.post('/cashier/audits/start', data),
    completeAudit: (id, data) => springApi.post(`/cashier/audits/${id}/complete`, data),
    cancelAudit: (id, data) => springApi.post(`/cashier/audits/${id}/cancel`, data),
    getAudits: (registerId) => springApi.get(`/cashier/audits?registerId=${registerId}`),
    getAuditDetail: (id) => springApi.get(`/cashier/audits/${id}`),

    // ===== RETIROS DE EFECTIVO =====
    requestWithdrawal: (data) => springApi.post('/cashier/withdrawals/request', data),
    approveWithdrawal: (id, data) => springApi.post(`/cashier/withdrawals/${id}/approve`, data),
    rejectWithdrawal: (id, data) => springApi.post(`/cashier/withdrawals/${id}/reject`, data),
    completeWithdrawal: (id) => springApi.post(`/cashier/withdrawals/${id}/complete`),
    getWithdrawals: (registerId) => springApi.get(`/cashier/withdrawals?registerId=${registerId}`),
    getWithdrawalDetail: (id) => springApi.get(`/cashier/withdrawals/${id}`),
    getCashFlowSummary: (registerId) => springApi.get(`/cashier/withdrawals/cash-flow?registerId=${registerId}`),
    exceedsCashLimit: (registerId) => springApi.get(`/cashier/withdrawals/exceeds-limit?registerId=${registerId}`),

    // ===== EGRESOS =====
    registerExpense: (registerId, amount, description) =>
        springApi.post(`/cashier/expense?registerId=${registerId}&amount=${amount}&description=${encodeURIComponent(description)}`),

    // ===== VENTA DIRECTA =====
    processDirectSale: (data) => springApi.post('/cashier/sale/direct', data),
    searchProducts: (term) => springApi.get(`/inventory/products?search=${encodeURIComponent(term)}`),

    // ✅ CORREGIDO: URL y parámetro correctos
    searchCustomers: (term) => springApi.get(`/sales/customers/search?search=${encodeURIComponent(term)}`),

    // ===== DASHBOARD =====
    getDashboard: () => springApi.get('/cashier/dashboard'),
}

export default cashierAPI