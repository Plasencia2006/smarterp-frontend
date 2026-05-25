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
import { Separator } from '@components/ui/separator'
import {
    Globe, Shield, Mail, Server, Moon, Sun, Monitor,
    Palette, Bell, Save, RotateCcw, Database,
    HardDrive, Cpu
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@hooks/useTheme'

export const GlobalSettingsPage = () => {
    const queryClient = useQueryClient()
    const [settings, setSettings] = useState({})
    const [systemInfo, setSystemInfo] = useState(null)
    const { theme, setTheme } = useTheme()

    // Fetch configuración
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
        if (configData) setSettings(configData)
        if (sysInfo) setSystemInfo(sysInfo)
    }, [configData, sysInfo])

    const handleSave = () => {
        updateMutation.mutate(settings)
    }

    const changeTheme = (newTheme) => {
        setTheme(newTheme)
        toast.success(`Tema cambiado a ${newTheme === 'dark' ? 'oscuro' : newTheme === 'light' ? 'claro' : 'sistema'}`)
    }

    if (loadingSettings || loadingSystem) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando configuración...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10 max-w-5xl mx-auto">
            {/* Header Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configuración Global</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona la configuración, seguridad y apariencia del sistema
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restaurar
                    </Button>
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {/* Stats del Sistema */}
            {systemInfo && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemInfo.resources?.cpu_usage}%</div>
                            <p className="text-xs text-muted-foreground mt-1">{systemInfo.resources?.memory_used} GB RAM</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemInfo.database?.version?.split(' ')[0]}</div>
                            <p className="text-xs text-muted-foreground mt-1">{systemInfo.database?.users_count} usuarios</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{systemInfo.resources?.disk_percent}%</div>
                            <p className="text-xs text-muted-foreground mt-1">{systemInfo.resources?.disk_used} GB usados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Servidor</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold truncate">{systemInfo.server?.hostname}</div>
                            <p className="text-xs text-muted-foreground mt-1">{systemInfo.server?.os}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Separator />

            {/* 🔷 SECCIÓN: GENERAL */}
            <Card id="general" className="scroll-mt-8">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>Configuración básica de la plataforma SMART ERP</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="siteName">Nombre del Sitio</Label>
                            <Input
                                id="siteName"
                                value={settings.general?.site_name || ''}
                                onChange={e => setSettings({ ...settings, general: { ...settings.general, site_name: e.target.value } })}
                                placeholder="SMART ERP"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Zona Horaria</Label>
                            <Select value={settings.general?.timezone || 'America/Lima'} onValueChange={v => setSettings({ ...settings, general: { ...settings.general, timezone: v } })}>
                                <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="America/Lima">Lima (PET)</SelectItem>
                                    <SelectItem value="America/Bogota">Bogotá (COT)</SelectItem>
                                    <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción del Sitio</Label>
                        <Input id="description" value={settings.general?.site_description || ''} onChange={e => setSettings({ ...settings, general: { ...settings.general, site_description: e.target.value } })} placeholder="Sistema de gestión empresarial" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="language">Idioma</Label>
                            <Select value={settings.general?.language || 'es'} onValueChange={v => setSettings({ ...settings, general: { ...settings.general, language: v } })}>
                                <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="es">Español</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="pt">Português</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateFormat">Formato de Fecha</Label>
                            <Select value={settings.general?.date_format || 'DD/MM/YYYY'} onValueChange={v => setSettings({ ...settings, general: { ...settings.general, date_format: v } })}>
                                <SelectTrigger id="dateFormat"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Modo Desarrollo</Label>
                            <p className="text-sm text-muted-foreground">Habilitar debugging y logs detallados</p>
                        </div>
                        <Switch checked={settings.general?.debug || false} onCheckedChange={v => setSettings({ ...settings, general: { ...settings.general, debug: v } })} />
                    </div>
                </CardContent>
            </Card>

            {/* 🔷 SECCIÓN: APARIENCIA */}
            <Card id="appearance" className="scroll-mt-8">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <CardTitle>Apariencia y Tema</CardTitle>
                            <CardDescription>Personaliza cómo se ve y se comporta la interfaz</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Tema de Color</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => changeTheme('light')} className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                                <Sun className="h-6 w-6" /><span className="text-sm font-medium">Claro</span>
                            </button>
                            <button onClick={() => changeTheme('dark')} className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                                <Moon className="h-6 w-6" /><span className="text-sm font-medium">Oscuro</span>
                            </button>
                            <button onClick={() => changeTheme('system')} className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                                <Monitor className="h-6 w-6" /><span className="text-sm font-medium">Sistema</span>
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">Tema actual: <span className="font-medium capitalize">{theme}</span></p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <Label className="text-base font-medium">Notificaciones</Label>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    <div><p className="font-medium">Notificaciones Push</p><p className="text-sm text-muted-foreground">Mostrar notificaciones en el navegador</p></div>
                                </div>
                                <Switch checked={settings.notifications?.push || false} />
                            </div>
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div><p className="font-medium">Notificaciones por Email</p><p className="text-sm text-muted-foreground">Enviar notificaciones importantes por correo</p></div>
                                </div>
                                <Switch checked={settings.notifications?.email || false} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🔷 SECCIÓN: SEGURIDAD */}
            <Card id="security" className="scroll-mt-8">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <CardTitle>Seguridad</CardTitle>
                            <CardDescription>Configura las políticas de acceso y protección</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="passwordLength">Longitud mínima de contraseña</Label>
                        <Input id="passwordLength" type="number" min="6" max="128" value={settings.security?.password_min_length || 8} onChange={e => setSettings({ ...settings, security: { ...settings.security, password_min_length: parseInt(e.target.value) } })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Timeout de sesión (minutos)</Label>
                        <Input id="sessionTimeout" type="number" min="5" max="480" value={settings.security?.session_timeout || 60} onChange={e => setSettings({ ...settings, security: { ...settings.security, session_timeout: parseInt(e.target.value) } })} />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Autenticación de dos factores</Label>
                                <p className="text-sm text-muted-foreground">Requerir 2FA para todos los usuarios</p>
                            </div>
                            <Switch checked={settings.security?.two_factor_enabled || false} onCheckedChange={v => setSettings({ ...settings, security: { ...settings.security, two_factor_enabled: v } })} />
                        </div>
                        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Lista blanca de IPs</Label>
                                <p className="text-sm text-muted-foreground">Solo permitir acceso desde IPs específicas</p>
                            </div>
                            <Switch checked={settings.security?.ip_whitelist_enabled || false} onCheckedChange={v => setSettings({ ...settings, security: { ...settings.security, ip_whitelist_enabled: v } })} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🔷 SECCIÓN: CORREO */}
            <Card id="email" className="scroll-mt-8">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <CardTitle>Configuración de Correo</CardTitle>
                            <CardDescription>Servidor SMTP para envío de emails y notificaciones</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-muted/50">
                        <div className="space-y-0.5">
                            <Label className="text-base">Habilitar envío de correos</Label>
                            <p className="text-sm text-muted-foreground">Activar notificaciones por email</p>
                        </div>
                        <Switch checked={settings.email?.email_enabled || false} onCheckedChange={v => setSettings({ ...settings, email: { ...settings.email, email_enabled: v } })} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="smtpHost">Servidor SMTP</Label>
                            <Input id="smtpHost" value={settings.email?.email_host || ''} onChange={e => setSettings({ ...settings, email: { ...settings.email, email_host: e.target.value } })} placeholder="smtp.gmail.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPort">Puerto</Label>
                            <Input id="smtpPort" type="number" value={settings.email?.email_port || 587} onChange={e => setSettings({ ...settings, email: { ...settings.email, email_port: parseInt(e.target.value) } })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="emailFrom">Email de envío</Label>
                        <Input id="emailFrom" value={settings.email?.email_from || ''} onChange={e => setSettings({ ...settings, email: { ...settings.email, email_from: e.target.value } })} placeholder="noreply@smarterp.com" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="smtpUser">Usuario SMTP</Label>
                            <Input id="smtpUser" value={settings.email?.email_user || ''} onChange={e => setSettings({ ...settings, email: { ...settings.email, email_user: e.target.value } })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPassword">Contraseña SMTP</Label>
                            <Input id="smtpPassword" type="password" value={settings.email?.email_password || ''} onChange={e => setSettings({ ...settings, email: { ...settings.email, email_password: e.target.value } })} placeholder="••••••••" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🔷 SECCIÓN: SISTEMA */}
            <Card id="system" className="scroll-mt-8">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Server className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <CardTitle>Configuración del Sistema</CardTitle>
                            <CardDescription>Ajustes avanzados de rendimiento y mantenimiento</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="maxUpload">Tamaño máximo de archivo (MB)</Label>
                        <Input id="maxUpload" type="number" min="1" max="100" value={settings.system?.max_upload_size || 10} onChange={e => setSettings({ ...settings, system: { ...settings.system, max_upload_size: parseInt(e.target.value) } })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="backupFreq">Frecuencia de backups automáticos</Label>
                        <Select value={settings.system?.backup_frequency || 'daily'} onValueChange={v => setSettings({ ...settings, system: { ...settings.system, backup_frequency: v } })}>
                            <SelectTrigger id="backupFreq"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Cada hora</SelectItem>
                                <SelectItem value="daily">Diario</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logRetention">Días de retención de logs</Label>
                        <Input id="logRetention" type="number" min="7" max="365" value={settings.system?.log_retention_days || 30} onChange={e => setSettings({ ...settings, system: { ...settings.system, log_retention_days: parseInt(e.target.value) } })} />
                    </div>
                </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Restaurar
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="min-w-[140px]">
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    )
}

export default GlobalSettingsPage