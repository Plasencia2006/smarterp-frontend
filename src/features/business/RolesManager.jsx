// src/features/business/RolesManager.jsx

import { useQuery } from '@tanstack/react-query'
import { businessAPI } from '@/services/django.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Loader2, Check } from 'lucide-react'

export default function RolesManager() {
    const { data: roles, isLoading } = useQuery({
        queryKey: ['business-roles'],
        queryFn: async () => {
            const res = await businessAPI.getRoles()
            return res.data
        }
    })

    const { data: permissions } = useQuery({
        queryKey: ['business-permissions'],
        queryFn: async () => {
            const res = await businessAPI.getPermissions()
            return res.data
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
                <p className="text-muted-foreground mt-1">
                    Crea y administra roles con permisos personalizados
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles?.map((role) => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{role.name}</CardTitle>
                                        <CardDescription>{role.description}</CardDescription>
                                    </div>
                                </div>
                                {role.is_default && (
                                    <Badge variant="secondary">Por defecto</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Check className="w-4 h-4" />
                                <span>{role.permissions_count || role.permissions?.length} permisos</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}