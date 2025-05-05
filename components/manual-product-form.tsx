"use client"

import { useState } from "react"
import ImageUploader from "./image-uploader"
import { X } from "lucide-react"
import ImageWithFallback from "./image-with-fallback"

// Corregir la interfaz ManualProductFormProps para que coincida con cómo se usa en home.tsx

// Cambiar esta interfaz:
// interface ManualProductFormProps {
//   onAddProduct: (title: string, price: number, quantity: number, image?: string) => void
//   initialTitle?: string
//   initialPrice?: string
// }

// Por esta:
interface ManualProductFormProps {
  product: Partial<Product> | null
  onSubmit: (product: Partial<Product>) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

// Definir la interfaz Product
interface Product {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
}

// Y actualizar la función para usar los nuevos props:
export default function ManualProductForm({ product, onSubmit, onCancel, isSubmitting }: ManualProductFormProps) {
  const [manualTitle, setManualTitle] = useState<string>(product?.title || "")
  const [manualPrice, setManualPrice] = useState<string>(product?.price ? product.price.toString() : "")
  const [manualQuantity, setManualQuantity] = useState<string>(product?.quantity ? product.quantity.toString() : "1")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Añadir estado para la imagen
  const [productImage, setProductImage] = useState<string | null>(product?.image || null)
  const [showImageUploader, setShowImageUploader] = useState<boolean>(false)

  // Actualizar handleAddProduct para usar onSubmit
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
    onSubmit({
      title: manualTitle,
      price,
      quantity,
      image: productImage || undefined,
    })
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

  return (
    <div className="mb-4 p-3 md:p-4 border border-gray-200 rounded">
      <h3 className="text-lg font-semibold mb-3">Añadir producto manualmente</h3>
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{errorMessage}</div>
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
      </div>
    </div>
  )
}
