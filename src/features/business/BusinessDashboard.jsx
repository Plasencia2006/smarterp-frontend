// src/features/business/BusinessDashboard.jsx

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { businessAPI } from '@services/django.api'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Button } from '@components/ui/button'
import { Building2, Users, Package, TrendingUp, ArrowLeft } from 'lucide-react'

export const BusinessDashboard = () => {
    const { businessId } = useParams()
    const navigate = useNavigate()

    const { data: business, isLoading, error } = useQuery({
        queryKey: ['business', businessId],
        queryFn: async () => {
            const response = await businessAPI.get(businessId)
            return response.data
        },
        enabled: !!businessId
    })

    if (isLoading) return <div className="p-6">Cargando negocio...</div>
    if (error) return <div className="p-6 text-destructive">Error al cargar el negocio</div>

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate('/select-business')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cambiar Negocio
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{business?.name}</h1>
                        <p className="text-muted-foreground capitalize">
                            {business?.type} • {business?.is_active ? 'Activo' : 'Inactivo'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Miembros</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{business?.total_members || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Productos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ventas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Estado</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">
                            {business?.is_active ? 'Activo' : 'Inactivo'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Business Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {business?.description && (
                        <p className="text-muted-foreground">{business.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {business?.email && (
                            <div>
                                <span className="text-muted-foreground">Email:</span>
                                <p>{business.email}</p>
                            </div>
                        )}
                        {business?.phone && (
                            <div>
                                <span className="text-muted-foreground">Teléfono:</span>
                                <p>{business.phone}</p>
                            </div>
                        )}
                        {business?.address && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Dirección:</span>
                                <p>{business.address}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button variant="outline">Gestionar Miembros</Button>
                    <Button variant="outline">Inventario</Button>
                    <Button variant="outline">Ventas </Button>
                    <Button variant="outline">Reportes</Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default BusinessDashboard