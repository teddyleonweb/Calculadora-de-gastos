"use client"

import { useState, useEffect } from "react"
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

export default function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg",
  width,
  height,
  onClick, // Recibir la prop onClick
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(fallbackSrc)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)

  // Optimizar la carga de imágenes
  useEffect(() => {
    let isMounted = true
    let imageLoadTimeout: NodeJS.Timeout

    async function loadImage() {
      if (!src) {
        if (isMounted) {
          setImgSrc(fallbackSrc)
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)

        // Establecer un timeout para la carga de la imagen
        const timeoutPromise = new Promise<string>((_, reject) => {
          imageLoadTimeout = setTimeout(() => {
            reject(new Error("Timeout al cargar la imagen"))
          }, 5000) // 5 segundos máximo para cargar la imagen
        })

        // Intentar obtener la URL accesible con un límite de tiempo
        const accessibleUrl = await Promise.race([getAccessibleImageUrl(src), timeoutPromise])

        if (isMounted) {
          setImgSrc(accessibleUrl)
          setHasError(false)
        }
      } catch (error) {
        console.error("Error al cargar imagen:", error)
        if (isMounted) {
          setImgSrc(fallbackSrc)
          setHasError(true)
        }
      } finally {
        clearTimeout(imageLoadTimeout)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
      clearTimeout(imageLoadTimeout)
    }
  }, [src, fallbackSrc])

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
        onClick={onClick} // Pasar el onClick a la imagen
        style={onClick ? { cursor: "pointer" } : {}} // Añadir cursor pointer si hay onClick
      />
    </div>
  )
}
