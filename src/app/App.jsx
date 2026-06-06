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
import SuperAuditPage from '@/features/superadmin/AuditPage'  // ← ✅ Renombrado para evitar conflicto

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

// ✅ Módulos de negocio - Comentar los que NO existen aún para evitar errores
// import UsersManager from '@/features/business/modules/users/UsersManager'
// import RolesManager from '@/features/business/RolesManager'
// import MembersManager from '@/features/business/MembersManager'
// import InventoryManager from '@/features/business/InventoryManager'
// import SalesManager from '@/features/business/SalesManager'
// import ReportsPage from '@/features/business/ReportsPage'
// import SettingsPage from '@/features/business/SettingsPage'
// import AuditPage from '@/features/business/AuditPage'

// Placeholder para módulos en desarrollo
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

// ✅ Componente Login con verificación de autenticación - VERSIÓN FINAL
// ✅ Componente Login con verificación de autenticación - CON DEBUG
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
        // 🔍 DEBUG: Ver qué tiene realmente el objeto user
        console.log('🔍 [DEBUG] User object completo:', JSON.stringify(user, null, 2))
        console.log('🔍 [DEBUG] business_memberships:', user.business_memberships)
        console.log('🔍 [DEBUG] memberships:', user.memberships)
        console.log('🔍 [DEBUG] businesses:', user.businesses)
        console.log('🔍 [DEBUG] roles:', user.roles)
        console.log('🔍 [DEBUG] is_super_admin:', user.is_super_admin)

        // 1️⃣ Super Admin
        if (user.is_super_admin) {
            console.log('🚀 Super Admin → /superadmin/dashboard')
            window.location.href = '/superadmin/dashboard'
            return null
        }

        // 2️⃣ ✅ Verificar negocios asignados - CON MÚLTIPLES NOMBRES POSIBLES
        const hasBusiness =
            (user.business_memberships && user.business_memberships.length > 0) ||
            (user.memberships && user.memberships.length > 0) ||
            (user.businesses && user.businesses.length > 0) ||
            (user.business && user.business.id) // Si es un solo negocio como objeto

        console.log('✅ [DEBUG] hasBusiness:', hasBusiness)

        if (!hasBusiness) {
            console.warn('⚠️ Usuario SIN negocios detectados:', user.email)
            // window.location.href = '/no-business-access'  // ← Descomenta cuando quieras
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md p-8">
                        <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Debug Mode</h2>
                        <p className="text-muted-foreground mb-4">
                            El usuario NO tiene negocios detectados. Revisa la consola (F12) para ver el objeto user completo.
                        </p>
                        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                        <Button onClick={() => window.location.href = '/login'} className="mt-4" variant="outline">
                            Volver al Login
                        </Button>
                    </div>
                </div>
            )
        }

        // 3️⃣ Todos van a select-business
        console.log('🚀 Usuario con negocio → /select-business')
        window.location.href = '/select-business'
        return null
    }

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
                <Route path="audit" element={<SuperAuditPage />} />  {/* ← ✅ Usar nombre renombrado */}
            </Route>

            <Route path="/business/*" element={
                <ProtectedRoute>
                    <BusinessLayout />
                </ProtectedRoute>
            }>
                <Route index element={<BusinessDashboard />} />
                <Route path="dashboard" element={<BusinessDashboard />} />

                {/* ✅ CAMBIAR: Reemplazar Placeholder por componente real */}
                <Route path="users/*" element={
                    <ProtectedRoute requiredPermission="users.view">
                        <UsersManager />  {/* ← Cambiar de <Placeholder /> a <UsersManager /> */}
                    </ProtectedRoute>
                } />

                <Route path="roles/*" element={
                    <ProtectedRoute requiredPermission="roles.view">
                        <RolesManager />  {/* ← Cambiar de <Placeholder /> a <RolesManager /> */}
                    </ProtectedRoute>
                } />

                <Route path="members/*" element={
                    <ProtectedRoute requiredPermission="users.view">
                        <MembersManager />  {/* ← Cambiar de <Placeholder /> a <MembersManager /> */}
                    </ProtectedRoute>
                } />

                <Route path="inventory/*" element={
                    <ProtectedRoute requiredPermission="inventory.read">
                        <InventoryManager />  {/* ← Cambiar de <Placeholder /> a <InventoryManager /> */}
                    </ProtectedRoute>
                } />

                <Route path="sales/*" element={
                    <ProtectedRoute requiredPermission="sales.view">
                        <SalesManager />  {/* ← Cambiar de <Placeholder /> a <SalesManager /> */}
                    </ProtectedRoute>
                } />

                <Route path="reports/*" element={
                    <ProtectedRoute requiredPermission="reports.view">
                        <ReportsPage />  {/* ← Cambiar de <Placeholder /> a <ReportsPage /> */}
                    </ProtectedRoute>
                } />

                <Route path="settings/*" element={
                    <ProtectedRoute requiredPermission="business.update">
                        <SettingsPage />  {/* ← Cambiar de <Placeholder /> a <SettingsPage /> */}
                    </ProtectedRoute>
                } />

                <Route path="audit/*" element={
                    <ProtectedRoute requiredPermission="audit.view">
                        <AuditPage />  {/* ← Cambiar de <Placeholder /> a <AuditPage /> */}
                    </ProtectedRoute>
                } />

                {/* Mantener Placeholder solo para módulos que aún no existen */}
                <Route path="cashier/*" element={
                    <ProtectedRoute requiredPermission="cashier.manage">
                        <Placeholder title="Caja / Punto de Venta" />
                    </ProtectedRoute>
                } />

                <Route path="services/*" element={
                    <ProtectedRoute requiredPermission="services.view">
                        <Placeholder title="Servicios" />
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