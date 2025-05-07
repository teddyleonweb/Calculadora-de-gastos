"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Loader2, XCircle, Camera, AlertCircle } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScannerV2({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const quaggaRef = useRef<any>(null)

  // Cargar Quagga dinámicamente para evitar problemas con SSR
  useEffect(() => {
    const loadQuagga = async () => {
      try {
        // Importar Quagga2 dinámicamente
        const Quagga = (await import("@ericblade/quagga2")).default
        quaggaRef.current = Quagga
      } catch (err) {
        console.error("Error loading Quagga:", err)
        setError("No se pudo cargar el escáner de códigos de barras")
      }
    }

    loadQuagga()

    // Limpiar al desmontar
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    if (!quaggaRef.current) {
      setError("El escáner no está listo. Por favor, espera un momento y vuelve a intentarlo.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const Quagga = quaggaRef.current

      // Detener cualquier instancia previa
      Quagga.stop()

      // Iniciar el escáner
      await Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment", // Usar cámara trasera en móviles
              width: { min: 640 },
              height: { min: 480 },
              aspectRatio: { min: 1, max: 2 },
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: navigator.hardwareConcurrency || 4,
          frequency: 10,
          decoder: {
            readers: [
              "ean_reader",
              "ean_8_reader",
              "upc_reader",
              "code_128_reader",
              "code_39_reader",
              "code_93_reader",
              "codabar_reader",
            ],
          },
          locate: true,
        },
        (err: any) => {
          if (err) {
            console.error("Error initializing Quagga:", err)
            setError("No se pudo iniciar la cámara. Verifica los permisos.")
            setIsLoading(false)
            return
          }

          // Registrar el evento de detección
          Quagga.onDetected(handleDetected)

          // Iniciar el escáner
          Quagga.start()
          setIsScanning(true)
          setIsLoading(false)
        },
      )
    } catch (err) {
      console.error("Error starting scanner:", err)
      setError("Error al iniciar el escáner. Verifica los permisos de la cámara.")
      setIsLoading(false)
    }
  }

  const stopScanner = () => {
    if (quaggaRef.current) {
      quaggaRef.current.stop()
    }
    setIsScanning(false)
  }

  const handleDetected = (result: any) => {
    // Verificar la calidad del escaneo
    if (result.codeResult && result.codeResult.code) {
      const code = result.codeResult.code
      console.log("Código detectado:", code)

      // Detener el escáner
      stopScanner()

      // Llamar a la función de callback con el código escaneado
      onScan(code)
    }
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
              <p className="mt-2 text-sm">Consejos para escanear:</p>
              <ul className="list-disc list-inside text-sm">
                <li>Asegúrate de que hay buena iluminación</li>
                <li>Mantén el código de barras a una distancia adecuada</li>
                <li>Evita reflejos o sombras sobre el código</li>
                <li>Mantén el dispositivo estable</li>
              </ul>
            </div>
          </div>
        )}

        <div ref={scannerRef} className="w-full h-64 bg-gray-100 rounded overflow-hidden mb-4 relative">
          {!isScanning && !isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center px-4">
                Haz clic en "Iniciar Escaneo" para activar la cámara y escanear un código de barras
              </p>
            </div>
          )}

          {isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-2" />
              <p className="text-gray-700 text-center">Iniciando cámara...</p>
            </div>
          )}

          {/* Quagga insertará el video aquí cuando se inicie */}

          {/* Guía visual para el escaneo */}
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
              onClick={startScanner}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Iniciar Escaneo
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Detener Escaneo
            </button>
          )}
        </div>

        {/* Opción para ingresar código manualmente */}
        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium mb-2">¿Problemas con el escaneo? Ingresa el código manualmente:</h3>
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
