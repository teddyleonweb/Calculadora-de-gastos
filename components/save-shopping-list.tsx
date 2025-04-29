"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import type { Product, Store } from "../types"
import { ShoppingListService } from "../services/shopping-list-service"

interface SaveShoppingListProps {
  userId: string
  stores: Store[]
  products: Product[]
  onSaved: () => void
}

export default function SaveShoppingList({ userId, stores, products, onSaved }: SaveShoppingListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [listName, setListName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSave = () => {
    if (!listName.trim()) {
      setErrorMessage("Por favor ingrese un nombre para la lista")
      return
    }

    if (products.length === 0) {
      setErrorMessage("No hay productos para guardar")
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      ShoppingListService.saveShoppingList(userId, listName, stores, products)
      setSuccessMessage("Lista guardada correctamente")
      setListName("")
      setIsOpen(false)
      onSaved()
    } catch (error) {
      setErrorMessage("Error al guardar la lista")
      console.error("Error al guardar la lista:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      >
        <Save size={18} />
        <span>Guardar lista</span>
      </button>
    )
  }

  return (
    <div className="bg-white p-4 border border-gray-200 rounded shadow-md">
      <h3 className="text-lg font-semibold mb-3">Guardar lista de compras</h3>

      {errorMessage && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{errorMessage}</div>
      )}

      {successMessage && (
        <div className="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {successMessage}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la lista
        </label>
        <input
          id="list-name"
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="Ej: Compra semanal"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={isSaving}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={isSaving}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  )
}
