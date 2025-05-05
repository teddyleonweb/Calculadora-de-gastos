"use client"

import type React from "react"

import { useRef, useState } from "react"

interface ImageUploaderProps {
  onImageCapture: (imageSrc: string) => void
}

export default function ImageUploader({ onImageCapture }: ImageUploaderProps) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Modificar la función handleImageChange para añadir más logs
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      console.log("Cargando imagen desde archivo:", file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          console.log("Imagen cargada correctamente, llamando a onImageCapture")
          // Añadir un pequeño retraso para asegurar que la imagen se carga correctamente
          setTimeout(() => {
            onImageCapture(e.target.result as string)
          }, 100)
          setErrorMessage(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      setErrorMessage(null)
      setIsCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Preferir cámara trasera en móviles
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setErrorMessage("No se pudo acceder a la cámara")
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }

  // Modificar la función handleTakePhoto para añadir más logs
  const handleTakePhoto = async () => {
    if (!videoRef.current || !captureCanvasRef.current) return

    try {
      console.log("Tomando foto desde la cámara")
      const video = videoRef.current
      const canvas = captureCanvasRef.current

      // Ajustar el tamaño del canvas para dispositivos móviles
      const maxDimension = 1280 // Limitar a 1280px como máximo
      let width = video.videoWidth
      let height = video.videoHeight

      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension
        width = maxDimension
      } else if (height > width && height > maxDimension) {
        width = (width / height) * maxDimension
        height = maxDimension
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8) // Usar JPEG con compresión
        console.log("Foto tomada correctamente, llamando a onImageCapture")
        // Añadir un pequeño retraso para asegurar que la imagen se carga correctamente
        setTimeout(() => {
          onImageCapture(dataUrl)
        }, 100)
        stopCamera() // Detener la cámara después de tomar la foto
      }
    } catch (error) {
      console.error("Error al tomar la foto:", error)
      setErrorMessage("Error al capturar la imagen. Intente nuevamente.")
      stopCamera()
    }
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={openFileSelector}
        >
          Seleccionar imagen
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={startCamera}>
          Iniciar cámara
        </button>
      </div>

      {isCameraActive && (
        <div className="mb-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-lg mx-auto border border-gray-300 rounded"
            />
            <div className="mt-2 flex justify-center gap-2">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleTakePhoto}
              >
                Tomar foto
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                onClick={stopCamera}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={captureCanvasRef} style={{ display: "none" }} />

      {errorMessage && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>
      )}
    </div>
  )
}
