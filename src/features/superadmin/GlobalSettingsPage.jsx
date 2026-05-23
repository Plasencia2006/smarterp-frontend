// src/features/superadmin/GlobalSettingsPage.jsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsAPI } from '@services/django.api'
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card'
import { Label } from '@components/ui/label'
import { Switch } from '@components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { Badge } from '@components/ui/badge'
import {
    Globe, Shield, Mail, Server, Clock, DollarSign,
    Save, RotateCcw, Check, AlertCircle, Database,
    HardDrive, Cpu, MemoryStick
} from 'lucide-react'
import { toast } from 'sonner'

export const GlobalSettingsPage = () => {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('general')
    const [settings, setSettings] = useState({})
    const [systemInfo, setSystemInfo] = useState(null)

    // Fetch configuración real del backend
    const { data: configData, isLoading: loadingSettings } = useQuery({
        queryKey: ['global-settings'],
        queryFn: async () => {
            const response = await settingsAPI.getGlobal()
            return response.data
        }
    })

    // Fetch información del sistema
    const { data: sysInfo, isLoading: loadingSystem } = useQuery({
        queryKey: ['system-info'],
        queryFn: async () => {
            const response = await settingsAPI.getSystemInfo()
            return response.data
        }
    })

    // Update settings
    const updateMutation = useMutation({
        mutationFn: (data) => settingsAPI.updateGlobal(data),
        onSuccess: () => {
            toast.success('Configuración guardada exitosamente')
            queryClient.invalidateQueries(['global-settings'])
        }
    })

    useEffect(() => {
        if (configData) {
            setSettings(configData)
        }
        if (sysInfo) {
            setSystemInfo(sysInfo)
        }
    }, [configData, sysInfo])

    const handleSave = () => {
        updateMutation.mutate(settings)
    }

    if (loadingSettings || loadingSystem) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando configuración del sistema...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Globe className="w-8 h-8 text-primary" />
                    Configuración Global
                </h1>
                <p className="text-muted-foreground mt-1">
                    Ajustes reales del sistema SMART ERP
                </p>
            </div>

            {/* Información del Sistema en Tiempo Real */}
            {systemInfo && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemInfo.resources?.cpu_usage}%</div>
                            <div className="text-xs text-muted-foreground">
                                {systemInfo.resources?.memory_used} GB / {systemInfo.resources?.memory_total} GB RAM
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemInfo.database?.version?.split(' ')[0]}</div>
                            <div className="text-xs text-muted-foreground">
                                {systemInfo.database?.users_count} usuarios
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemInfo.resources?.disk_percent}%</div>
                            <div className="text-xs text-muted-foreground">
                                {systemInfo.resources?.disk_used} GB usados
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Servidor</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-bold truncate">{systemInfo.server?.hostname}</div>
                            <div className="text-xs text-muted-foreground">
                                {systemInfo.server?.os}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs de Configuración */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Seguridad</TabsTrigger>
                    <TabsTrigger value="email">Correo</TabsTrigger>
                    <TabsTrigger value="system">Sistema</TabsTrigger>
                    <TabsTrigger value="database">BD</TabsTrigger>
                </TabsList>

                {/* Generales */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Sistema</CardTitle>
                            <CardDescription>
                                Configuración básica de la plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre del Sitio</Label>
                                    <Input
                                        value={settings.general?.site_name || ''}
                                        onChange={e => setSettings({
                                            ...settings,
                                            general: { ...settings.general, site_name: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Zona Horaria</Label>
                                    <Input
                                        value={settings.general?.timezone || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Versión del Sistema</Label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">v{settings.general?.version || '1.0.0'}</Badge>
                                    {settings.general?.debug && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                            Desarrollo
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Seguridad */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Configuración de Seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Longitud mínima de contraseña</Label>
                                <Input
                                    type="number"
                                    value={settings.security?.password_min_length || 8}
                                    onChange={e => setSettings({
                                        ...settings,
                                        security: { ...settings.security, password_min_length: parseInt(e.target.value) }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Timeout de sesión (minutos)</Label>
                                <Input
                                    type="number"
                                    value={settings.security?.session_timeout || 60}
                                    onChange={e => setSettings({
                                        ...settings,
                                        security: { ...settings.security, session_timeout: parseInt(e.target.value) }
                                    })}
                                />
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <Label className="text-sm font-semibold">Hosts Permitidos</Label>
                                <div className="mt-2 space-y-1">
                                    {settings.security?.allowed_hosts?.map((host, idx) => (
                                        <Badge key={idx} variant="outline" className="mr-2 mb-2">
                                            {host}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Correo */}
                <TabsContent value="email" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Configuración de Correo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Servidor SMTP</Label>
                                    <Input
                                        value={settings.email?.email_host || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Puerto</Label>
                                    <Input
                                        value={settings.email?.email_port || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email de envío</Label>
                                <Input
                                    value={settings.email?.email_from || ''}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                                {settings.email?.email_enabled ? (
                                    <>
                                        <Check className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-600">Servicio de correo habilitado</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-600">Servicio de correo deshabilitado</span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sistema */}
                <TabsContent value="system" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="w-5 h-5" />
                                Configuración del Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tamaño máximo de archivo (MB)</Label>
                                <Input
                                    value={settings.system?.max_upload_size || 10}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Media Root</Label>
                                <Input
                                    value={settings.system?.media_root || ''}
                                    disabled
                                    className="bg-muted font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Static Root</Label>
                                <Input
                                    value={settings.system?.static_root || ''}
                                    disabled
                                    className="bg-muted font-mono text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Base de Datos */}
                <TabsContent value="database" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Configuración de Base de Datos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Motor</Label>
                                    <Input
                                        value={settings.database?.engine || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Base de Datos</Label>
                                    <Input
                                        value={settings.database?.name || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Host</Label>
                                    <Input
                                        value={settings.database?.host || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Puerto</Label>
                                    <Input
                                        value={settings.database?.port || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-primary">
                                            {systemInfo?.database?.users_count || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Usuarios</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">
                                            {systemInfo?.database?.businesses_count || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Negocios</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-primary">
                                            {systemInfo?.database?.memberships_count || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Membresías</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Botones de acción */}
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </Tabs>
        </div>
    )
}

export default GlobalSettingsPage