// src/features/auth/SelectBusiness.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, CheckCircle2 } from 'lucide-react'

export default function SelectBusiness() {
    const navigate = useNavigate()
    const { user, loading } = useAuth()
    const [selectedBusinessId, setSelectedBusinessId] = useState(null)

    // ✅ CORRECCIÓN: Acceder a la propiedad correcta que envía el backend
    const userBusinesses = user?.business_memberships || []

    // 🔍 Debug logs
    console.log('🔍 [SelectBusiness] user:', user)
    console.log('🔍 [SelectBusiness] userBusinesses:', userBusinesses)

    // ✅ FUNCIÓN PARA DETERMINAR RUTA SEGÚN ROL
    const getDashboardPath = (membershipRole) => {
        const role = membershipRole?.toUpperCase() || ''

        console.log('🎭 [SelectBusiness] Determinando ruta para rol:', role)

        switch (role) {
            case 'ADMIN':
            case 'OWNER':
            case 'MANAGER':
                return '/business/dashboard'

            case 'CAJERO':
                return '/cajero/dashboard'

            case 'VENDEDOR':
                return '/vendedor/dashboard'

            case 'CONTADOR':
                return '/contador/dashboard'

            case 'INVENTARIO':
                return '/inventario/dashboard'

            case 'SOPORTE':
            case 'TECNICO':
                return '/soporte/dashboard'

            default:
                console.log('⚠️ Rol no reconocido:', role, '- Usando /business/dashboard')
                return '/business/dashboard'
        }
    }

    // ✅ REDIRECCIÓN AUTOMÁTICA SI SOLO TIENE UN NEGOCIO
    useEffect(() => {
        if (!loading && userBusinesses.length === 1) {
            const business = userBusinesses[0]
            const membershipRole = business.membership_role

            console.log('🚀 [SelectBusiness] Solo 1 negocio detectado')
            console.log('🎭 [SelectBusiness] Rol:', membershipRole)

            const targetPath = getDashboardPath(membershipRole)
            console.log('🎯 [SelectBusiness] Redirigiendo automáticamente a:', targetPath)

            navigate(targetPath, { replace: true })
        }
    }, [loading, userBusinesses, navigate])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Si no tiene negocios asignados
    if (userBusinesses.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Sin Negocios Asignados</CardTitle>
                        <CardDescription>
                            Contacta al administrador para recibir acceso
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button variant="outline" onClick={() => window.location.href = '/login'}>
                            Volver al Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const handleSelectBusiness = () => {
        if (!selectedBusinessId) return

        const business = userBusinesses.find(b =>
            b.id === selectedBusinessId || b.business === selectedBusinessId
        )

        if (business) {
            // ✅ DETERMINAR RUTA SEGÚN EL ROL DEL NEGOCIO SELECCIONADO
            const membershipRole = business.membership_role
            const targetPath = getDashboardPath(membershipRole)

            console.log('🚀 [SelectBusiness] Negocio seleccionado:', business.business_name)
            console.log('🎭 [SelectBusiness] Rol:', membershipRole)
            console.log('🎯 [SelectBusiness] Redirigiendo a:', targetPath)

            navigate(targetPath, { replace: true })
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">Selecciona tu Negocio</CardTitle>
                    <CardDescription>
                        Tienes acceso a {userBusinesses.length} negocio{userBusinesses.length > 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Lista de negocios */}
                    <div className="space-y-3">
                        {userBusinesses.map((biz) => {
                            const bizId = biz.business || biz.id
                            const isSelected = selectedBusinessId === bizId

                            return (
                                <button
                                    key={bizId}
                                    onClick={() => setSelectedBusinessId(bizId)}
                                    className={`w-full p-4 border rounded-lg text-left transition-all ${isSelected
                                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                                        : 'hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600' : 'bg-gray-100'
                                                }`}>
                                                <Building2 className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {biz.business_name || 'Negocio'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Rol: {biz.membership_role || 'Miembro'}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Botón de continuar - Habilitado solo si hay selección */}
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleSelectBusiness}
                        disabled={!selectedBusinessId}
                    >
                        Continuar al Dashboard
                    </Button>

                    {/* Info de usuario */}
                    <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                        <p>Conectado como: <span className="font-medium text-gray-900">{user?.email}</span></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}