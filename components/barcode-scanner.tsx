"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Loader2, XCircle, ScanBarcodeIcon as BarcodeScan, Camera, AlertCircle } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "barcode-scanner-container"
  const streamRef = useRef<MediaStream | null>(null)

  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      stopCamera()
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch((error) => console.error("Error al detener el escáner:", error))
      }
    }
  }, [isScanning])

  // Método para iniciar la cámara (similar al de ImageUploader)
  const startCamera = async () => {
    try {
      setError(null)

      // Usar el mismo método que en ImageUploader
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Preferir cámara trasera en móviles
      })

      // Guardar referencia al stream para poder detenerlo después
      streamRef.current = stream

      // Si tenemos acceso a la cámara, iniciar el escáner
      startScanner(stream)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
      setIsScanning(false)
    }
  }

  // Método para detener la cámara (similar al de ImageUploader)
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().catch((error) => console.error("Error al detener el escáner:", error))
    }

    setIsScanning(false)
  }

  // Iniciar el escáner con el stream de la cámara ya obtenido
  const startScanner = async (stream: MediaStream) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerContainerId)
    }

    setIsScanning(true)

    try {
      // Configurar el escáner para usar el stream de la cámara
      await scannerRef.current.start(
        { facingMode: "environment" }, // Usar la cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5Qrcode.FORMATS.EAN_13,
            Html5Qrcode.FORMATS.EAN_8,
            Html5Qrcode.FORMATS.UPC_A,
            Html5Qrcode.FORMATS.UPC_E,
            Html5Qrcode.FORMATS.CODE_39,
            Html5Qrcode.FORMATS.CODE_128,
          ],
        },
        (decodedText) => {
          // Éxito: se ha escaneado un código de barras
          console.log("Código de barras escaneado:", decodedText)
          handleScan(decodedText)
        },
        (errorMessage) => {
          // Error o escaneo en progreso, no necesitamos hacer nada aquí
        },
      )
    } catch (err) {
      setIsScanning(false)
      setError("Error al iniciar el escáner. Intenta nuevamente.")
      console.error("Error al iniciar el escáner:", err)
      stopCamera()
    }
  }

  const handleScan = async (barcode: string) => {
    // Detener el escáner después de un escaneo exitoso
    stopCamera()
    // Llamar a la función de callback con el código de barras escaneado
    onScan(barcode)
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

        <div id={scannerContainerId} className="w-full h-64 bg-gray-100 rounded overflow-hidden mb-4">
          {!isScanning && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center px-4">
                Haz clic en "Iniciar Escaneo" para activar la cámara y escanear un código de barras
              </p>
            </div>
          )}
          {/* Video element for camera preview */}
          <video ref={videoRef} className={`w-full h-full object-cover ${!isScanning ? "hidden" : ""}`}></video>
        </div>

        <div className="flex justify-center space-x-4">
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
      </div>
    </div>
  )
}
