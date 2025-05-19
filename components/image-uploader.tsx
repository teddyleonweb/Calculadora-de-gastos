"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Camera, X, RotateCw, Upload, AlertCircle } from "lucide-react"
import { fileToBase64, uploadImage } from "../services/storage-service"

interface ImageUploaderProps {
  onImageCapture: (imageSrc: string) => void
}

export default function ImageUploader({ onImageCapture }: ImageUploaderProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Método para iniciar la cámara
  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Preferir cámara trasera en móviles
      })

      // Guardar referencia al stream para poder detenerlo después
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
    }
  }

  // Método para detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Método para capturar una imagen de la cámara
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // Ajustar el tamaño del canvas al video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Dibujar el fotograma actual en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convertir el canvas a una URL de datos (base64)
        const imageDataUrl = canvas.toDataURL("image/jpeg")
        setCapturedImage(imageDataUrl)

        // Detener la cámara después de capturar
        stopCamera()
      }
    }
  }

  // Método para subir la imagen capturada
  const uploadCapturedImage = async () => {
    if (!capturedImage) return

    try {
      setIsUploading(true)
      setError(null)

      // Subir la imagen a WordPress
      const imageUrl = await uploadImage(capturedImage, `product_${Date.now()}.jpg`)

      // Llamar al callback con la URL de la imagen
      onImageCapture(imageUrl)

      // Limpiar el estado
      setCapturedImage(null)
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Error al subir la imagen. Inténtalo de nuevo.")
    } finally {
      setIsUploading(false)
    }
  }

  // Método para manejar la selección de archivos
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploading(true)
      setError(null)

      const file = files[0]

      // Convertir el archivo a base64
      const base64 = await fileToBase64(file)

      // Subir la imagen a WordPress
      const imageUrl = await uploadImage(base64, `product_${Date.now()}.jpg`)

      // Llamar al callback con la URL de la imagen
      onImageCapture(imageUrl)

      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Error processing file:", err)
      setError("Error al procesar el archivo. Inténtalo de nuevo.")
    } finally {
      setIsUploading(false)
    }
  }

  // Método para reiniciar el proceso
  const resetCapture = () => {
    setCapturedImage(null)
    setError(null)
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!capturedImage ? (
        <div className="space-y-3">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "200px" }}>
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>

            {!streamRef.current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-center px-4">
                  Haz clic en "Activar cámara" para tomar una foto del producto
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-3">
            {streamRef.current ? (
              <button
                onClick={captureImage}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Capturar
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Activar cámara
              </button>
            )}

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <RotateCw className="inline-block w-4 h-4 mr-1 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="inline-block w-4 h-4 mr-1" />
                    Subir imagen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "200px" }}>
            <img
              src={capturedImage || "/placeholder.svg"}
              alt="Imagen capturada"
              className="w-full h-full object-contain"
            />
            <button
              onClick={resetCapture}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
              title="Eliminar imagen"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={uploadCapturedImage}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <RotateCw className="inline-block w-4 h-4 mr-1 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Usar esta imagen"
              )}
            </button>
            <button
              onClick={resetCapture}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              disabled={isUploading}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Canvas oculto para capturar la imagen */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  )
}
