import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { inventoryAPI } from '@/services/spring.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, Download, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function BulkImport({ type, onSuccess }) {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [updateExisting, setUpdateExisting] = useState(false)

    const validateMutation = useMutation({
        mutationFn: ({ file, type }) => inventoryAPI.bulk.validate(file, type),
        onSuccess: (response) => {
            const data = response.data
            if (data?.success) {
                setPreview(data.data)
            }
        },
        onError: (err) => {
            console.error('Error validando:', err)
            toast.error('Error al validar el archivo')
        }
    })

    const importMutation = useMutation({
        mutationFn: ({ file, type, updateExisting }) =>
            type === 'products'
                ? inventoryAPI.bulk.importProducts(file, updateExisting)
                : inventoryAPI.bulk.importCategories(file),
        onSuccess: (response) => {
            const data = response.data
            if (data?.success) {
                const result = data.data
                if (result.failed > 0) {
                    toast.warning(`⚠️ Importación parcial: ${result.success} exitosos, ${result.failed} fallidos`)
                } else {
                    toast.success(`✅ Importación completada: ${result.success} registros exitosos`)
                }
                if (onSuccess) onSuccess()
                setFile(null)
                setPreview(null)
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error al importar')
        }
    })

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            setFile(selectedFile)
            setPreview(null)
            validateMutation.mutate({ file: selectedFile, type })
        }
    }

    const handleImport = () => {
        if (!file) return
        importMutation.mutate({ file, type, updateExisting })
    }

    const downloadTemplate = async () => {
        try {
            if (type === 'products') {
                await inventoryAPI.bulk.downloadProductsTemplate()
            } else {
                await inventoryAPI.bulk.downloadCategoriesTemplate()
            }
            toast.success('✅ Plantilla descargada')
        } catch (err) {
            toast.error('Error al descargar plantilla')
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Carga Masiva de {type === 'products' ? 'Productos' : 'Categorías'}
                    </CardTitle>
                    <CardDescription>
                        Importa múltiples registros desde un archivo CSV
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Descargar plantilla */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="font-medium">¿Necesitas una plantilla?</p>
                                <p className="text-sm text-muted-foreground">
                                    Descarga un archivo de ejemplo para saber el formato
                                </p>
                            </div>
                        </div>
                        <Button onClick={downloadTemplate} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Descargar Plantilla
                        </Button>
                    </div>

                    {/* Subir archivo */}
                    <div className="space-y-2">
                        <Label>Archivo CSV *</Label>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Solo se permiten archivos CSV
                        </p>
                    </div>

                    {/* Opción para actualizar existentes (solo productos) */}
                    {type === 'products' && (
                        <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <input
                                type="checkbox"
                                id="updateExisting"
                                checked={updateExisting}
                                onChange={(e) => setUpdateExisting(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="updateExisting" className="text-sm cursor-pointer">
                                Actualizar productos existentes (por SKU)
                            </Label>
                        </div>
                    )}

                    {/* Vista previa de validación - SIN Alert */}
                    {preview && (
                        <div className={`p-4 rounded-lg border ${preview.valid
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                {preview.valid ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {preview.valid ? 'Archivo válido' : 'Errores encontrados'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Total:</span>
                                            <span className="ml-2 font-medium">{preview.totalRows}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Válidos:</span>
                                            <span className="ml-2 font-medium text-green-600">{preview.validRows}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Inválidos:</span>
                                            <span className="ml-2 font-medium text-red-600">{preview.invalidRows}</span>
                                        </div>
                                    </div>

                                    {preview.errors && preview.errors.length > 0 && (
                                        <div className="mt-2 p-2 bg-white rounded border border-red-200 text-xs max-h-32 overflow-y-auto">
                                            {preview.errors.map((error, idx) => (
                                                <div key={idx} className="text-red-600 py-0.5">• {error}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleImport}
                            disabled={!file || !preview?.valid || importMutation.isPending}
                            className="flex-1"
                        >
                            {importMutation.isPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Importar {preview?.validRows || 0} registros
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { setFile(null); setPreview(null) }}
                            disabled={importMutation.isPending}
                        >
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}