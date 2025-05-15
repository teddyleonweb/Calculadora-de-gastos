"use client"

import { X } from "lucide-react"
import { useEffect, useCallback, useRef } from "react"

interface ImageModalProps {
  imageSrc: string | null
  alt?: string
  onClose: () => void
}

export default function ImageModal({ imageSrc, alt = "Imagen del producto", onClose }: ImageModalProps) {
  // Si no hay imagen, no mostrar nada
  const handleCloseRef = useRef(onClose)

  useEffect(() => {
    handleCloseRef.current = onClose
  }, [onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCloseRef.current()
    }
  }, [])

  useEffect(() => {
    if (!imageSrc) return

    window.addEventListener("keydown", handleKeyDown)
    // Bloquear el scroll del body cuando el modal está abierto
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      // Restaurar el scroll cuando el modal se cierra
      document.body.style.overflow = "auto"
    }
  }, [handleKeyDown, imageSrc])

  if (!imageSrc) return null

  // Añadir console.log para depuración
  console.log("Renderizando modal con imagen:", imageSrc)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={() => handleCloseRef.current()}
    >
      <div className="relative max-w-full max-h-full">
        {/* Botón para cerrar */}
        <button
          onClick={(e) => {
            e.stopPropagation() // Evitar que el clic se propague al fondo
            handleCloseRef.current()
          }}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        {/* Imagen */}
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded shadow-lg transform scale-130" // Añadir transform scale-130
          onClick={(e) => e.stopPropagation()} // Evitar que el clic en la imagen cierre el modal
          style={{ transform: "scale(1.3)" }} // Aumentar el tamaño en un 30%
        />
      </div>
    </div>
  )
}
