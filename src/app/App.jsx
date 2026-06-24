import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Layouts
import MainLayout from '@/layouts/MainLayout'
import BusinessLayout from '@/layouts/BusinessLayout'

// Páginas - Auth
import LoginPage from '@/features/auth/LoginPage'
import SelectBusiness from '@/features/auth/SelectBusiness'

// Páginas - Super Admin
import SuperDashboard from '@/features/superadmin/SuperDashboard'
import BusinessPage from '@/features/superadmin/BusinessPage'
import { UsersPage } from '@/features/superadmin/UsersPage'
import GlobalReportsPage from '@/features/superadmin/GlobalReportsPage'
import GlobalSettingsPage from '@/features/superadmin/GlobalSettingsPage'
import BackupsPage from '@/features/superadmin/BackupsPage'
import SuperAuditPage from '@/features/superadmin/AuditPage'

// Páginas - Business (Admin del Negocio)
import BusinessDashboard from '@/features/business/BusinessDashboard'
import UsersManager from '@/features/business/UsersManager'
import RolesManager from '@/features/business/RolesManager'
import MembersManager from '@/features/business/MembersManager'
import InventoryManager from '@/features/business/InventoryManager'
import SalesManager from '@/features/business/SalesManager'
import ReportsPage from '@/features/business/ReportsPage'
import SettingsPage from '@/features/business/SettingsPage'
import AuditPage from '@/features/business/AuditPage'

// Paneles por Rol Operativo
import ContadorDashboard from '@/features/contador/ContadorDashboard'
import SoporteDashboard from '@/features/soporte/SoporteDashboard'


// Agregar imports  (Cajero)
import CajeroDashboard from '@/features/cajero/CajeroDashboard'
import AperturaCaja from '@/features/cajero/AperturaCaja'
import CierreCaja from '@/features/cajero/CierreCaja'
import ProcesarPago from '@/features/cajero/ProcesarPago'
import GestionFacturas from '@/features/cajero/GestionFacturas'
import DetalleFactura from '@/features/cajero/DetalleFactura'
// nuevos cajero causa
import ArqueosCaja from '@/features/cajero/ArqueosCaja'
import RetirosEfectivo from '@/features/cajero/RetirosEfectivo'
import FlujoEfectivo from '@/features/cajero/FlujoEfectivo'
import VentaDirecta from '@/features/cajero/VentaDirecta'



//  Módulo Inventario (Spring Boot)
import InventarioDashboard from '@/features/inventario/InventarioDashboard'
import ProductsManager from '@/features/inventario/ProductsManager'
import StockManager from '@/features/inventario/StockManager'
import SuppliersManager from '@/features/inventario/SuppliersManager'
import PurchasesManager from '@/features/inventario/PurchasesManager'
import StockAlerts from '@/features/inventario/StockAlerts'
import CategoriesManager from '@/features/inventario/CategoriesManager'

//  Módulo Ventas POS (Vendedor)
import POSManager from '@/features/vendedor/POSManager'
import QuoteViewer from '@/features/vendedor/QuoteViewer'  //  NUEVO
import VendedorDashboard from '@/features/vendedor/VendedorDashboard'
import CustomerManager from '@/features/vendedor/CustomerManager'




const Placeholder = ({ title }) => (
    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-dashed">
        <div className="text-center">
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground">Módulo en desarrollo</p>
        </div>
    </div>
)

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        },
    },
})

function LoginWithAuthCheck() {
    const { isAuthenticated, loading, user } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (isAuthenticated && user) {
        if (user.is_super_admin || user.is_superuser) {
            window.location.href = '/superadmin/dashboard'
            return null
        }

        const hasBusiness =
            (user.business_memberships && user.business_memberships.length > 0) ||
            (user.memberships && user.memberships.length > 0) ||
            (user.businesses && user.businesses.length > 0) ||
            (user.business && user.business.id)

        if (!hasBusiness) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md p-8">
                        <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Sin Negocio</h2>
                        <p className="text-muted-foreground mb-4">
                            El usuario no tiene negocios asignados. Contacta al administrador.
                        </p>
                        <button onClick={() => window.location.href = '/login'} className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                            Volver al Login
                        </button>
                    </div>
                </div>
            )
        }

        window.location.href = '/select-business'
        return null
    }

    return <LoginPage />
}

