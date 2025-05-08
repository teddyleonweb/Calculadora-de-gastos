"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"

interface ImageWithFallbackProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, width, height, className }) => {
  const [error, setError] = useState(false)

  const handleError = () => {
    setError(true)
  }

  return (
    <Image
      src={error ? "/placeholder.svg" : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  )
}

export default ImageWithFallback
