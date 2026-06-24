import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Search, FileText, Eye, Download, Printer,
    Calendar, User, DollarSign, CreditCard, Loader2,
    ArrowLeft, TrendingUp, Package
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function GestionFacturas() {
    const navigate = useNavigate()
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],  // Hoy por defecto
        endDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        customerName: '',
        paymentMethod: ''
    })

    // ✅ Cargar facturas automáticamente al montar el componente
    const { data: invoices, isLoading, refetch } = useQuery({
        queryKey: ['invoices', filters],
        queryFn: async () => {
            console.log('🔍 Buscando facturas con filtros:', filters)
            const res = await cashierAPI.getInvoices(filters)
            console.log('📄 Respuesta de facturas:', res.data)
            return res.data?.success ? res.data.data : []
        },
        enabled: true,  // ✅ Cargar automáticamente
        staleTime: 5000  // Cache por 5 segundos
    })

    const handleSearch = () => {
        console.log('🔍 Buscando facturas...')
        refetch()
    }

    const handleClearFilters = () => {
        setFilters({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            invoiceNumber: '',
            customerName: '',
            paymentMethod: ''
        })
        refetch()
    }

    const handleViewInvoice = async (invoice) => {
        console.log('👁️ Viendo factura:', invoice)
        console.log('📋 Invoice ID:', invoice.id)

        if (!invoice.id) {
            toast.error('❌ ID de factura no válido')
            return
        }

        try {
            console.log('📡 Llamando a cashierAPI.generateInvoicePdf...')

            // Hacer la petición manualmente para más control
            const response = await fetch(`http://localhost:8080/api/sales/quotes/${invoice.id}/invoice/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Business-ID': localStorage.getItem('businessId') || ''
                }
            })

            console.log('📊 Response status:', response.status)
            console.log('📊 Response ok:', response.ok)
            console.log('📊 Response headers:', [...response.headers.entries()])

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            // Obtener el blob
            const blob = await response.blob()
            console.log('📊 Blob size:', blob.size, 'bytes')
            console.log('📊 Blob type:', blob.type)

            // Verificar si es un PDF válido
            if (blob.size === 0) {
                console.error('❌ El blob está vacío')
                toast.error('El PDF generado está vacío. Revisa el backend.')
                return
            }

            // Verificar que sea PDF
            if (!blob.type.includes('application/pdf') && blob.size > 0) {
                console.warn('⚠️ El blob no es application/pdf pero tiene datos')
                // Intentar forzar como PDF
            }

            // Crear URL
            const url = window.URL.createObjectURL(blob)
            console.log('🔗 URL generada:', url)

            // Intentar abrir
            const newWindow = window.open(url, '_blank')

            if (!newWindow) {
                toast.error('El navegador bloqueó la ventana emergente. Permite pop-ups para este sitio.')
                return
            }

            console.log('✅ PDF abierto en nueva pestaña')
            toast.success('Factura cargada. Si no se ve, revisa la nueva pestaña.')

            // Limpiar URL después de un tiempo
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
            }, 60000)

        } catch (error) {
            console.error('❌ Error completo:', error)
            console.error('❌ Error name:', error.name)
            console.error('❌ Error message:', error.message)

            let errorMessage = 'Error al cargar el PDF'

            if (error.message.includes('404')) {
                errorMessage = '❌ Factura no encontrada'
            } else if (error.message.includes('500')) {
                errorMessage = '❌ Error en el servidor al generar el PDF'
            } else if (error.message.includes('401')) {
                errorMessage = '❌ No autorizado. Inicia sesión nuevamente.'
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`
            }

            toast.error(errorMessage)
        }
    }

    const handlePrintInvoice = async (invoice) => {
        console.log('🖨️ Imprimiendo factura:', invoice)
        console.log('📋 Invoice ID:', invoice.id)

        if (!invoice.id) {
            toast.error('❌ ID de factura no válido')
            return
        }

        try {
            console.log('📡 Llamando a generateInvoicePdf para imprimir...')

            // Hacer la petición manualmente para más control
            const response = await fetch(`http://localhost:8080/api/sales/quotes/${invoice.id}/invoice/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Business-ID': localStorage.getItem('businessId') || ''
                }
            })

            console.log('📊 Response status:', response.status)
            console.log('📊 Response ok:', response.ok)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Error response:', errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            // Obtener el blob
            const blob = await response.blob()
            console.log('📊 Blob size:', blob.size, 'bytes')
            console.log('📊 Blob type:', blob.type)

            // Verificar si está vacío
            if (blob.size === 0) {
                console.error('❌ El blob está vacío')
                toast.error('El PDF está vacío. Revisa el backend.')
                return
            }

            // Crear URL
            const url = window.URL.createObjectURL(blob)
            console.log('🔗 URL generada:', url)

            // Abrir ventana para imprimir
            const printWindow = window.open(url, '_blank', 'width=800,height=600')

            if (!printWindow) {
                toast.error('El navegador bloqueó la ventana emergente. Permite pop-ups para imprimir.')
                return
            }

            console.log('✅ Ventana de impresión abierta')
            toast.success('Abriendo diálogo de impresión...')

            // Esperar a que cargue el PDF y luego imprimir
            printWindow.onload = () => {
                console.log('📄 PDF cargado en ventana de impresión')
                setTimeout(() => {
                    printWindow.focus()
                    printWindow.print()
                    console.log('🖨️ Imprimiendo...')

                    // Cerrar después de imprimir (opcional)
                    // setTimeout(() => {
                    //     printWindow.close()
                    //     window.URL.revokeObjectURL(url)
                    // }, 1000)
                }, 500)
            }

            // Manejar error de carga
            printWindow.onerror = () => {
                console.error('❌ Error al cargar el PDF en la ventana de impresión')
                toast.error('Error al cargar el PDF para impresión')
            }

            // Limpiar URL después de 1 minuto
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
            }, 60000)

        } catch (error) {
            console.error('❌ Error al imprimir:', error)
            console.error('❌ Error name:', error.name)
            console.error('❌ Error message:', error.message)

            let errorMessage = 'Error al imprimir factura'

            if (error.message.includes('404')) {
                errorMessage = '❌ Factura no encontrada'
            } else if (error.message.includes('500')) {
                errorMessage = '❌ Error en el servidor'
            } else if (error.message.includes('401')) {
                errorMessage = '❌ No autorizado. Inicia sesión nuevamente.'
            } else if (error.message) {
                errorMessage = `❌ ${error.message}`
            }

            toast.error(errorMessage)
        }
    }

    // Calcular totales
    const totalFacturas = invoices?.length || 0
    const totalMonto = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate('/cajero')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Facturas</h1>
                        <p className="text-muted-foreground">Busca y visualiza facturas emitidas</p>
                    </div>
                </div>

                {/* Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Facturas</p>
                                    <p className="text-3xl font-bold">{totalFacturas}</p>
                                </div>
                                <FileText className="w-10 h-10 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Monto Total</p>
                                    <p className="text-3xl font-bold text-green-600">S/ {totalMonto.toFixed(2)}</p>
                                </div>
                                <TrendingUp className="w-10 h-10 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Fecha</p>
                                    <p className="text-lg font-semibold">
                                        {new Date(filters.startDate).toLocaleDateString('es-PE')}
                                    </p>
                                </div>
                                <Calendar className="w-10 h-10 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                Filtros de Búsqueda
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilters}
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Fecha Inicio</Label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Fecha Fin</Label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>N° Factura</Label>
                                <Input
                                    placeholder="F-20260621-0001"
                                    value={filters.invoiceNumber}
                                    onChange={(e) => setFilters({ ...filters, invoiceNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Cliente</Label>
                                <Input
                                    placeholder="Nombre del cliente"
                                    value={filters.customerName}
                                    onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Método de Pago</Label>
                                <select
                                    className="w-full h-10 px-3 border rounded-md bg-background"
                                    value={filters.paymentMethod}
                                    onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                                >
                                    <option value="">Todos</option>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="YAPE">Yape</option>
                                    <option value="PLIN">Plin</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                </select>
                            </div>
                        </div>
                        <Button onClick={handleSearch} className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Buscar Facturas
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Resultados */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Facturas Encontradas: <span className="text-blue-600">{totalFacturas}</span>
                            {totalMonto > 0 && (
                                <span className="text-green-600 ml-2">
                                    (S/ {totalMonto.toFixed(2)})
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : invoices?.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-muted-foreground font-medium">
                                    No hay facturas para mostrar
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Las facturas aparecerán automáticamente aquí
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {invoices.map(invoice => (
                                    <div key={invoice.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-start justify-between flex-wrap gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                    <h3 className="font-bold text-lg">
                                                        {invoice.invoiceNumber || invoice.quoteNumber}
                                                    </h3>
                                                    <Badge>{invoice.status}</Badge>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <User className="w-4 h-4" />
                                                        <span>{invoice.customerName}</span>
                                                    </div>
                                                    {invoice.customerDocument && (
                                                        <p className="text-muted-foreground">
                                                            {invoice.customerDocument}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>
                                                            {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString('es-PE') : 'N/A'}
                                                        </span>
                                                    </div>
                                                    {invoice.paymentMethod && (
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                                                            <span>{invoice.paymentMethod}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-green-600">
                                                    S/ {invoice.total?.toFixed(2)}
                                                </p>
                                                {invoice.items && invoice.items.length > 0 && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {invoice.items.length} producto{invoice.items.length > 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 pt-4 border-t">
                                            <Button
                                                size="sm"
                                                onClick={() => handleViewInvoice(invoice)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Ver Factura PDF
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handlePrintInvoice(invoice)}
                                            >
                                                <Printer className="w-4 h-4 mr-1" />
                                                Imprimir
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}