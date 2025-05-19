"use client"

// components/store-selector.tsx
// Verificar que no haya dependencias de Supabase

import type React from "react"
import { useState, useEffect } from "react"

interface Store {
  id: string
  name: string
}

interface StoreSelectorProps {
  onStoreSelect: (storeId: string) => void
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ onStoreSelect }) => {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  useEffect(() => {
    // Replace this with your actual data fetching logic
    const fetchStores = async () => {
      try {
        // Example data - replace with your API call
        const mockStores: Store[] = [
          { id: "store1", name: "Store A" },
          { id: "store2", name: "Store B" },
          { id: "store3", name: "Store C" },
        ]
        setStores(mockStores)
      } catch (error) {
        console.error("Error fetching stores:", error)
      }
    }

    fetchStores()
  }, [])

  const handleStoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = event.target.value
    setSelectedStoreId(storeId)
    onStoreSelect(storeId)
  }

  return (
    <div>
      <label htmlFor="storeSelect">Select a Store:</label>
      <select id="storeSelect" value={selectedStoreId || ""} onChange={handleStoreChange}>
        <option value="">-- Select a Store --</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default StoreSelector
