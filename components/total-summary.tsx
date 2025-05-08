"use client"

import type { Product, Store } from "../types"

// Modificar la interfaz TotalSummaryProps para incluir el filtro de fecha
interface TotalSummaryProps {
  products: Product[]
  stores: Store[]
  activeStoreId: string
  storeSubtotals: { [key: string]: number }
  exchangeRates: { bcv: string; parallel: string } // Añadir las tasas de cambio
  dateFilter?: string | null // Añadir el filtro de fecha
}

export default function TotalSummary({
  products,
  stores,
  activeStoreId,
  storeSubtotals,
  exchangeRates,
  dateFilter = null, // Añadir el filtro de fecha con valor por defecto null
}: TotalSummaryProps) {
  // Calcular el total general
  const grandTotal = Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

  // Si estamos en la vista de "Total", mostrar el desglose por tienda
  const totalStore = stores.find((store) => store.name === "Total")
  const showBreakdown = totalStore && activeStoreId === totalStore.id

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

  // Función para convertir dólares a bolívares
  const convertToBolivares = (dollarAmount: number, rate: string): string => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return "N/A"
    return (dollarAmount * rateValue).toFixed(2)
  }

  // Calcular el total filtrado por fecha si hay un filtro activo
  const calculateFilteredTotal = () => {
    if (!dateFilter) return null

    // Filtrar productos por fecha
    const filteredProducts = products.filter((product) => {
      if (!product.createdAt) return false
      const productDate = new Date(product.createdAt).toISOString().split("T")[0]
      return productDate === dateFilter
    })

    // Calcular total de productos filtrados
    const filteredTotal = filteredProducts.reduce((sum, product) => {
      return sum + product.price * product.quantity
    }, 0)

    return filteredTotal
  }

  const filteredTotal = calculateFilteredTotal()

  // Modificar el return para mostrar el total filtrado por fecha
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">Total</h2>

      {dateFilter && filteredTotal !== null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">
            Total del día{" "}
            {new Date(dateFilter).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            :
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1">
            <div className="font-bold text-xl">${filteredTotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">
              <div>BCV: Bs. {convertToBolivares(filteredTotal, exchangeRates.bcv)}</div>
              <div>Paralelo: Bs. {convertToBolivares(filteredTotal, exchangeRates.parallel)}</div>
            </div>
          </div>
        </div>
      )}

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
                    <div className="text-right">
                      <div className="font-bold text-lg">${storeSubtotals[store.id].toFixed(2)}</div>
                      <div className="text-xs text-gray-600">
                        BCV: Bs. {convertToBolivares(storeSubtotals[store.id], exchangeRates.bcv)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Paralelo: Bs. {convertToBolivares(storeSubtotals[store.id], exchangeRates.parallel)}
                      </div>
                    </div>
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
                        <div className="text-right">
                          <div className="font-medium">${(product.price * product.quantity).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            BCV: Bs. {convertToBolivares(product.price * product.quantity, exchangeRates.bcv)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Paralelo: Bs. {convertToBolivares(product.price * product.quantity, exchangeRates.parallel)}
                          </div>
                        </div>
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
            <div className="text-right">
              <div className="text-2xl font-bold">${grandTotal.toFixed(2)}</div>
              <div className="text-sm text-gray-600">BCV: Bs. {convertToBolivares(grandTotal, exchangeRates.bcv)}</div>
              <div className="text-sm text-gray-600">
                Paralelo: Bs. {convertToBolivares(grandTotal, exchangeRates.parallel)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mostrar solo el total de la tienda actual
        <div>
          <div className="text-right">
            <p className="text-2xl font-bold">${storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}</p>
            <div className="text-sm text-gray-600 mt-1">
              <div>BCV: Bs. {convertToBolivares(storeSubtotals[activeStoreId] || 0, exchangeRates.bcv)}</div>
              <div>Paralelo: Bs. {convertToBolivares(storeSubtotals[activeStoreId] || 0, exchangeRates.parallel)}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {products.filter((p) => p.storeId === activeStoreId).length} productos
          </p>
        </div>
      )}
    </div>
  )
}
