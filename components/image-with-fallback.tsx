"use client"

import { useState, useEffect, useCallback } from "react"
import { getAccessibleImageUrl } from "../lib/supabase/storage-helper"

interface ImageWithFallbackProps {
  src: string | undefined
  alt: string
  className?: string
  fallbackSrc?: string
  width?: number
  height?: number
  onClick?: () => void // Añadir explícitamente la prop onClick
}

// Optimizar el componente ImageWithFallback
export default function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg",
  width,
  height,
  onClick,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(fallbackSrc)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)

  // OPTIMIZACIÓN: Usar useCallback para la función de carga de imágenes
  const loadImage = useCallback(
    async (imageUrl: string | undefined) => {
      if (!imageUrl) {
        setImgSrc(fallbackSrc)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // OPTIMIZACIÓN: Si la imagen ya es una URL de datos, usarla directamente
        if (imageUrl.startsWith("data:")) {
          setImgSrc(imageUrl)
          setHasError(false)
          setIsLoading(false)
          return
        }

        // OPTIMIZACIÓN: Establecer un timeout más corto para la carga de la imagen
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout al cargar la imagen"))
          }, 3000) // 3 segundos máximo para cargar la imagen
        })

        // OPTIMIZACIÓN: Para imágenes pequeñas, no usar getAccessibleImageUrl
        if (imageUrl.includes("store-images") || imageUrl.includes("product-images")) {
          const accessibleUrl = await Promise.race([getAccessibleImageUrl(imageUrl), timeoutPromise])
          setImgSrc(accessibleUrl)
        } else {
          setImgSrc(imageUrl)
        }

        setHasError(false)
      } catch (error) {
        console.error("Error al cargar imagen:", error)
        setImgSrc(fallbackSrc)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    },
    [fallbackSrc],
  )

  // OPTIMIZACIÓN: Usar useEffect con dependencias correctas
  useEffect(() => {
    let isMounted = true

    if (isMounted) {
      loadImage(src)
    }

    return () => {
      isMounted = false
    }
  }, [src, loadImage])

  // OPTIMIZACIÓN: Simplificar el renderizado
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <span className="sr-only">Cargando...</span>
        </div>
      )}
      <img
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        className={`${className} ${hasError ? "opacity-50" : ""}`}
        onError={() => {
          setImgSrc(fallbackSrc)
          setHasError(true)
        }}
        width={width}
        height={height}
        onClick={onClick}
        style={onClick ? { cursor: "pointer" } : {}}
      />
    </div>
  )
}
