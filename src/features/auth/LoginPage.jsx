// src/features/auth/LoginPage.jsx

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

            // ✅ NAVEGACIÓN INMEDIATA - Sin toast que pueda causar delay
            const targetUser = result.user
            const primaryRole = targetUser.roles?.[0]?.name?.toLowerCase() || ''

            // Determinar destino
            if (targetUser.is_super_admin) {
                window.location.href = '/superadmin/dashboard'  // ← Forzar recarga
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

        } catch (err) {
            console.error('❌ Error en login:', err)
            toast.error('Error de conexión con el servidor')
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