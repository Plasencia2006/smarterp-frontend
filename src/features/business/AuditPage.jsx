import { Card, CardContent } from '@/components/ui/card'
import { Wrench } from 'lucide-react'

export default function AuditPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                                <Wrench className="w-12 h-12 text-blue-600 dark:text-blue-300" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Módulo en Desarrollo
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            El módulo de Auditoría estará disponible próximamente.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Estamos trabajando para traerte las mejores funcionalidades.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}