// src/app/App.jsx

import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { authStore } from '@store/authStore'

// Layouts
import { MainLayout } from '@layouts/MainLayout'

// Features - Auth
import { LoginPage } from '@features/auth/LoginPage'
import SelectBusiness from '@features/auth/SelectBusiness'

// Features - Dashboard


// Features - Super Admin
import SuperDashboard from '@features/superadmin/SuperDashboard'
import BusinessPage from '@features/superadmin/BusinessPage'
import { UsersPage } from '@features/superadmin/UsersPage'
// ✅ NUEVAS PÁGINAS IMPORTADAS
import GlobalReportsPage from '@features/superadmin/GlobalReportsPage' 
import GlobalSettingsPage from '@features/superadmin/GlobalSettingsPage'
import BackupsPage from '@features/superadmin/BackupsPage'
import AuditPage from '@features/superadmin/AuditPage'

// Features - Business
import BusinessDashboard from '@features/business/BusinessDashboard'

// Placeholder
const Placeholder = ({ title }) => (
    <div className="flex items-center justify-center h-64">
        <h2 className="text-2xl font-semibold text-muted-foreground">{title}</h2>
    </div>
)

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
})

function App() {
    const { loadUser, isAuthenticated, isLoading, user, userBusinesses } = authStore()
    const [redirectChecked, setRedirectChecked] = useState(false)

    // Cargar usuario al iniciar
    useEffect(() => {
        const initialize = async () => {
            console.log('🚀 [App] Iniciando aplicación...')
            await loadUser()
            setRedirectChecked(true)
            console.log('✅ [App] Inicialización completada')
        }
        initialize()
    }, [loadUser])

    // Debug: Verificar estado
    useEffect(() => {
        if (redirectChecked && user) {
            console.log('========================================')
            console.log('🔍 ESTADO DEL USUARIO:')
            console.log('  - Email:', user.email)
            console.log('  - is_super_admin:', user.is_super_admin)
            console.log('  - userBusinesses:', userBusinesses)
            console.log('  - userBusinesses.length:', userBusinesses?.length)
            console.log('  - isAuthenticated:', isAuthenticated)
            console.log('========================================')
        }
    }, [user, userBusinesses, redirectChecked, isAuthenticated])

    // Mostrar loading
    if (isLoading || !redirectChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    // Función para verificar super admin
    const checkSuperAdmin = () => {
        if (!user) return false
        return (
            user.is_super_admin === true ||
            user.is_super_admin === 'true' ||
            user.is_super_admin === 1 ||
            user.is_superuser === true ||
            user.is_superuser === 'true' ||
            user.is_superuser === 1 ||
            user.role === 'SUPER_ADMIN' ||
            user.role === 'super_admin'
        )
    }

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    {/* RUTAS PÚBLICAS */}
                    <Route
                        path="/login"
                        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/select-business"
                        element={isAuthenticated ? <SelectBusiness /> : <Navigate to="/login" />}
                    />

                    {/* RUTA RAÍZ - SIEMPRE REDIRIGIR A SELECT-BUSINESS (excepto super admin) */}
                    <Route
                        path="/"
                        element={
                            !isAuthenticated ? (
                                <Navigate to="/login" replace />
                            ) : checkSuperAdmin() ? (
                                <Navigate to="/superadmin/dashboard" replace />
                            ) : (
                                // Usuarios normales → SIEMPRE select-business
                                <Navigate to="/select-business" replace />
                            )
                        }
                    />

                    {/* RUTAS PROTEGIDAS */}
                    <Route
                        path="/"
                        element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
                    >
                

                        {/* Super Admin Routes */}
                        <Route path="superadmin">
                            <Route
                                path="dashboard"
                                element={checkSuperAdmin() ? <SuperDashboard /> : <Navigate to="/dashboard" />}
                            />
                            <Route
                                path="businesses"
                                element={checkSuperAdmin() ? <BusinessPage /> : <Navigate to="/dashboard" />}
                            />
                            <Route
                                path="users"
                                element={checkSuperAdmin() ? <UsersPage /> : <Navigate to="/dashboard" />}
                            />

                            {/* ✅ NUEVAS RUTAS DE SUPER ADMIN */}
                            <Route
                                path="settings"
                                element={checkSuperAdmin() ? <GlobalSettingsPage /> : <Navigate to="/dashboard" />}
                            />
                            <Route
                                path="backups"
                                element={checkSuperAdmin() ? <BackupsPage /> : <Navigate to="/dashboard" />}
                            />
                            <Route
                                path="reports"
                                element={checkSuperAdmin() ? <GlobalReportsPage /> : <Navigate to="/dashboard" />}
                            />
                            <Route
                                path="audit"
                                element={checkSuperAdmin() ? <AuditPage /> : <Navigate to="/dashboard" />}
                            />
                        </Route>

                        {/* Business Dashboard - Ruta específica por negocio */}
                        <Route path="business/:businessId/dashboard" element={<BusinessDashboard />} />

                        {/* Módulos de Negocio */}
                        <Route path="inventory" element={<Placeholder title="Módulo de Inventario" />} />
                        <Route path="sales" element={<Placeholder title="Módulo de Ventas" />} />
                        <Route path="reports" element={<Placeholder title="Módulo de Reportes" />} />
                        <Route path="cashier" element={<Placeholder title="Caja / Punto de Venta" />} />
                        <Route path="settings" element={<Placeholder title="Configuración del Negocio" />} />
                        <Route path="profile" element={<Placeholder title="Mi Perfil" />} />
                        <Route path="notifications" element={<Placeholder title="Notificaciones" />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>

                <Toaster position="top-right" richColors />
            </BrowserRouter>

            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    )
}

export default App