"use client"

import type React from "react"
import { useState } from "react"

interface ManualProductFormProps {
  onAddProduct: (title: string, price: number, quantity: number, image?: string) => Promise<void>
  initialTitle?: string
  initialPrice?: string
}

const ManualProductForm: React.FC<ManualProductFormProps> = ({
  onAddProduct,
  initialTitle = "",
  initialPrice = "",
}) => {
  const [title, setTitle] = useState(initialTitle)
  const [price, setPrice] = useState(initialPrice)
  const [quantity, setQuantity] = useState("1")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && !isNaN(Number(price)) && !isNaN(Number(quantity))) {
      onAddProduct(title.trim(), Number(price), Number(quantity))
      setTitle("")
      setPrice("")
      setQuantity("1")
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-bold mb-4">Añadir Producto Manualmente</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Precio
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
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
            min="1"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
          Añadir Producto
        </button>
      </form>
    </div>
  )
}

export default ManualProductForm
