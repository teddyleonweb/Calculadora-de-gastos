"use client"

import { useState } from "react"

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export default function ImageWithFallback({ src, alt, className = "", width, height }: ImageWithFallbackProps) {
  const [error, setError] = useState<boolean>(false)

  const handleError = () => {
    setError(true)
  }

  // Si hay un error o no hay src, mostrar imagen de fallback
  const imageSrc = error || !src ? "/placeholder.svg" : src

  return (
    <img
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
    />
  )
}
