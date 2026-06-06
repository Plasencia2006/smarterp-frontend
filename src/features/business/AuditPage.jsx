// src/features/business/AuditPage.jsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, User, Clock } from 'lucide-react'

export default function AuditPage() {
    const auditLogs = [
        { id: 1, action: 'Usuario creado', user: 'admin@techzone.com', timestamp: '2026-01-15 10:30:00', type: 'success' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Auditoría</h1>
                <p className="text-muted-foreground mt-1">
                    Registro de actividades del negocio
                </p>
            </div>

            <div className="space-y-4">
                {auditLogs.map((log) => (
                    <Card key={log.id}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{log.action}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {log.user}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {log.timestamp}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Badge variant={log.type === 'error' ? 'destructive' : 'secondary'}>
                                    {log.type}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}