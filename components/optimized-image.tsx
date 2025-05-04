"use client"

import { useState, useEffect } from "react"
import ImageWithFallback from "./image-with-fallback"
import { getOptimizedImageUrl } from "../lib/performance-monitor"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  onClick?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  width = 300,
  height,
  className = "",
  onClick,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [optimizedSrc, setOptimizedSrc] = useState("")

  useEffect(() => {
    // Optimizar la URL de la imagen
    setOptimizedSrc(getOptimizedImageUrl(src, width))

    // Precargar la imagen
    if (src) {
      const img = new Image()
      img.src = getOptimizedImageUrl(src, width)
      img.onload = () => setIsLoaded(true)
    }
  }, [src, width])

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <ImageWithFallback
        src={optimizedSrc || src}
        alt={alt}
        width={width}
        height={height || width}
        className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onClick={onClick}
      />
    </div>
  )
}
