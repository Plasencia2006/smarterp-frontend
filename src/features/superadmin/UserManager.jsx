import { useQuery } from '@tanstack/react-query'
import { usersAPI } from '@services/django.api'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Users, Mail } from 'lucide-react'

export const UserManager = () => {
    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await usersAPI.list()
            return response.data
        },
    })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>

            {isLoading ? (
                <p>Cargando...</p>
            ) : (
                <div className="grid gap-4">
                    {users?.map((user) => (
                        <Card key={user.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>{user.username}</CardTitle>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default UserManager