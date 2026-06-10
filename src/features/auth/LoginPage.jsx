import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Mail, Lock, Loader2 } from 'lucide-react'

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const LoginPage = () => {
    const navigate = useNavigate()
    const { login, loading } = useAuth()

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data) => {
    try {
        const result = await login(data.email, data.password)

        if (!result.success) {
            toast.error(result.error || 'Credenciales incorrectas')
            return
        }

        const targetUser = result.user
        
        console.log('\n' + '='.repeat(80))
        console.log('🎯 USUARIO LOGUEADO:')
        console.log('  Email:', targetUser.email)
        console.log('  is_super_admin:', targetUser.is_super_admin)
        console.log('  Memberships:', targetUser.business_memberships)
        console.log('  Roles:', targetUser.roles)
        console.log('  Permissions:', targetUser.permissions)
        console.log('='.repeat(80) + '\n')

        // 1️⃣ Super Admin
        if (targetUser.is_super_admin || targetUser.is_superuser) {
            console.log('🚀 Super Admin → /superadmin/dashboard')
            window.location.href = '/superadmin/dashboard'
            return
        }

        // 2️⃣ Verificar memberships
        const memberships = targetUser.business_memberships || []
        
        if (memberships.length === 0) {
            console.error('❌ ERROR: Usuario SIN memberships')
            toast.error('Usuario sin negocio asignado. Contacta al administrador.')
            return
        }

        // 3️⃣ Obtener el rol de la PRIMERA membership
        const membershipRole = memberships[0].membership_role?.toUpperCase() || ''
        
        console.log('📋 Membership role detectado:', membershipRole)

        // 4️⃣ Redirigir según membership_role
        switch (membershipRole) {
            case 'ADMIN':
            case 'OWNER':
            case 'MANAGER':
                console.log('🏢 Admin → /business/dashboard')
                window.location.href = '/business/dashboard'
                break
            
            case 'CAJERO':
                console.log('💵 Cajero → /cajero/dashboard')
                window.location.href = '/cajero/dashboard'
                break
            
            case 'VENDEDOR':
                console.log('💰 Vendedor → /vendedor/dashboard')
                window.location.href = '/vendedor/dashboard'
                break
            
            case 'CONTADOR':
                console.log('📊 Contador → /contador/dashboard')
                window.location.href = '/contador/dashboard'
                break
            
            case 'INVENTARIO':
                console.log('📦 Inventario → /inventario/dashboard')
                window.location.href = '/inventario/dashboard'
                break
            
            case 'SOPORTE':
            case 'TECNICO':
                console.log('🔧 Soporte → /soporte/dashboard')
                window.location.href = '/soporte/dashboard'
                break
            
            default:
                console.log('⚠️ Rol no reconocido:', membershipRole)
                console.log('🔄 Redirigiendo a /business/dashboard por defecto')
                window.location.href = '/business/dashboard'
        }

    } catch (err) {
        console.error('❌ Error en login:', err)
        toast.error('Error de conexión con el servidor')
    }
}

    // ✅ DETERMINAR ROL PRINCIPAL
    const determineMainRole = (user) => {
        const memberships = user.business_memberships || []
        const roles = user.roles || []
        const permissions = user.permissions || []

        // Prioridad 1: Verificar membership_role
        if (memberships.length > 0) {
            const membershipRole = memberships[0].membership_role?.toUpperCase()
            if (membershipRole) {
                console.log('📌 Rol desde membership:', membershipRole)
                return membershipRole
            }
        }

        // Prioridad 2: Verificar roles asignados
        if (roles.length > 0) {
            const roleName = roles[0].name?.toUpperCase()
            if (roleName) {
                console.log('📌 Rol desde roles:', roleName)
                return roleName
            }
        }

        // Prioridad 3: Verificar permisos
        if (permissions.length > 0) {
            const permissionCodes = permissions.map(p => p.code?.toLowerCase() || '')

            if (permissionCodes.some(p => p.includes('caja') || p.includes('cashier'))) {
                console.log('📌 Rol desde permisos: CAJERO')
                return 'CAJERO'
            }
            if (permissionCodes.some(p => p.includes('ventas') || p.includes('sales'))) {
                console.log('📌 Rol desde permisos: VENDEDOR')
                return 'VENDEDOR'
            }
            if (permissionCodes.some(p => p.includes('inventario') || p.includes('inventory'))) {
                console.log('📌 Rol desde permisos: INVENTARIO')
                return 'INVENTARIO'
            }
            if (permissionCodes.some(p => p.includes('contabilidad') || p.includes('accounting'))) {
                console.log('📌 Rol desde permisos: CONTADOR')
                return 'CONTADOR'
            }
            if (permissionCodes.some(p => p.includes('soporte') || p.includes('support'))) {
                console.log('📌 Rol desde permisos: SOPORTE')
                return 'SOPORTE'
            }
        }

        console.log('📌 Rol por defecto: ADMIN (sin rol específico)')
        return 'ADMIN' // Por defecto, admin del negocio
    }

    // ✅ REDIRECCIÓN SEGÚN ROL
    const redirectToPanel = (role, user) => {
        console.log('🎯 Redirigiendo rol:', role)

        switch (role) {
            case 'ADMIN':
            case 'OWNER':
            case 'MANAGER':
                console.log('🏢 Admin del negocio → /business/dashboard')
                window.location.href = '/business/dashboard'
                break

            case 'CAJERO':
                console.log('💵 Cajero → /cajero/dashboard')
                window.location.href = '/cajero/dashboard'
                break

            case 'VENDEDOR':
                console.log('💰 Vendedor → /vendedor/dashboard')
                window.location.href = '/vendedor/dashboard'
                break

            case 'CONTADOR':
                console.log('📊 Contador → /contador/dashboard')
                window.location.href = '/contador/dashboard'
                break

            case 'INVENTARIO':
                console.log('📦 Inventario → /inventario/dashboard')
                window.location.href = '/inventario/dashboard'
                break

            case 'SOPORTE':
            case 'TECNICO':
                console.log('🔧 Soporte → /soporte/dashboard')
                window.location.href = '/soporte/dashboard'
                break

            default:
                // Si no tiene rol específico, redirigir al dashboard del negocio
                console.log('🔄 Rol no reconocido → /business/dashboard')
                window.location.href = '/business/dashboard'
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">SMART ERP</CardTitle>
                    <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@techzone.com"
                                    className="pl-10"
                                    {...register('email')}
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    {...register('password')}
                                    disabled={loading}
                                />
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                            ) : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center border-t pt-4 bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-blue-600 hover:underline font-medium">
                            Regístrate
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default LoginPage