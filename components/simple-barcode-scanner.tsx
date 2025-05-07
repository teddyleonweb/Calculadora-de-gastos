"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Loader2, XCircle, ScanBarcodeIcon as BarcodeScan, Camera, AlertCircle } from "lucide-react"
import jsQR from "jsqr"

interface SimpleBarcodeScanner {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function SimpleBarcodeScanner({ onScan, onClose }: SimpleBarcodeScanner) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Método para iniciar la cámara (exactamente igual que en ImageUploader)
  const startCamera = async () => {
    try {
      setError(null)
      setIsScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Preferir cámara trasera en móviles
      })

      // Guardar referencia al stream para poder detenerlo después
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          startScanningLoop()
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
      setIsScanning(false)
    }
  }

  // Método para detener la cámara (exactamente igual que en ImageUploader)
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
  }

  // Iniciar el bucle de escaneo
  const startScanningLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = setInterval(() => {
      scanVideoFrame()
    }, 200) // Escanear cada 200ms
  }

  // Escanear un fotograma del video
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Ajustar el tamaño del canvas al video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar el fotograma actual en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Obtener los datos de la imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    try {
      // Intentar decodificar un código QR (que también puede ser un código de barras en algunos casos)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        console.log("Código escaneado:", code.data)
        handleScan(code.data)
      }
    } catch (error) {
      console.error("Error al escanear:", error)
    }
  }

  const handleScan = (barcode: string) => {
    // Detener el escáner después de un escaneo exitoso
    stopCamera()
    // Llamar a la función de callback con el código de barras escaneado
    onScan(barcode)
  }

  // Función para ingresar manualmente un código de barras
  const [manualCode, setManualCode] = useState("")

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Escáner de Códigos de Barras</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error:</p>
              <p>{error}</p>
              <p className="mt-2 text-sm">Asegúrate de que:</p>
              <ul className="list-disc list-inside text-sm">
                <li>Tu dispositivo tiene una cámara funcional</li>
                <li>Has concedido permisos de cámara a este sitio web</li>
                <li>Ninguna otra aplicación está usando la cámara</li>
              </ul>
            </div>
          </div>
        )}

        <div className="w-full h-64 bg-gray-100 rounded overflow-hidden mb-4 relative">
          {!isScanning && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center px-4">
                Haz clic en "Iniciar Escaneo" para activar la cámara y escanear un código de barras
              </p>
            </div>
          )}
          {/* Video element for camera preview */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${!isScanning ? "hidden" : ""}`}
            playsInline
            autoPlay
          ></video>

          {/* Canvas para procesar la imagen (oculto) */}
          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Overlay para ayudar al usuario a alinear el código */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="border-2 border-red-500 w-64 h-32 opacity-70 flex items-center justify-center">
                <span className="text-red-500 text-xs bg-white px-2 py-1 rounded">Alinea el código aquí</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4 mb-4">
          {!isScanning ? (
            <button
              onClick={startCamera}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <BarcodeScan className="w-5 h-5 mr-2" />
              Iniciar Escaneo
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Detener Escaneo
            </button>
          )}
        </div>

        {/* Opción para ingresar código manualmente */}
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium mb-2">¿Problemas con la cámara? Ingresa el código manualmente:</h3>
          <form onSubmit={handleManualSubmit} className="flex">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej: 7501234567890"
              className="flex-1 border rounded-l px-3 py-2"
            />
            <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-r">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
