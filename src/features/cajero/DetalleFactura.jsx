import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cashierAPI } from '@/services/cashier.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft, Receipt, User, Calendar, CreditCard,
    Package, Key, Shield, FileText
} from 'lucide-react'

export default function DetalleFactura() {
    const { invoiceNumber } = useParams()
    const navigate = useNavigate()

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice-detail', invoiceNumber],
        queryFn: async () => {
            const res = await cashierAPI.getInvoiceDetail(invoiceNumber)
            return res.data?.success ? res.data.data : null
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Factura no encontrada</p>
                <Button onClick={() => navigate('/cajero/facturas')} className="mt-4">
                    Volver
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => navigate('/cajero/facturas')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver a facturas
                </Button>

                {/* Header de factura */}
                <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-6 h-6" />
                                    <h1 className="text-3xl font-bold">FACTURA</h1>
                                </div>
                                <p className="text-2xl font-bold">{invoice.invoiceNumber}</p>
                                <p className="text-blue-100 text-sm mt-1">
                                    Cotización: {invoice.quoteNumber}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-blue-100">Emitida</p>
                                <p className="text-lg font-bold">
                                    {new Date(invoice.issuedAt).toLocaleString('es-PE')}
                                </p>
                                <Badge className="bg-white text-blue-600 mt-2">
                                    {invoice.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold">Datos del Cliente</h3>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Nombre</p>
                                    <p className="font-medium">{invoice.customerName}</p>
                                </div>
                                {invoice.customerDocument && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Documento</p>
                                        <p className="font-medium">{invoice.customerDocument}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold">Datos del Pago</h3>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Método</p>
                                    <p className="font-medium">{invoice.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cajero</p>
                                    <p className="font-medium">{invoice.cashierName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vendedor</p>
                                    <p className="font-medium">{invoice.sellerName || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Productos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Productos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {invoice.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            SKU: {item.productSku} | {item.quantity} × S/ {item.unitPrice?.toFixed(2)}
                                        </p>
                                    </div>
                                    <p className="font-bold">S/ {item.subtotal?.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Números de Serie */}
                {invoice.serials && invoice.serials.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                Números de Serie / IMEI
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {invoice.serials.map((serial, idx) => (
                                    <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                                        <div className="flex items-start justify-between flex-wrap gap-2">
                                            <div>
                                                <p className="font-medium">{serial.productName}</p>
                                                <p className="text-sm">
                                                    <span className="text-muted-foreground">Serial: </span>
                                                    <span className="font-mono font-bold">{serial.serialNumber}</span>
                                                </p>
                                                {serial.imei && (
                                                    <p className="text-sm">
                                                        <span className="text-muted-foreground">IMEI: </span>
                                                        <span className="font-mono font-bold">{serial.imei}</span>
                                                    </p>
                                                )}
                                            </div>
                                            {serial.warrantyEnd && (
                                                <div className="flex items-center gap-1 text-sm text-green-600">
                                                    <Shield className="w-4 h-4" />
                                                    Garantía hasta: {new Date(serial.warrantyEnd).toLocaleDateString('es-PE')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Totales */}
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-2 max-w-sm ml-auto">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>S/ {invoice.subtotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IGV (18%):</span>
                                <span>S/ {invoice.igv?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-xl font-bold">
                                <span>TOTAL:</span>
                                <span className="text-green-600">S/ {invoice.total?.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}