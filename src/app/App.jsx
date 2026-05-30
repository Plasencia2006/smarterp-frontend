// src/app/App.jsx

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
import AuditPage from '@/features/superadmin/AuditPage'

// Páginas - Business
import BusinessDashboard from '@/features/business/BusinessDashboard'

// Placeholder
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

// ✅ Componente Login con verificación de autenticación
function LoginWithAuthCheck() {
    const { isAuthenticated, loading, user } = useAuth()

    // Si está cargando, muestra loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // ✅ Si YA está autenticado, redirigir inmediatamente
    if (isAuthenticated && user) {
        const primaryRole = user.roles?.[0]?.name?.toLowerCase() || ''

        if (user.is_super_admin) {
            window.location.href = '/superadmin/dashboard'
        } else if (primaryRole.includes('vendedor')) {
            window.location.href = '/vendedor/dashboard'
        } else if (primaryRole.includes('cajero')) {
            window.location.href = '/cajero/dashboard'
        } else if (primaryRole.includes('inventario')) {
            window.location.href = '/inventario/dashboard'
        } else if (primaryRole.includes('contador')) {
            window.location.href = '/contador/dashboard'
        } else if (primaryRole.includes('soporte') || primaryRole.includes('tecnico')) {
            window.location.href = '/soporte/dashboard'
        } else {
            window.location.href = '/business/dashboard'
        }

        // Mientras redirige, muestra loading
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // ✅ Si NO está autenticado, mostrar login
    return <LoginPage />
}

// ✅ Componente con TODAS las rutas
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
            {/* 🔓 PÚBLICAS - Con verificación de autenticación */}
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
                <Route path="audit" element={<AuditPage />} />
            </Route>

            {/* 🔐 ADMIN DEL NEGOCIO */}
            <Route path="/business/*" element={
                <ProtectedRoute>
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<BusinessDashboard />} />
                <Route path="dashboard" element={<BusinessDashboard />} />

                <Route path="users/*" element={
                    <ProtectedRoute requiredPermission="users.view">
                        <Placeholder title="Gestión de Usuarios" />
                    </ProtectedRoute>
                } />
                <Route path="sales/*" element={
                    <ProtectedRoute requiredPermission="sales.view">
                        <Placeholder title="Ventas" />
                    </ProtectedRoute>
                } />
                <Route path="inventory/*" element={
                    <ProtectedRoute requiredPermission="inventory.read">
                        <Placeholder title="Inventario" />
                    </ProtectedRoute>
                } />
                <Route path="cashier/*" element={
                    <ProtectedRoute requiredPermission="cashier.manage">
                        <Placeholder title="Caja" />
                    </ProtectedRoute>
                } />
                <Route path="reports/*" element={
                    <ProtectedRoute requiredPermission="reports.view">
                        <Placeholder title="Reportes" />
                    </ProtectedRoute>
                } />
                <Route path="services/*" element={
                    <ProtectedRoute requiredPermission="services.view">
                        <Placeholder title="Servicios" />
                    </ProtectedRoute>
                } />
                <Route path="settings/*" element={
                    <ProtectedRoute requiredPermission="business.update">
                        <Placeholder title="Configuración" />
                    </ProtectedRoute>
                } />
            </Route>

            {/* 🔐 ROLES OPERATIVOS */}
            <Route path="/vendedor/*" element={
                <ProtectedRoute requiredPermission="sales.create">
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Placeholder title="Panel Vendedor" />} />
                <Route path="dashboard" element={<Placeholder title="Panel Vendedor" />} />
            </Route>

            <Route path="/cajero/*" element={
                <ProtectedRoute requiredPermission="cashier.manage">
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Placeholder title="Panel Cajero" />} />
            </Route>

            <Route path="/inventario/*" element={
                <ProtectedRoute requiredPermission="inventory.read">
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Placeholder title="Panel Inventario" />} />
            </Route>

            <Route path="/contador/*" element={
                <ProtectedRoute requiredPermission="reports.financial">
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Placeholder title="Panel Contador" />} />
            </Route>

            <Route path="/soporte/*" element={
                <ProtectedRoute requiredPermission="services.view">
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Placeholder title="Panel Soporte" />} />
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

// ✅ Componente principal
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