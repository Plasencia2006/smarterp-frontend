import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    DollarSign, ShoppingCart, Clock, CheckCircle2, XCircle,
    TrendingUp, Lock, Unlock, FileText, Search, ArrowRight,
    AlertTriangle, Wallet, BarChart3, Receipt
} from 'lucide-react'

export default function CajeroDashboard() {
    const navigate = useNavigate()

    // Obtener turno activo
    const { data: activeRegister, isLoading: loadingRegister, refetch: refetchRegister } = useQuery({
        queryKey: ['active-register'],
        queryFn: async () => {
            const res = await cashierAPI.getActiveRegister()
            return res.data?.success ? res.data.data : null
        }
    })

    // Obtener dashboard
    const { data: dashboard } = useQuery({
        queryKey: ['cajero-dashboard'],
        queryFn: async () => {
            const res = await cashierAPI.getDashboard()
            return res.data?.success ? res.data.data : null
        },
        refetchInterval: 30000
    })

    const isRegisterOpen = activeRegister?.status === 'ABIERTO'

    const menuOptions = [
        {
            title: 'Procesar Pago',
            description: 'Cobrar cotización pendiente',
            icon: DollarSign,
            color: 'bg-green-500',
            path: '/cajero/procesar-pago',
            requiresRegister: true
        },
        {
            title: 'Gestión de Facturas',
            description: 'Ver, buscar y anular facturas',
            icon: FileText,
            color: 'bg-blue-500',
            path: '/cajero/facturas',
            requiresRegister: true
        },
        {
            title: 'Arqueos de Caja',
            description: 'Realizar auditorías de efectivo',
            icon: Search,
            color: 'bg-purple-500',
            path: '/cajero/arqueos',
            requiresRegister: true
        },
        {
            title: 'Retiros de Efectivo',
            description: 'Solicitar retiros a caja fuerte',
            icon: Wallet,
            color: 'bg-orange-500',
            path: '/cajero/retiros',
            requiresRegister: true
        },
        {
            title: 'Flujo de Efectivo',
            description: 'Resumen de movimientos',
            icon: BarChart3,
            color: 'bg-indigo-500',
            path: '/cajero/flujo-efectivo',
            requiresRegister: true
        },
        {
            title: 'Registrar Egreso',
            description: 'Registrar gastos menores',
            icon: XCircle,
            color: 'bg-red-500',
            path: '/cajero/egreso',
            requiresRegister: true
        }
    ]

    const handleNavigate = (path, requiresRegister) => {
        if (requiresRegister && !isRegisterOpen) {
            toast.error('⚠️ Debes abrir caja primero')
            return
        }
        navigate(path)
    }

    if (loadingRegister) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel del Cajero</h1>
                        <p className="text-muted-foreground">Gestión de caja y facturación</p>
                    </div>
                </div>

                {/* Estado de Caja */}
                <Card className={isRegisterOpen
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
                    : 'border-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30'
                }>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-full ${isRegisterOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isRegisterOpen ? (
                                        <Unlock className="w-8 h-8 text-white" />
                                    ) : (
                                        <Lock className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {isRegisterOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                                    </h2>
                                    {isRegisterOpen ? (
                                        <div className="space-y-1 mt-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Apertura: {new Date(activeRegister.openingTime).toLocaleString('es-PE')}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Efectivo inicial: <span className="font-bold">S/ {activeRegister.initialCash?.toFixed(2)}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Debes abrir caja para realizar operaciones
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!isRegisterOpen ? (
                                    <Button onClick={() => navigate('/cajero/apertura')} className="bg-green-600 hover:bg-green-700">
                                        <Unlock className="w-4 h-4 mr-2" />
                                        Abrir Caja
                                    </Button>
                                ) : (
                                    <Button onClick={() => navigate('/cajero/cierre')} className="bg-red-600 hover:bg-red-700">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Cerrar Caja
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Estadísticas del Turno */}
                {isRegisterOpen && dashboard && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                        <ShoppingCart className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ventas</p>
                                        <p className="text-2xl font-bold">{dashboard.totalVentas || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <DollarSign className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ingresos</p>
                                        <p className="text-2xl font-bold">S/ {(dashboard.totalIngresos || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Egresos</p>
                                        <p className="text-2xl font-bold">S/ {(dashboard.totalEgresos || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                        <Wallet className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">En Caja</p>
                                        <p className="text-2xl font-bold">S/ {(dashboard.efectivoEnCaja || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Menú de Opciones */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Operaciones</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {menuOptions.map((option, idx) => {
                            const Icon = option.icon
                            const isDisabled = option.requiresRegister && !isRegisterOpen
                            return (
                                <Card
                                    key={idx}
                                    className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    onClick={() => handleNavigate(option.path, option.requiresRegister)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-lg ${option.color}`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">
                                            {option.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {option.description}
                                        </p>
                                        {isDisabled && (
                                            <Badge variant="destructive" className="mt-3">
                                                <Lock className="w-3 h-3 mr-1" />
                                                Abre caja primero
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}