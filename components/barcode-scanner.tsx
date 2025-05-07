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
  const [permissionState, setPermissionState] = useState<string>("prompt") // 'prompt', 'granted', 'denied'
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "barcode-scanner-container"

  // Verificar el estado de los permisos de la cámara al cargar el componente
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Verificar si la API de permisos está disponible
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName })
          setPermissionState(result.state)

          // Escuchar cambios en el estado de los permisos
          result.onchange = () => {
            setPermissionState(result.state)
            if (result.state === "granted" && !isScanning) {
              // Si se conceden los permisos, intentar iniciar el escáner automáticamente
              startScanner()
            }
          }
        }
      } catch (err) {
        console.error("Error al verificar permisos de cámara:", err)
      }
    }

    checkCameraPermission()
  }, [])

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

  // Función para manejar la solicitud manual de permisos
  const requestCameraPermission = async () => {
    try {
      // Intentar acceder a la cámara para solicitar permisos
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      // Si llegamos aquí, los permisos fueron concedidos
      // Detener la transmisión ya que solo queríamos solicitar permisos
      stream.getTracks().forEach((track) => track.stop())

      // Actualizar el estado de los permisos
      setPermissionState("granted")

      // Iniciar el escáner
      startScanner()
    } catch (err) {
      console.error("Error al solicitar permisos de cámara:", err)
      setError("No se pudo obtener acceso a la cámara. Por favor, verifica la configuración de tu navegador.")
      setPermissionState("denied")
    }
  }

  // Renderizar instrucciones basadas en el estado de los permisos
  const renderPermissionInstructions = () => {
    if (permissionState === "denied") {
      return (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg mb-2">Permiso de cámara denegado</h3>
          <p className="mb-4">
            Has denegado el permiso para usar la cámara. Para escanear códigos de barras, necesitas permitir el acceso a
            la cámara.
          </p>

          <div className="space-y-2 text-left">
            <p className="font-semibold">Cómo habilitar la cámara:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Haz clic en el icono de candado o información en la barra de direcciones</li>
              <li>Busca la configuración de "Cámara" o "Permisos del sitio"</li>
              <li>Cambia el permiso de la cámara a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>

          <button
            onClick={requestCameraPermission}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Intentar nuevamente
          </button>
        </div>
      )
    }

    return null
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

        {renderPermissionInstructions()}

        <div id={scannerContainerId} className="w-full h-64 bg-gray-100 rounded overflow-hidden mb-4">
          {!isScanning && !error && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center px-4">
                Haz clic en "Iniciar Escaneo" para activar la cámara y escanear un código de barras
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          {!isScanning ? (
            <button
              onClick={startScanner}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <BarcodeScan className="w-5 h-5 mr-2" />
              Iniciar Escaneo
            </button>
          ) : (
            <button
              onClick={stopScanner}
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
