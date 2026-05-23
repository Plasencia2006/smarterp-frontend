import { Card, CardContent, CardTitle } from '@components/ui/card'
import { Button } from '@components/ui/button'
import { authStore } from '@store/authStore'

export const NoBusinessAccessPage = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
            <CardTitle className="text-xl mb-4">Acceso Restringido</CardTitle>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    No tienes negocios asignados. Contacta al administrador para obtener acceso.
                </p>
                <Button onClick={() => authStore().logout()}>Cerrar Sesión</Button>
            </CardContent>
        </Card>
    </div>
)
export default NoBusinessAccessPage