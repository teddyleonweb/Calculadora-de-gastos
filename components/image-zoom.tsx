"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Move } from "lucide-react"

interface ImageZoomProps {
  src: string
  alt?: string
  className?: string
}

export default function ImageZoom({ src, alt = "Imagen", className = "" }: ImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)

  // Resetear el zoom y posición cuando cambia la imagen
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setLoaded(false)
  }, [src])

  // Manejar el zoom con la rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.01
    const newScale = Math.min(Math.max(0.5, scale + delta), 5)
    setScale(newScale)
  }

  // Iniciar el arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  // Manejar el arrastre
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height

      // Calcular los límites de movimiento basados en el zoom
      const maxX = ((scale - 1) * containerWidth) / 2
      const maxY = ((scale - 1) * containerHeight) / 2

      // Calcular la nueva posición
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Limitar el movimiento dentro de los límites
      const clampedX = Math.min(Math.max(newX, -maxX), maxX)
      const clampedY = Math.min(Math.max(newY, -maxY), maxY)

      setPosition({
        x: clampedX,
        y: clampedY,
      })
    }
  }

  // Finalizar el arrastre
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Manejar eventos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && containerRef.current) {
      e.preventDefault() // Prevenir el scroll

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height

      // Calcular los límites de movimiento basados en el zoom
      const maxX = ((scale - 1) * containerWidth) / 2
      const maxY = ((scale - 1) * containerHeight) / 2

      // Calcular la nueva posición
      const newX = e.touches[0].clientX - dragStart.x
      const newY = e.touches[0].clientY - dragStart.y

      // Limitar el movimiento dentro de los límites
      const clampedX = Math.min(Math.max(newX, -maxX), maxX)
      const clampedY = Math.min(Math.max(newY, -maxY), maxY)

      setPosition({
        x: clampedX,
        y: clampedY,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Funciones para los botones de zoom
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 0.5))
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`overflow-hidden relative ${className}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? "grabbing" : scale > 1 ? "grab" : "default" }}
      >
        {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>}
        <img
          ref={imgRef}
          src={src || "/placeholder.svg"}
          alt={alt}
          className={`w-full h-auto transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      </div>

      {/* Controles de zoom */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white bg-opacity-75 p-1 rounded-md shadow-md">
        <button
          onClick={zoomOut}
          className="p-1 rounded hover:bg-gray-200"
          disabled={scale <= 0.5}
          title="Reducir zoom"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-xs px-1">{Math.round(scale * 100)}%</span>
        <button onClick={zoomIn} className="p-1 rounded hover:bg-gray-200" disabled={scale >= 5} title="Aumentar zoom">
          <ZoomIn size={18} />
        </button>
        <button
          onClick={resetZoom}
          className="p-1 rounded hover:bg-gray-200 ml-1"
          disabled={scale === 1 && position.x === 0 && position.y === 0}
          title="Restablecer zoom"
        >
          <Move size={18} />
        </button>
      </div>
    </div>
  )
}
