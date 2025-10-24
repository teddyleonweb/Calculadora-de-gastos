"use client"

import { useState, useEffect } from "react"

interface ImageWithFallbackProps {
  src: string | undefined
  alt: string
  className?: string
  fallbackSrc?: string
  width?: number
  height?: number
  onClick?: () => void
}

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

  useEffect(() => {
    let isMounted = true

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

        // Usar directamente la URL de la imagen sin procesamiento adicional
        // Ya no necesitamos getAccessibleImageUrl de Supabase
        if (isMounted) {
          setImgSrc(src)
          setHasError(false)
        }
      } catch (error) {
        console.error("Error al cargar imagen:", error)
        if (isMounted) {
          setImgSrc(fallbackSrc)
          setHasError(true)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
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
        onClick={onClick}
        style={onClick ? { cursor: "pointer" } : undefined}
      />
    </div>
  )
}
