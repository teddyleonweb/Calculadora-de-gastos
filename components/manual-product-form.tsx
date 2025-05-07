"use client"

import type React from "react"

import { useState } from "react"
import { ScanBarcodeIcon } from "lucide-react"
// Importar el nuevo escáner simple
import SimpleBarcodeScanner from "./simple-barcode-scanner"

interface ManualProductFormProps {
  onAddProduct: (title: string, price: number, quantity: number, image?: string) => Promise<void>
  initialTitle?: string
  initialPrice?: string
}

export default function ManualProductForm({
  onAddProduct,
  initialTitle = "",
  initialPrice = "",
}: ManualProductFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [price, setPrice] = useState(initialPrice)
  const [quantity, setQuantity] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [productImage, setProductImage] = useState<string | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("El título del producto es obligatorio")
      return
    }

    const priceValue = Number.parseFloat(price)
    if (isNaN(priceValue) || priceValue <= 0) {
      setError("El precio debe ser un número positivo")
      return
    }

    const quantityValue = Number.parseInt(quantity)
    if (isNaN(quantityValue) || quantityValue <= 0) {
      setError("La cantidad debe ser un número entero positivo")
      return
    }

    try {
      setIsLoading(true)
      await onAddProduct(title, priceValue, quantityValue, productImage)
      // Resetear el formulario después de añadir el producto
      setTitle("")
      setPrice("")
      setQuantity("1")
      setProductImage(undefined)
    } catch (error) {
      console.error("Error al añadir producto:", error)
      setError("Error al añadir producto. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBarcodeScanned = async (barcode: string) => {
    console.log("Código de barras escaneado:", barcode)
    setShowBarcodeScanner(false)

    // Aquí podrías buscar información del producto usando el código de barras
    // Por ahora, simplemente establecemos el código como título
    setTitle(`Producto con código: ${barcode}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Añadir Producto Manualmente</h2>

      {error && <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto
          </label>
          <div className="flex">
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l px-3 py-2"
              placeholder="Ej: Leche Entera 1L"
            />
            <button
              type="button"
              onClick={() => setShowBarcodeScanner(true)}
              className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-r flex items-center"
              title="Escanear código de barras"
            >
              <ScanBarcodeIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Precio
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 pl-7 w-full"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            placeholder="1"
            min="1"
            step="1"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading}
        >
          {isLoading ? "Añadiendo..." : "Añadir Producto"}
        </button>
      </form>

      {showBarcodeScanner && (
        <SimpleBarcodeScanner onScan={handleBarcodeScanned} onClose={() => setShowBarcodeScanner(false)} />
      )}
    </div>
  )
}
