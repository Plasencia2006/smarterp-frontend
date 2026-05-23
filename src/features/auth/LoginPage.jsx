import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { authStore } from '@store/authStore'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card'
// ✅ ICONOS
import { AlertCircle, Clock, PauseCircle, Trash2, Building2, Mail, Lock } from 'lucide-react'

const loginSchema = z.object({
    email: z.string().email('Email inválido').min(1, 'Email requerido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const LoginPage = () => {
    const navigate = useNavigate()
    const { login, isLoading, error, clearError } = authStore()
    const [submitError, setSubmitError] = useState(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema),
    })

    // ✅ FUNCIÓN para obtener mensaje e icono según el error
    const getErrorDetails = (errorMsg) => {
        if (!errorMsg) {
            return { message: 'Error al iniciar sesión', icon: AlertCircle, variant: 'error' }
        }

        let msg = errorMsg
        if (typeof errorMsg !== 'string') {
            if (errorMsg?.message) msg = errorMsg.message
            else if (errorMsg?.detail) msg = errorMsg.detail
            else msg = String(errorMsg)
        }

        const msgLower = msg.toLowerCase()

        if (msgLower.includes('suspendida')) {
            return { message: msg, icon: PauseCircle, variant: 'warning' }
        }
        if (msgLower.includes('inactiva')) {
            return { message: msg, icon: Clock, variant: 'info' }
        }
        if (msgLower.includes('eliminada') || msgLower.includes('desactivada')) {
            return { message: msg, icon: Trash2, variant: 'error' }
        }
        if (msgLower.includes('credenciales') || msgLower.includes('contraseña') || msgLower.includes('no se pudo')) {
            return { message: msg, icon: AlertCircle, variant: 'error' }
        }

        return { message: msg, icon: AlertCircle, variant: 'error' }
    }

    const onSubmit = async (data) => {
        setSubmitError(null)
        clearError()

        console.log('🔐 Intentando login con:', data.email)

        try {
            // ✅ Enviar credenciales al backend
            // Nota: Si tu backend espera 'username' en lugar de 'email', cambia la clave abajo
            const credentials = {
                email: data.email,      // ← Tu backend acepta email para login
                password: data.password
            }

            const result = await login(credentials)

            console.log('✅ Login exitoso. Usuario:', result.user)
            console.log('🏢 Negocios asignados:', result.user.business_memberships || result.user.memberships)

            toast.success('¡Bienvenido!')

            // ✅ REDIRECCIÓN INTELIGENTE BASADA EN NEGOCIOS
            // Priorizar business_memberships, fallback a memberships
            const userBusinesses = result.user.business_memberships || result.user.memberships || []

            if (result.user.is_super_admin) {
                // Super Admin → Dashboard global
                console.log('🚀 Redirigiendo a Super Admin Dashboard')
                navigate('/superadmin/dashboard')

            } else if (userBusinesses.length === 0) {
                // Usuario sin negocios → Página de acceso denegado
                console.log('🚀 Usuario sin negocios asignados')
                navigate('/no-business-access')

            } else if (userBusinesses.length === 1) {
                // Usuario con 1 negocio → Ir directo a ese negocio
                const businessId = userBusinesses[0].business || userBusinesses[0].id
                console.log('🚀 Redirigiendo a negocio único:', businessId)
                navigate(`/business/${businessId}/dashboard`)

            } else {
                // Usuario con múltiples negocios → Mostrar selector
                console.log('🚀 Redirigiendo a selector de negocios')
                navigate('/select-business')
            }

        } catch (err) {
            console.error('❌ Error en login:', err)
            console.error('Response data:', err.response?.data)

            // Extraer mensaje de error del backend
            const backendData = err.response?.data
            let errorMsg = 'Error al iniciar sesión. Verifica tus credenciales.'

            if (backendData?.detail?.email) {
                errorMsg = backendData.detail.email[0]
            } else if (backendData?.detail?.password) {
                errorMsg = backendData.detail.password[0]
            } else if (backendData?.non_field_errors) {
                errorMsg = Array.isArray(backendData.non_field_errors)
                    ? backendData.non_field_errors[0]
                    : String(backendData.non_field_errors)
            } else if (backendData?.detail && typeof backendData.detail === 'string') {
                errorMsg = backendData.detail
            } else if (err.response?.status === 401) {
                errorMsg = 'Credenciales incorrectas. Verifica tu email y contraseña.'
            } else if (err.response?.status === 400) {
                errorMsg = typeof backendData === 'object'
                    ? JSON.stringify(backendData)
                    : 'Datos inválidos.'
            }

            setSubmitError(errorMsg)
            toast.error(errorMsg)
        }
    }

    // ✅ Obtener detalles del error para UI dinámica
    const errorDetails = (submitError || error) ? getErrorDetails(submitError || error) : null

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-2xl">SMART ERP</CardTitle>
                    </div>
                    <CardDescription>
                        Ingresa tus credenciales para acceder
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* ✅ MENSAJE DE ERROR CON ICONO Y COLOR DINÁMICO */}
                        {errorDetails && (
                            <div className={`p-3 rounded-md border text-sm flex items-start gap-2 ${errorDetails.variant === 'warning'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : errorDetails.variant === 'info'
                                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                                        : 'bg-destructive/10 border-destructive/30 text-destructive'
                                }`}>
                                <errorDetails.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 break-words">
                                    <span>{errorDetails.message}</span>
                                    {(errorDetails.variant === 'warning' || errorDetails.variant === 'info') && (
                                        <div className="mt-1 pt-1 border-t border-current/20">
                                            <a
                                                href="mailto:soporte@smarterp.com"
                                                className="text-xs underline hover:no-underline font-medium"
                                            >
                                                Contactar soporte
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@empresa.com"
                                    className="pl-10"
                                    {...register('email')}
                                    disabled={isLoading || isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    {...register('password')}
                                    disabled={isLoading || isSubmitting}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || isSubmitting}
                        >
                            {(isLoading || isSubmitting) ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Iniciando...
                                </span>
                            ) : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Regístrate
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default LoginPage