"use client"

import { useState } from "react"

interface ManualProductFormProps {
  onAddProduct: (title: string, price: number, quantity: number) => void
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

    onAddProduct(manualTitle, price, quantity)
    setManualTitle("")
    setManualPrice("")
    setManualQuantity("1")
    setErrorMessage(null)
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
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
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
                type="number"
                min="1"
                value={manualQuantity}
                onChange={(e) => setManualQuantity(e.target.value)}
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
      </div>
    </div>
  )
}
