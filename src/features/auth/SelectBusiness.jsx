// src/features/auth/SelectBusiness.jsx

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authStore } from '@store/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card'
import { Button } from '@components/ui/button'
import { Building2, ArrowRight, AlertCircle, LogOut } from 'lucide-react'

export const SelectBusiness = () => {
    const navigate = useNavigate()
    const { user, userBusinesses, logout, selectBusiness } = authStore()

    // Debugging
    useEffect(() => {
        console.log('🔍 [SelectBusiness] ========== RENDER ==========')
        console.log('🔍 [SelectBusiness] user:', user)
        console.log('🔍 [SelectBusiness] userBusinesses:', userBusinesses)
        console.log('🔍 [SelectBusiness] userBusinesses.length:', userBusinesses?.length)
        console.log('🔍 [SelectBusiness] ========== FIN ==========')

        if (!user) {
            console.log('⚠️ [SelectBusiness] No hay usuario, redirigiendo a login')
            navigate('/login', { replace: true })
        }
    }, [user, userBusinesses, navigate])

    if (!user) {
        return null
    }

    // Manejo seguro
    const businesses = Array.isArray(userBusinesses) ? userBusinesses : []

    console.log('📋 [SelectBusiness] Businesses a mostrar:', businesses)

    if (businesses.length === 0) {
        console.log('⚠️ [SelectBusiness] No hay negocios asignados')
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <Card className="w-full max-w-md border-destructive/30">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <CardTitle>Acceso Restringido</CardTitle>
                        </div>
                        <CardDescription>
                            No tienes negocios asignados en el sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Contacta al administrador para que te asigne un negocio.
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                                Ir al Inicio
                            </Button>
                            <Button variant="outline" onClick={logout} className="flex-1">
                                <LogOut className="w-4 h-4 mr-2" />
                                Cerrar Sesión
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Función para seleccionar negocio
    const handleSelectBusiness = (businessId, businessName) => {
        console.log(`🚀 [SelectBusiness] Seleccionando: ${businessName} (${businessId})`)

        // Guardar selección en el store y localStorage
        selectBusiness(businessId, businessName)

        // Navegar al dashboard del negocio
        navigate(`/business/${businessId}/dashboard`)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold">Selecciona tu Negocio</h1>
                    <p className="text-muted-foreground mt-2">
                        Tienes acceso a <strong>{businesses.length}</strong> negocios.
                        Selecciona uno para continuar.
                    </p>
                </div>

                {/* Lista de Negocios */}
                <div className="grid gap-4">
                    {businesses.map((membership, index) => {
                        const businessId = membership.business || membership.id || membership.business_id
                        const businessName = membership.business_name || membership.name || `Negocio #${index + 1}`
                        const role = membership.role || 'Miembro'
                        const isActive = membership.is_active !== false

                        return (
                            <Card
                                key={businessId || index}
                                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                                onClick={() => isActive && handleSelectBusiness(businessId, businessName)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary' : 'bg-muted'
                                                }`}>
                                                <Building2 className={`w-6 h-6 ${isActive ? 'text-white' : 'text-muted-foreground'
                                                    }`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    {businessName}
                                                    {!isActive && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    Rol: {role.toLowerCase()}
                                                </p>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default SelectBusiness