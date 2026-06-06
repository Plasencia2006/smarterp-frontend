// src/features/business/MembersManager.jsx

import { useQuery } from '@tanstack/react-query'
import { businessAPI } from '@/services/django.api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Loader2 } from 'lucide-react'

export default function MembersManager() {
    const { data: members, isLoading } = useQuery({
        queryKey: ['business-members'],
        queryFn: async () => {
            const res = await businessAPI.getUsers()
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
                <h1 className="text-3xl font-bold text-gray-900">Miembros del Negocio</h1>
                <p className="text-muted-foreground mt-1">
                    Visualiza todos los miembros y su estado
                </p>
            </div>

            <div className="grid gap-4">
                {members?.map((member) => (
                    <Card key={member.id}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-xl font-bold text-blue-600">
                                            {member.user?.first_name?.[0] || member.user?.email?.[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {member.user?.first_name} {member.user?.last_name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                {member.user?.email}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {member.active_roles?.map((assignment) => (
                                                <Badge key={assignment.id} variant="outline">
                                                    {assignment.role.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}