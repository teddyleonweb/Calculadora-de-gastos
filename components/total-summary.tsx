"use client"

import { useState } from "react"
import type { Product, Store } from "../types"

interface TotalSummaryProps {
  products: Product[]
  stores: Store[]
  activeStoreId: string
  storeSubtotals: { [key: string]: number }
}

export default function TotalSummary({ products, stores, activeStoreId, storeSubtotals }: TotalSummaryProps) {
  const [showDetails, setShowDetails] = useState<boolean>(false)

  // Calcular el total general
  const totalAmount = Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

  // Obtener el nombre de la tienda activa
  const activeStore = stores.find((store) => store.id === activeStoreId)

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">
          {activeStore?.name === "Total" ? "Total general" : `Total en ${activeStore?.name || "tienda"}`}
        </h3>
        <span className="text-xl font-bold">
          {activeStore?.name === "Total" ? totalAmount.toFixed(2) : storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}
          €
        </span>
      </div>

      {activeStore?.name === "Total" && (
        <div>
          <button onClick={() => setShowDetails(!showDetails)} className="text-blue-500 hover:text-blue-700 text-sm">
            {showDetails ? "Ocultar detalles" : "Mostrar detalles por tienda"}
          </button>

          {showDetails && (
            <div className="mt-2">
              <ul className="space-y-1">
                {stores
                  .filter((store) => store.name !== "Total")
                  .map((store) => (
                    <li key={store.id} className="flex justify-between text-sm">
                      <span>{store.name}</span>
                      <span>{storeSubtotals[store.id]?.toFixed(2) || "0.00"}€</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
