"use client"

import type React from "react"
import { useState } from "react"

interface ImageUploaderProps {
  onImageCapture: (imageSrc: string) => void
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageCapture }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Función para manejar la carga de imágenes desde el dispositivo
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      console.error("No se seleccionaron archivos")
      return
    }

    const file = files[0]
    console.log("Archivo seleccionado:", file.name, file.type, file.size)

    // Verificar que sea una imagen
    if (!file.type.startsWith("image/")) {
      setError("Por favor, seleccione un archivo de imagen válido (JPEG, PNG, etc.)")
      return
    }

    // Verificar el tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen es demasiado grande. El tamaño máximo es de 10MB.")
      return
    }

    setError(null)
    setIsLoading(true)

    const reader = new FileReader()

    reader.onload = (e) => {
      if (!e.target || typeof e.target.result !== "string") {
        setError("Error al leer el archivo")
        setIsLoading(false)
        return
      }

      // Precargar la imagen para verificar que se carga correctamente
      const img = new Image()
      img.onload = () => {
        console.log("Imagen cargada correctamente:", img.width, "x", img.height)
        setImageSrc(e.target!.result as string)
        onImageCapture(e.target!.result as string)
        setIsLoading(false)
      }
      img.onerror = () => {
        console.error("Error al cargar la imagen")
        setError("Error al cargar la imagen. Por favor, intente con otra imagen.")
        setIsLoading(false)
      }
      img.src = e.target.result as string
    }

    reader.onerror = () => {
      console.error("Error al leer el archivo")
      setError("Error al leer el archivo")
      setIsLoading(false)
    }

    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isLoading} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isLoading && <p>Cargando...</p>}
      {imageSrc && <img src={imageSrc || "/placeholder.svg"} alt="Uploaded" style={{ maxWidth: "200px" }} />}
    </div>
  )
}

export default ImageUploader
