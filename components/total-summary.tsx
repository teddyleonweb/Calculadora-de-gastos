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

  // Agrupar productos por tienda para el resumen
  const productsByStore: { [key: string]: Product[] } = {}
  if (showBreakdown) {
    products.forEach((product) => {
      if (!productsByStore[product.storeId]) {
        productsByStore[product.storeId] = []
      }
      productsByStore[product.storeId].push(product)
    })
  }

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
                <div key={store.id} className="mb-4">
                  <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                    <span className="font-bold text-lg">{store.name}</span>
                    <span className="font-bold text-lg">${storeSubtotals[store.id].toFixed(2)}</span>
                  </div>

                  {/* Lista de productos de esta tienda */}
                  <div className="mt-2 pl-2">
                    {productsByStore[store.id]?.map((product) => (
                      <div
                        key={product.id}
                        className="flex justify-between items-center py-1 border-b border-gray-200 text-sm"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{product.title}</span>
                          <span className="text-gray-600 ml-2">
                            ({product.quantity} x ${product.price.toFixed(2)})
                          </span>
                        </div>
                        <span className="font-medium">${(product.price * product.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-1 mt-1 text-sm">
                      <span className="text-gray-600">{productsByStore[store.id]?.length || 0} productos</span>
                      <span className="font-medium">Subtotal: ${storeSubtotals[store.id].toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-gray-500">
            <span className="font-bold text-xl">Total General:</span>
            <span className="text-2xl font-bold">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        // Mostrar solo el total de la tienda actual
        <div>
          <p className="text-2xl font-bold">${storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}</p>
          <p className="text-sm text-gray-600 mt-1">
            {products.filter((p) => p.storeId === activeStoreId).length} productos
          </p>
        </div>
      )}
    </div>
  )
}
