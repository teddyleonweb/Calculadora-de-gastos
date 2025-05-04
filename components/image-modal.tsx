"use client"

import { X } from "lucide-react"
import { useEffect, useCallback } from "react"

interface ImageModalProps {
  imageSrc: string | null
  alt?: string
  onClose: () => void
}

export default function ImageModal({ imageSrc, alt = "Imagen del producto", onClose }: ImageModalProps) {
  // Si no hay imagen, no mostrar nada
  if (!imageSrc) return null

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
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        {/* Imagen */}
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded shadow-lg"
          onClick={(e) => e.stopPropagation()} // Evitar que el clic en la imagen cierre el modal
        />
      </div>

      {/* Fondo clicable para cerrar */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
    </div>
  )
}
