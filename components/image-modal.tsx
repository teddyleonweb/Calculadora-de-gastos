"use client"

import { X } from "lucide-react"
import { useEffect, useCallback, useState } from "react"
import { getAccessibleImageUrl } from "../lib/supabase/storage-helper"

interface ImageModalProps {
  imageSrc: string | null
  alt?: string
  onClose: () => void
}

export default function ImageModal({ imageSrc, alt = "Imagen del producto", onClose }: ImageModalProps) {
  const [accessibleImageUrl, setAccessibleImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isImageSrcValid, setIsImageSrcValid] = useState<boolean>(!!imageSrc)

  // Si no hay imagen, no mostrar nada
  if (!imageSrc) return null

  // Cargar la URL accesible cuando cambia la imagen
  useEffect(() => {
    let isMounted = true

    async function loadAccessibleUrl() {
      if (!imageSrc) return

      setIsLoading(true)
      setError(null)

      try {
        // Verificar si la imagen es una URL completa o una ruta de Supabase
        if (imageSrc.startsWith("http") || imageSrc.startsWith("data:")) {
          setAccessibleImageUrl(imageSrc)
        } else {
          const url = await getAccessibleImageUrl(imageSrc)
          if (isMounted) {
            setAccessibleImageUrl(url)
          }
        }
      } catch (err) {
        console.error("Error al cargar la imagen:", err)
        if (isMounted) {
          setError("No se pudo cargar la imagen")
          setAccessibleImageUrl(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAccessibleUrl()

    return () => {
      isMounted = false
    }
  }, [imageSrc])

  // Cerrar el modal con la tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    // Bloquear el scroll del body cuando el modal está abierto
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      // Restaurar el scroll cuando el modal se cierra
      document.body.style.overflow = "auto"
    }
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="relative max-w-full max-h-full">
        {/* Botón para cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all z-10"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex items-center justify-center bg-gray-800 rounded-lg p-8">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

        {/* Imagen */}
        {accessibleImageUrl && !isLoading && !error && (
          <img
            src={accessibleImageUrl || "/placeholder.svg"}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded shadow-lg"
            onClick={(e) => e.stopPropagation()} // Evitar que el clic en la imagen cierre el modal
          />
        )}
      </div>

      {/* Fondo clicable para cerrar */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
    </div>
  )
}
