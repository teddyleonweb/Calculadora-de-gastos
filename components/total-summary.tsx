"use client"

import type { Product, Store } from "../types"

interface TotalSummaryProps {
  products: Product[]
  stores: Store[]
  activeStoreId: string
  storeSubtotals: { [key: string]: number }
}

export default function TotalSummary({ products, stores, activeStoreId, storeSubtotals }: TotalSummaryProps) {
  // Calcular el total general
  const grandTotal = Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

  // Si estamos en la vista de "Total", mostrar el desglose por tienda
  const showBreakdown = activeStoreId === "total"

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">Total</h2>

      {showBreakdown ? (
        <div>
          {/* Mostrar desglose por tienda */}
          <div className="mb-4">
            {stores
              .filter((store) => store.id !== "total" && storeSubtotals[store.id] > 0)
              .map((store) => (
                <div key={store.id} className="flex justify-between items-center py-1 border-b border-gray-200">
                  <span>{store.name}:</span>
                  <span className="font-medium">${storeSubtotals[store.id].toFixed(2)}</span>
                </div>
              ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
            <span className="font-bold">Total General:</span>
            <span className="text-2xl font-bold">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        // Mostrar solo el total de la tienda actual
        <p className="text-2xl font-bold">${storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}</p>
      )}
    </div>
  )
}
