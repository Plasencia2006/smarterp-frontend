import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { inventoryAPI, getImageUrl } from '@/services/spring.api'

export default function ProductImageUpload({ productId, currentImage, onImageUploaded, onImageDeleted }) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState(currentImage ? getImageUrl(currentImage) : null)
    const fileInputRef = useRef(null)

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast.error('❌ Solo se permiten imágenes')
            return
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('❌ La imagen no puede superar los 5MB')
            return
        }

        // Preview local
        const localPreview = URL.createObjectURL(file)
        setPreview(localPreview)
        setUploading(true)

        try {
            const response = await inventoryAPI.products.uploadImage(productId, file)

            if (response.data?.success) {
                toast.success('✅ Imagen subida correctamente')
                const imageUrl = getImageUrl(response.data.data.filename)
                setPreview(imageUrl)
                onImageUploaded?.(response.data.data)
            } else {
                throw new Error(response.data?.message || 'Error al subir')
            }
        } catch (error) {
            toast.error('❌ Error al subir imagen: ' + (error.response?.data?.message || error.message))
            setPreview(currentImage ? getImageUrl(currentImage) : null)
        } finally {
            setUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Eliminar la imagen del producto?')) return

        try {
            if (currentImage) {
                await inventoryAPI.products.deleteImage(productId, currentImage)
            }
            toast.success('✅ Imagen eliminada')
            setPreview(null)
            onImageDeleted?.()
        } catch (error) {
            toast.error('❌ Error al eliminar imagen')
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
            />

            {preview ? (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Producto"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleDelete}
                            disabled={uploading}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleClick}
                        disabled={uploading}
                    >
                        <Upload className="w-4 h-4 mr-1" />
                        Cambiar
                    </Button>
                </div>
            ) : (
                <div
                    onClick={handleClick}
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                >
                    {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    ) : (
                        <>
                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Click para subir imagen
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                PNG, JPG, WEBP (Max. 5MB)
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}