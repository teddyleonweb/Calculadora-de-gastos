"use client"

import { useState } from "react"
import ImageUploader from "./image-uploader"
import { X, ScanBarcodeIcon } from "lucide-react"
import ImageWithFallback from "./image-with-fallback"
// Importar el nuevo escáner de códigos de barras
import BarcodeScannerV2 from "./barcode-scanner-v2"

interface ManualProductFormProps {
  onAddProduct: (title: string, price: number, quantity: number, image?: string) => void
  initialTitle?: string
  initialPrice?: string
}

export default function ManualProductForm({
  onAddProduct,
  initialTitle = "",
  initialPrice = "",
}: ManualProductFormProps) {
  const [manualTitle, setManualTitle] = useState<string>(initialTitle)
  const [manualPrice, setManualPrice] = useState<string>(initialPrice)
  const [manualQuantity, setManualQuantity] = useState<string>("1")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Añadir estado para la imagen
  const [productImage, setProductImage] = useState<string | null>(null)
  const [showImageUploader, setShowImageUploader] = useState<boolean>(false)
  // Estado para el escáner de códigos de barras
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false)
  const [isLoadingBarcode, setIsLoadingBarcode] = useState<boolean>(false)
  // Añadir un nuevo estado para mensajes de éxito
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleAddProduct = () => {
    // Normalizar el precio: si ya tiene punto, dejarlo; si tiene coma, convertirla a punto
    let normalizedPrice = manualPrice
    if (!normalizedPrice.includes(".") && normalizedPrice.includes(",")) {
      normalizedPrice = normalizedPrice.replace(",", ".")
    }

    const price = Number.parseFloat(normalizedPrice)
    const quantity = Number.parseInt(manualQuantity, 10)

    if (!manualTitle.trim()) {
      setErrorMessage("Por favor ingrese un título para el producto")
      return
    }

    if (isNaN(price) || price <= 0) {
      setErrorMessage("Por favor ingrese un precio válido")
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Por favor ingrese una cantidad válida")
      return
    }

    // Pasar la imagen al añadir el producto
    onAddProduct(manualTitle, price, quantity, productImage || undefined)
    setManualTitle("")
    setManualPrice("")
    setManualQuantity("1")
    setProductImage(null)
    setErrorMessage(null)
  }

  // Función para manejar la captura de imagen
  const handleImageCapture = (imageSrc: string) => {
    setProductImage(imageSrc)
    setShowImageUploader(false)
  }

  // Función para eliminar la imagen
  const handleRemoveImage = () => {
    setProductImage(null)
  }

  // Función para manejar el escaneo de códigos de barras
  const handleBarcodeScan = async (barcode: string) => {
    try {
      setIsLoadingBarcode(true)
      setErrorMessage(null)

      // Importar el servicio de códigos de barras dinámicamente para evitar problemas con SSR
      const { BarcodeService } = await import("../services/barcode-service")

      // Buscar información del producto por código de barras
      const productInfo = await BarcodeService.searchByBarcode(barcode)

      if (productInfo.found && productInfo.product) {
        // Actualizar los campos del formulario con la información encontrada
        setManualTitle(productInfo.product.product_name || "")

        // Si el producto tiene un precio, actualizarlo
        if (productInfo.product.price) {
          setManualPrice(productInfo.product.price)
        }

        // Si el producto tiene una imagen, actualizarla
        if (productInfo.product.image_url) {
          setProductImage(productInfo.product.image_url)
        }

        // Mostrar mensaje de éxito
        setSuccessMessage(`Producto encontrado: ${productInfo.product.product_name}`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        // Si no se encontró el producto, mostrar un mensaje y solo establecer el código de barras como título
        setManualTitle(`Producto (Código: ${barcode})`)
        setErrorMessage(
          "No se encontró información para este código de barras. Se ha añadido el código como referencia.",
        )
      }
    } catch (error) {
      console.error("Error al procesar el código de barras:", error)
      setErrorMessage(
        `Error al procesar el código de barras: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setIsLoadingBarcode(false)
      setShowBarcodeScanner(false)
    }
  }

  return (
    <div className="mb-4 p-3 md:p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-3">Añadir producto manualmente</h3>
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {successMessage}
        </div>
      )}
      <div className="flex flex-col space-y-3">
        <div className="w-full">
          <label htmlFor="manual-title" className="text-sm text-gray-600 mb-1 block">
            Nombre del producto
          </label>
          <input
            id="manual-title"
            type="text"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Nombre del producto"
            className="border border-gray-300 rounded px-2 py-1 text-sm md:text-base w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="w-full sm:w-1/2">
            <label htmlFor="manual-price" className="text-sm text-gray-600 mb-1 block">
              Precio
            </label>
            <input
              id="manual-price"
              type="text"
              inputMode="decimal"
              value={manualPrice}
              onChange={(e) => {
                // Solo permitir números, punto y coma
                const value = e.target.value
                const filteredValue = value.replace(/[^0-9.,]/g, "")
                setManualPrice(filteredValue)
              }}
              placeholder="0.00"
              className="border border-gray-300 rounded px-2 py-1 text-sm md:text-base w-full"
            />
          </div>
          <div className="w-full sm:w-1/2">
            <label htmlFor="manual-quantity" className="text-sm text-gray-600 mb-1 block">
              Cantidad
            </label>
            <div className="flex gap-2 w-full">
              <input
                id="manual-quantity"
                type="text"
                inputMode="numeric"
                value={manualQuantity}
                onChange={(e) => {
                  // Solo permitir números enteros positivos
                  const value = e.target.value
                  const filteredValue = value.replace(/[^0-9]/g, "")
                  setManualQuantity(filteredValue)
                }}
                className="border border-gray-300 rounded px-2 py-1 w-16 text-sm md:text-base"
              />
              <button
                onClick={handleAddProduct}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 md:px-4 rounded flex-grow text-sm md:text-base"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>

        {/* Sección para la imagen */}
        <div className="w-full">
          <label className="text-sm text-gray-600 mb-1 block">Imagen del producto (opcional)</label>

          {productImage ? (
            <div className="relative w-full max-w-xs">
              <ImageWithFallback
                src={productImage || "/placeholder.svg"}
                alt="Vista previa del producto"
                className="w-full h-auto max-h-40 object-contain border rounded"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                title="Eliminar imagen"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              {showImageUploader ? (
                <div className="border border-gray-300 rounded p-2">
                  <ImageUploader onImageCapture={handleImageCapture} />
                  <button
                    onClick={() => setShowImageUploader(false)}
                    className="mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowImageUploader(true)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded text-sm"
                >
                  Añadir imagen
                </button>
              )}
            </>
          )}
        </div>

        {/* Botón para escanear código de barras */}
        <div className="w-full">
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded text-sm flex items-center"
            type="button"
          >
            <ScanBarcodeIcon className="w-4 h-4 mr-1" />
            Escanear código de barras
          </button>
        </div>

        {/* Componente de escáner de códigos de barras */}
        {showBarcodeScanner && (
          <BarcodeScannerV2 onScan={handleBarcodeScan} onClose={() => setShowBarcodeScanner(false)} />
        )}

        {/* Indicador de carga durante la búsqueda de información del código de barras */}
        {isLoadingBarcode && (
          <div className="mt-3 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Buscando información del producto...
          </div>
        )}
      </div>
    </div>
  )
}
