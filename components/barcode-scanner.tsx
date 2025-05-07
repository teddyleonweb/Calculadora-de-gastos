"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Loader2, XCircle, ScanBarcodeIcon as BarcodeScan } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "barcode-scanner-container"

  useEffect(() => {
    // Inicializar el escáner cuando el componente se monta
    scannerRef.current = new Html5Qrcode(scannerContainerId)

    // Limpiar cuando el componente se desmonta
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch((error) => console.error("Error al detener el escáner:", error))
      }
    }
  }, [isScanning])

  const startScanner = async () => {
    if (!scannerRef.current) return

    setIsScanning(true)
    setError(null)

    try {
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
          // console.error("Error durante el escaneo:", errorMessage);
        },
      )
    } catch (err) {
      setIsScanning(false)
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
      console.error("Error al iniciar el escáner:", err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        setIsScanning(false)
      } catch (error) {
        console.error("Error al detener el escáner:", error)
      }
    }
  }

  const handleScan = async (barcode: string) => {
    // Detener el escáner después de un escaneo exitoso
    await stopScanner()
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

        {error && <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <div id={scannerContainerId} className="w-full h-64 bg-gray-100 rounded overflow-hidden mb-4">
          {!isScanning && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <BarcodeScan className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center">
                Haz clic en "Iniciar Escaneo" para activar la cámara y escanear un código de barras
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          {!isScanning ? (
            <Button onClick={startScanner} className="bg-blue-500 hover:bg-blue-700">
              Iniciar Escaneo
            </Button>
          ) : (
            <Button onClick={stopScanner} className="bg-red-500 hover:bg-red-700">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detener Escaneo
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