function AppRoutes() {
    const { loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <Routes>
            {/* 🔓 PÚBLICAS */}
            <Route path="/login" element={<LoginWithAuthCheck />} />
            <Route path="/select-business" element={<SelectBusiness />} />

            {/* 🔐 SUPER ADMIN */}
            <Route path="/superadmin/*" element={
                <ProtectedRoute requiredRole="super_admin">
                    <MainLayout />
                </ProtectedRoute>
            }>
                <Route index element={<SuperDashboard />} />
                <Route path="dashboard" element={<SuperDashboard />} />
                <Route path="businesses" element={<BusinessPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="settings" element={<GlobalSettingsPage />} />
                <Route path="backups" element={<BackupsPage />} />
                <Route path="reports" element={<GlobalReportsPage />} />
                <Route path="audit" element={<SuperAuditPage />} />
            </Route>

            {/* 🔐 BUSINESS (ADMIN DEL NEGOCIO) */}
            <Route path="/business/*" element={
                <ProtectedRoute>
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<BusinessDashboard />} />
                <Route path="dashboard" element={<BusinessDashboard />} />
                <Route path="users/*" element={<ProtectedRoute requiredPermission="users.view"><UsersManager /></ProtectedRoute>} />
                <Route path="roles/*" element={<ProtectedRoute requiredPermission="roles.view"><RolesManager /></ProtectedRoute>} />
                <Route path="members/*" element={<ProtectedRoute requiredPermission="users.view"><MembersManager /></ProtectedRoute>} />
                <Route path="inventory/*" element={<ProtectedRoute requiredPermission="inventory.read"><InventoryManager /></ProtectedRoute>} />
                <Route path="sales/*" element={<ProtectedRoute requiredPermission="sales.view"><SalesManager /></ProtectedRoute>} />
                <Route path="reports/*" element={<ProtectedRoute requiredPermission="reports.view"><ReportsPage /></ProtectedRoute>} />
                <Route path="settings/*" element={<ProtectedRoute requiredPermission="business.update"><SettingsPage /></ProtectedRoute>} />
                <Route path="audit/*" element={<ProtectedRoute requiredPermission="audit.view"><AuditPage /></ProtectedRoute>} />
            </Route>

            {/* ✅ CAJERO */}
            <Route path="/cajero/*" element={<ProtectedRoute><BusinessLayout /></ProtectedRoute>}>
                <Route index element={<CajeroDashboard />} />
                <Route path="dashboard" element={<CajeroDashboard />} />
                <Route path="apertura" element={<AperturaCaja />} />
                <Route path="cierre" element={<CierreCaja />} />
                <Route path="procesar-pago" element={<ProcesarPago />} />
                <Route path="facturas" element={<GestionFacturas />} />
                <Route path="facturas/:invoiceNumber" element={<DetalleFactura />} />
                {/* ✅ NUEVAS RUTAS */}
                <Route path="arqueos" element={<ArqueosCaja />} />
                <Route path="retiros" element={<RetirosEfectivo />} />
                <Route path="flujo-efectivo" element={<FlujoEfectivo />} />
                <Route path="venta-directa" element={<VentaDirecta />} />
            </Route>

            {/* ✅ VENDEDOR - UNIFICADO con Cotizaciones */}
            <Route path="/vendedor/*" element={<ProtectedRoute><BusinessLayout /></ProtectedRoute>}>
                <Route index element={<POSManager />} />
                <Route path="dashboard" element={<VendedorDashboard />} />
                <Route path="pos" element={<POSManager />} />
                <Route path="cotizaciones" element={<QuoteViewer />} />  {/* ✅ NUEVA RUTA */}
                <Route path="clientes" element={<CustomerManager />} />
            </Route>

            {/* ✅ INVENTARIO - CON TODAS LAS RUTAS */}
            <Route path="/inventario/*" element={<ProtectedRoute><BusinessLayout /></ProtectedRoute>}>
                <Route index element={<InventarioDashboard />} />
                <Route path="dashboard" element={<InventarioDashboard />} />
                <Route path="products" element={<ProductsManager />} />
                <Route path="products/:id" element={<ProductsManager />} />
                <Route path="stock" element={<StockManager />} />
                <Route path="stock/movements" element={<StockManager />} />
                <Route path="suppliers" element={<SuppliersManager />} />
                <Route path="purchases" element={<PurchasesManager />} />
                <Route path="purchases/:id" element={<PurchasesManager />} />
                <Route path="alerts" element={<StockAlerts />} />
                <Route path="categories" element={<CategoriesManager />} />
            </Route>

            {/* ✅ CONTADOR */}
            <Route path="/contador/*" element={<ProtectedRoute><BusinessLayout /></ProtectedRoute>}>
                <Route index element={<ContadorDashboard />} />
                <Route path="dashboard" element={<ContadorDashboard />} />
            </Route>

            {/* ✅ SOPORTE */}
            <Route path="/soporte/*" element={<ProtectedRoute><BusinessLayout /></ProtectedRoute>}>
                <Route index element={<SoporteDashboard />} />
                <Route path="dashboard" element={<SoporteDashboard />} />
            </Route>

            {/* ❌ 404 */}
            <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">404</h1>
                        <p className="text-muted-foreground mb-4">Página no encontrada</p>
                        <Navigate to="/login" replace />
                    </div>
                </div>
            } />
        </Routes>
    )
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <AppRoutes />
                    <Toaster position="top-right" richColors expand />
                </AuthProvider>
            </BrowserRouter>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    )
}

export default App