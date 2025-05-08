"use client"

import React from "react"
import type { Store } from "../types"

interface StoreSelectorProps {
  stores: Store[]
  activeStoreId: string
  onStoreChange: (storeId: string) => void
  onAddStore: (name: string) => Promise<void>
  onDeleteStore: (storeId: string) => Promise<void>
  onUpdateStore: (storeId: string, name: string, image?: string) => Promise<void>
}

const StoreSelector: React.FC<StoreSelectorProps> = ({
  stores,
  activeStoreId,
  onStoreChange,
  onAddStore,
  onDeleteStore,
  onUpdateStore,
}) => {
  const [newStoreName, setNewStoreName] = React.useState("")

  const handleAddStore = () => {
    if (newStoreName.trim()) {
      onAddStore(newStoreName.trim())
      setNewStoreName("")
    }
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-2">
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => onStoreChange(store.id)}
            className={`px-4 py-2 rounded-md ${
              activeStoreId === store.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          value={newStoreName}
          onChange={(e) => setNewStoreName(e.target.value)}
          placeholder="Nombre de nueva tienda"
          className="flex-grow px-3 py-2 border rounded-l-md"
        />
        <button onClick={handleAddStore} className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600">
          Añadir Tienda
        </button>
      </div>
    </div>
  )
}

export default StoreSelector
