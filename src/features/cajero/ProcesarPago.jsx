import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
    Search, DollarSign, Loader2, CheckCircle2, XCircle,
    Clock, AlertTriangle, Receipt, ArrowLeft, CreditCard,
    Smartphone, Banknote, User, Calendar, TrendingUp,
    FileText, Printer, Download
} from 'lucide-react'

export default function ProcesarPago() {
    const queryClient = useQueryClient()
    const [quoteNumber, setQuoteNumber] = useState('')
    const [searchedQuote, setSearchedQuote] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO')
    const [amountPaid, setAmountPaid] = useState('')
    const [serialNumbers, setSerialNumbers] = useState({})
    const [imeis, setImeis] = useState({})
    const [showPendingQuotes, setShowPendingQuotes] = useState(true)
    const [lastPaidQuote, setLastPaidQuote] = useState(null)  // ✅ NUEVO

    // Obtener cotizaciones pendientes
    const { data: pendingQuotes, isLoading: loadingQuotes, error } = useQuery({
        queryKey: ['pending-quotes'],
        queryFn: async () => {
            const res = await cashierAPI.getPendingQuotes()
            console.log('📋 Respuesta de cotizaciones pendientes:', res.data)
            return res.data?.success ? res.data.data : []
        },
        refetchInterval: 30000,
        onError: (err) => {
            console.error('❌ Error al cargar cotizaciones pendientes:', err)
        }
    })

    // Buscar cotización
    const searchMutation = useMutation({
        mutationFn: (number) => cashierAPI.searchQuote(number),
        onSuccess: (res) => {
            if (res.data?.success) {
                setSearchedQuote(res.data.data)
                setAmountPaid(res.data.data.total?.toString() || '')
                setLastPaidQuote(null)  // ✅ Reset al buscar nueva cotización
                const initialSerials = {}
                const initialImeis = {}
                res.data.data.items?.forEach(item => {
                    if (item.hasSerialNumber) {
                        initialSerials[item.productId] = Array(item.quantity).fill('')
                        initialImeis[item.productId] = Array(item.quantity).fill('')
                    }
                })
                setSerialNumbers(initialSerials)
                setImeis(initialImeis)
            } else {
                toast.error(res.data?.message || 'Cotización no encontrada')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al buscar')
        }
    })

    // Procesar pago
    const paymentMutation = useMutation({
        mutationFn: (data) => cashierAPI.processPayment(data),
        onSuccess: (res) => {
            if (res.data?.success) {
                const data = res.data.data

                // ✅ Guardar referencia a la última cotización pagada
                setLastPaidQuote({
                    id: searchedQuote.id,
                    quoteNumber: searchedQuote.quoteNumber,
                    invoiceNumber: data.quoteNumber,
                    customerName: searchedQuote.customerName,
                    total: searchedQuote.total,
                    paymentMethod: paymentMethod,
                    change: data.change
                })

                toast.success(`✅ Pago procesado - Factura: ${data.quoteNumber}`, {
                    description: `Total: S/ ${data.total.toFixed(2)} - Cambio: S/ ${data.change.toFixed(2)}`
                })

                // ✅ Reset parcial (NO resetear searchedQuote para mostrar confirmación)
                setQuoteNumber('')
                setAmountPaid('')
                setSerialNumbers({})
                setImeis({})
                queryClient.invalidateQueries(['pending-quotes'])
                queryClient.invalidateQueries(['cajero-dashboard'])
            } else {
                toast.error(res.data?.message || 'Error al procesar pago')
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al procesar pago')
        }
    })

    // ✅ NUEVO: Mutación para generar PDF de factura (con logs)
    const generatePdfMutation = useMutation({
        mutationFn: async (quoteId) => {
            console.log('🧾 Generando PDF para quote ID:', quoteId)
            console.log('📋 lastPaidQuote:', lastPaidQuote)

            const response = await cashierAPI.generateInvoicePdf(quoteId)
            console.log('📄 Respuesta del servidor:', response)
            return response
        },
        onSuccess: (blob) => {
            console.log('✅ PDF recibido:', blob)
            console.log('📊 Tamaño del blob:', blob.size, 'bytes')

            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
            console.log('🔗 URL generada:', url)

            window.open(url, '_blank')
        },
        onError: (err) => {
            console.error('❌ Error al generar PDF:', err)
            console.error('❌ Response:', err.response)
            console.error('❌ Data:', err.response?.data)
            toast.error('Error al generar factura PDF: ' + (err.response?.data?.message || err.message))
        }
    })

    const handleSearch = () => {
        if (!quoteNumber.trim()) {
            toast.error('Ingresa el número de cotización')
            return
        }
        searchMutation.mutate(quoteNumber.trim())
    }

    const handleSelectQuote = (quote) => {
        setQuoteNumber(quote.quoteNumber)
        searchMutation.mutate(quote.quoteNumber)
    }

    const handleProcessPayment = () => {
        if (!searchedQuote) return

        const paid = parseFloat(amountPaid)
        if (isNaN(paid) || paid < searchedQuote.total) {
            toast.error(`Monto insuficiente. Total: S/ ${searchedQuote.total.toFixed(2)}`)
            return
        }

        for (const [productId, serials] of Object.entries(serialNumbers)) {
            const emptySerials = serials.filter(s => !s.trim())
            if (emptySerials.length > 0) {
                toast.error('Completa todos los números de serie')
                return
            }
        }

        paymentMutation.mutate({
            quoteNumber: searchedQuote.quoteNumber,
            paymentMethod,
            amountPaid: paid,
            serialNumbers,
            imeis
        })
    }

    const handleSerialChange = (productId, index, value) => {
        setSerialNumbers(prev => ({
            ...prev,
            [productId]: prev[productId].map((s, i) => i === index ? value : s)
        }))
    }

    const handleImeiChange = (productId, index, value) => {
        setImeis(prev => ({
            ...prev,
            [productId]: prev[productId].map((s, i) => i === index ? value : s)
        }))
    }

    // ✅ NUEVO: Generar factura PDF
    const handleGenerateInvoice = () => {
        if (!lastPaidQuote?.id) {
            toast.error('No hay factura disponible')
            return
        }
        generatePdfMutation.mutate(lastPaidQuote.id)
    }

    // ✅ NUEVO: Nuevo pago (reset completo)
    const handleNewPayment = () => {
        setQuoteNumber('')
        setSearchedQuote(null)
        setLastPaidQuote(null)
        setAmountPaid('')
        setSerialNumbers({})
        setImeis({})
        setPaymentMethod('EFECTIVO')
    }

    // ✅ NUEVO: Imprimir factura
    const handlePrintInvoice = () => {
        if (!lastPaidQuote?.id) return
        window.print()
    }

    const change = searchedQuote && amountPaid
        ? Math.max(0, parseFloat(amountPaid) - searchedQuote.total)
        : 0

    const paymentMethods = [
        { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote, color: 'bg-green-500' },
        { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-500' },
        { value: 'YAPE', label: 'Yape', icon: Smartphone, color: 'bg-purple-500' },
        { value: 'PLIN', label: 'Plin', icon: Smartphone, color: 'bg-cyan-500' },
        { value: 'TRANSFERENCIA', label: 'Transferencia', icon: Banknote, color: 'bg-indigo-500' }
    ]

    const getStatusColor = (status, remainingMinutes) => {
        if (remainingMinutes !== null && remainingMinutes <= 0) return 'bg-red-500'
        if (remainingMinutes !== null && remainingMinutes <= 10) return 'bg-orange-500'
        return 'bg-blue-500'
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => window.history.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Procesar Pago</h1>
                            <p className="text-muted-foreground">Cobra la cotización del cliente</p>
                        </div>
                    </div>
                </div>

                {/* Buscador */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Buscar Cotización
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label>Número de Cotización</Label>
                        <div className="flex gap-2 mt-2">
                            <div className="flex-1 relative">
                                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Ej: Q-1781920791169"
                                    value={quoteNumber}
                                    onChange={(e) => setQuoteNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10 h-12"
                                    autoFocus
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={searchMutation.isPending}
                                className="h-12 px-6"
                            >
                                {searchMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Toggle para mostrar/ocultar pendientes */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Cotizaciones Pendientes
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPendingQuotes(!showPendingQuotes)}
                    >
                        {showPendingQuotes ? 'Ocultar' : 'Mostrar'}
                    </Button>
                </div>

                {/* Lista de Cotizaciones Pendientes */}
                {showPendingQuotes && (
                    <Card>
                        <CardContent className="p-6">
                            {loadingQuotes ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : pendingQuotes?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay cotizaciones pendientes en este momento
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pendingQuotes?.map(quote => {
                                        const remainingMinutes = quote.remainingMinutes
                                        const isExpired = quote.isExpired || (remainingMinutes !== null && remainingMinutes <= 0)

                                        return (
                                            <div
                                                key={quote.id}
                                                onClick={() => !isExpired && handleSelectQuote(quote)}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${isExpired
                                                    ? 'border-gray-300 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                                                    : 'border-blue-200 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-500'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Receipt className="w-5 h-5 text-blue-600" />
                                                        <h3 className="font-bold text-lg">{quote.quoteNumber}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getStatusColor(quote.status, remainingMinutes)}>
                                                            {isExpired ? 'Expirada' : 'Pendiente'}
                                                        </Badge>
                                                        {remainingMinutes !== null && remainingMinutes > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Clock className="w-3 h-3 mr-1" />
                                                                {remainingMinutes} min
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <User className="w-4 h-4" />
                                                        <span>{quote.customerName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(quote.createdAt).toLocaleString('es-PE')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                                        <span className="font-bold text-green-600 text-lg">
                                                            S/ {quote.total?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {quote.items && quote.items.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            {quote.items.length} producto{quote.items.length > 1 ? 's' : ''}:
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {quote.items.slice(0, 3).map((item, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {item.quantity} × {item.productName?.substring(0, 20)}
                                                                    {item.productName?.length > 20 ? '...' : ''}
                                                                </Badge>
                                                            ))}
                                                            {quote.items.length > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{quote.items.length - 3} más
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {isExpired && (
                                                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-950/30 rounded border border-red-300">
                                                        <p className="text-xs text-red-800 dark:text-red-200 text-center">
                                                            ⚠️ Cotización expirada - Contactar al vendedor
                                                        </p>
                                                    </div>
                                                )}

                                                {!isExpired && remainingMinutes !== null && remainingMinutes <= 10 && (
                                                    <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-950/30 rounded border border-orange-300">
                                                        <p className="text-xs text-orange-800 dark:text-orange-200 text-center">
                                                            ⏰ Expira en {remainingMinutes} minutos
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Cotización Encontrada */}
                {searchedQuote && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Info de Cotización */}
                        <Card className={searchedQuote.isValidForPayment
                            ? 'border-green-500'
                            : 'border-red-500'
                        }>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="w-5 h-5" />
                                        Cotización {searchedQuote.quoteNumber}
                                    </CardTitle>
                                    {searchedQuote.isValidForPayment ? (
                                        <Badge className="bg-green-500">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Vigente
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            No válida
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <p className="font-bold text-lg">{searchedQuote.customerName}</p>
                                    {searchedQuote.customerDocument && (
                                        <p className="text-sm text-muted-foreground">
                                            {searchedQuote.customerDocument}
                                        </p>
                                    )}
                                </div>

                                {searchedQuote.remainingMinutes > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-orange-600">
                                        <Clock className="w-4 h-4" />
                                        Expira en: <strong>{searchedQuote.remainingMinutes} min</strong>
                                    </div>
                                )}

                                <div className="border-t pt-4 space-y-2">
                                    <p className="font-semibold">Productos:</p>
                                    {searchedQuote.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>
                                                {item.quantity} × {item.productName}
                                                {item.hasSerialNumber && (
                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                        🔑 Requiere serial
                                                    </Badge>
                                                )}
                                            </span>
                                            <span className="font-medium">
                                                S/ {item.subtotal?.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span>S/ {searchedQuote.subtotal?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>IGV (18%):</span>
                                        <span>S/ {searchedQuote.igv?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>TOTAL:</span>
                                        <span className="text-green-600">
                                            S/ {searchedQuote.total?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ✅ Formulario de Pago o Confirmación de Pago Exitoso */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {lastPaidQuote ? '✅ Pago Exitoso' : 'Registrar Pago'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {lastPaidQuote ? (
                                    // ✅ CONFIRMACIÓN DESPUÉS DEL PAGO EXITOSO
                                    <div className="space-y-6">
                                        {/* Mensaje de éxito */}
                                        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-2 border-green-500">
                                            <div className="flex items-center gap-3 mb-3">
                                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                                                <div>
                                                    <h3 className="font-bold text-lg text-green-900 dark:text-green-200">
                                                        ¡Pago Procesado Correctamente!
                                                    </h3>
                                                    <p className="text-sm text-green-700 dark:text-green-300">
                                                        Factura generada automáticamente
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Factura N°:</span>
                                                    <span className="font-bold">{lastPaidQuote.invoiceNumber}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Cliente:</span>
                                                    <span className="font-medium">{lastPaidQuote.customerName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Pagado:</span>
                                                    <span className="font-bold text-green-600">S/ {lastPaidQuote.total?.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Método:</span>
                                                    <span className="font-medium">{lastPaidQuote.paymentMethod}</span>
                                                </div>
                                                {lastPaidQuote.change > 0 && (
                                                    <div className="flex justify-between pt-2 border-t">
                                                        <span className="text-muted-foreground">Cambio:</span>
                                                        <span className="font-bold text-blue-600">S/ {lastPaidQuote.change?.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botones de Acción */}
                                        <div className="space-y-2">
                                            <Button
                                                onClick={handleGenerateInvoice}
                                                disabled={generatePdfMutation.isPending}
                                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {generatePdfMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Generando Factura...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Ver/Imprimir Factura PDF
                                                    </>
                                                )}
                                            </Button>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={handlePrintInvoice}
                                                    className="flex items-center justify-center gap-2"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Imprimir Rápido
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleNewPayment}
                                                    className="flex items-center justify-center gap-2"
                                                >
                                                    <DollarSign className="w-4 h-4" />
                                                    Nuevo Pago
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Info adicional */}
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                                            <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                                                💡 La factura se ha generado automáticamente y está lista para imprimir o descargar
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    // ✅ FORMULARIO DE PAGO NORMAL
                                    <div className="space-y-4">
                                        {/* Método de pago */}
                                        <div className="space-y-2">
                                            <Label>Método de Pago</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {paymentMethods.map(pm => {
                                                    const Icon = pm.icon
                                                    return (
                                                        <Button
                                                            key={pm.value}
                                                            type="button"
                                                            variant={paymentMethod === pm.value ? 'default' : 'outline'}
                                                            onClick={() => setPaymentMethod(pm.value)}
                                                            className="justify-start"
                                                        >
                                                            <Icon className="w-4 h-4 mr-2" />
                                                            {pm.label}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Monto recibido */}
                                        <div className="space-y-2">
                                            <Label>Monto Recibido (S/)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={amountPaid}
                                                onChange={(e) => setAmountPaid(e.target.value)}
                                                className="h-12 text-lg font-bold"
                                            />
                                            {change > 0 && (
                                                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
                                                    <p className="text-sm text-green-800 dark:text-green-200">
                                                        💵 Cambio a devolver: <strong>S/ {change.toFixed(2)}</strong>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Números de Serie */}
                                        {Object.keys(serialNumbers).length > 0 && (
                                            <div className="space-y-3 border-t pt-4">
                                                <Label className="flex items-center gap-2">
                                                    🔑 Números de Serie / IMEI
                                                </Label>
                                                {searchedQuote.items?.filter(i => i.hasSerialNumber).map(item => (
                                                    <div key={item.productId} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                        <p className="font-medium text-sm">{item.productName}</p>
                                                        {serialNumbers[item.productId]?.map((serial, idx) => (
                                                            <div key={idx} className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    placeholder={`Serial ${idx + 1}`}
                                                                    value={serial}
                                                                    onChange={(e) => handleSerialChange(item.productId, idx, e.target.value)}
                                                                    className="h-9"
                                                                />
                                                                <Input
                                                                    placeholder={`IMEI ${idx + 1} (opcional)`}
                                                                    value={imeis[item.productId]?.[idx] || ''}
                                                                    onChange={(e) => handleImeiChange(item.productId, idx, e.target.value)}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleProcessPayment}
                                            disabled={paymentMutation.isPending || !searchedQuote.isValidForPayment}
                                            className="w-full h-12 bg-green-600 hover:bg-green-700"
                                        >
                                            {paymentMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Procesando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Procesar Pago
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}