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
}

export default function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg",
  width,
  height,
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
        // Obtener una URL accesible (con token si es necesario)
        const accessibleUrl = await getAccessibleImageUrl(src)

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
      />
    </div>
  )
}
