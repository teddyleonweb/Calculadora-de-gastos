"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Upload } from "lucide-react"

interface ImageUploaderProps {
  onImageCapture: (imageSrc: string) => void
}

export default function ImageUploader({ onImageCapture }: ImageUploaderProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Iniciar la cámara
  const startCamera = async () => {
    setError(null)
    setIsCapturing(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err)
      setError("No se pudo acceder a la cámara. Por favor, verifica los permisos.")
      setIsCapturing(false)
    }
  }

  // Detener la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }

  // Capturar imagen de la cámara
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // Establecer dimensiones del canvas al tamaño del video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Dibujar el frame actual del video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convertir el canvas a una imagen data URL
        const imageSrc = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageSrc)
        onImageCapture(imageSrc)

        // Detener la cámara después de capturar
        stopCamera()
      }
    }
  }

  // Manejar la carga de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]

    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecciona un archivo de imagen válido.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string
        setCapturedImage(imageSrc)
        onImageCapture(imageSrc)
      }
      reader.onerror = () => {
        setError("Error al leer el archivo. Por favor, intenta de nuevo.")
      }
      reader.readAsDataURL(file)
    }
  }

  // Cancelar la captura
  const cancelCapture = () => {
    stopCamera()
    setCapturedImage(null)
    setError(null)
  }

  // Abrir el selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mb-4 p-3 md:p-4 border border-gray-200 rounded">
      <h2 className="text-lg font-semibold mb-3">Capturar imagen</h2>

      {error && <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>}

      {isCapturing ? (
        <div className="space-y-3">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto border rounded"
              style={{ maxHeight: "50vh" }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={captureImage}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Capturar
            </button>
            <button
              onClick={cancelCapture}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startCamera}
            className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
          >
            <Camera size={20} /> Usar cámara
          </button>
          <button
            onClick={openFileSelector}
            className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
          >
            <Upload size={20} /> Subir imagen
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
            capture="environment"
          />
        </div>
      )}
    </div>
  )
}
