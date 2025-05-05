"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import ImageWithFallback from "./image-with-fallback"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  title?: string
}

export default function ImageModal({ isOpen, onClose, imageSrc, title }: ImageModalProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Prevenir el scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden"
    } else {
      // Restaurar el scroll cuando se cierra
      document.body.style.overflow = ""
      // Pequeño delay para la animación de cierre
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold truncate">{title || "Vista previa de imagen"}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-100px)]">
          {imageSrc ? (
            <ImageWithFallback
              src={imageSrc || "/placeholder.svg"}
              alt={title || "Vista previa"}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <div className="text-gray-500">No hay imagen disponible</div>
          )}
        </div>
      </div>
    </div>
  )
}
