"use client"

import type React from "react"
import { useState, useRef } from "react"

interface ImageUploaderProps {
  onImageCapture: (imageSrc: string) => void
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageCapture }) => {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        onImageCapture(event.target.result as string)
      }
      setIsLoading(false)
    }
    reader.onerror = () => {
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-bold mb-4">Subir Imagen</h2>
      <div className="flex flex-col items-center">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <button
          onClick={triggerFileInput}
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 mb-2 w-full"
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Seleccionar Imagen"}
        </button>
        <p className="text-sm text-gray-500">Sube una imagen de un producto para extraer su información</p>
      </div>
    </div>
  )
}

export default ImageUploader
