"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface ImageUploaderProps {
  initialImage?: string
  onImageChange: (imageUrl: string) => void
}

export const ImageUploader = ({ initialImage = "", onImageChange }: ImageUploaderProps) => {
  const [image, setImage] = useState<string>(initialImage)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage)
    }
  }, [initialImage])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImage(base64String)
      onImageChange(base64String)
      setIsLoading(false)
    }
    reader.onerror = () => {
      console.error("Error al leer el archivo")
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImage("")
    onImageChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />

      <div className="flex flex-col items-center">
        {image ? (
          <div className="relative mb-2">
            <img
              src={image || "/placeholder.svg"}
              alt="Vista previa"
              className="h-32 w-32 object-cover rounded-md border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              aria-label="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <Button type="button" variant="outline" onClick={handleButtonClick} disabled={isLoading} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {image ? "Cambiar imagen" : "Subir imagen"}
        </Button>

        {isLoading && <p className="text-sm text-gray-500 mt-2">Cargando imagen...</p>}
      </div>
    </div>
  )
}
