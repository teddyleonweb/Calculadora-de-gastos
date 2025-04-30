"use client"

import { useState } from "react"
import type { Store } from "../types"
import { Plus, X } from "lucide-react"

interface StoreSelectorProps {
  stores: Store[]
  activeStoreId: string
  onStoreChange: (storeId: string) => void
  onAddStore: (name: string) => void
  onDeleteStore: (storeId: string) => void
}

export default function StoreSelector({
  stores,
  activeStoreId,
  onStoreChange,
  onAddStore,
  onDeleteStore,
}: StoreSelectorProps) {
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [isAddingStore, setIsAddingStore] = useState<boolean>(false)

  const handleAddStore = () => {
    if (newStoreName.trim()) {
      onAddStore(newStoreName.trim())
      setNewStoreName("")
      setIsAddingStore(false)
    }
  }

  // Separar la tienda "Total" del resto de tiendas
  const totalStore = stores.find((store) => store.name === "Total")
  console.log("Tienda Total:", totalStore)
  // Filtrar las tiendas que no son "Total" y ordenarlas
  const regularStores = stores.filter((store) => store.name !== "Total")

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center border-b border-gray-200">
        {/* Primero mostrar las tiendas regulares */}
        {regularStores.map((store) => (
          <div key={store.id} className="relative">
            <button
              className={`py-2 px-4 ${
                activeStoreId === store.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } rounded-t-lg mr-1`}
              onClick={() => onStoreChange(store.id)}
            >
              {store.name}
            </button>
            {store.id !== "default" && (
              <button
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteStore(store.id)
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {/* Mostrar la tienda "Total" al final */}
        {totalStore && (
          <div className="relative">
            <button
              className={`py-2 px-4 ${
                activeStoreId === totalStore.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } rounded-t-lg mr-1`}
              onClick={() => onStoreChange(totalStore.id)}
            >
              {totalStore.name}
            </button>
            {/* No mostrar el botón de eliminar para la tienda "Total" */}
          </div>
        )}

        <div className="ml-2">
          {isAddingStore ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Nombre de tienda"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
                autoFocus
              />
              <button onClick={handleAddStore} className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                Añadir
              </button>
              <button
                onClick={() => {
                  setIsAddingStore(false)
                  setNewStoreName("")
                }}
                className="ml-1 bg-gray-500 text-white px-2 py-1 rounded text-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingStore(true)}
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-lg"
            >
              <Plus size={16} className="mr-1" /> Nueva tienda
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
