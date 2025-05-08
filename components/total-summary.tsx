"use client"

import type { Product, Store } from "../types"

// Modificar la interfaz TotalSummaryProps para incluir el filtro de fecha y mes
interface TotalSummaryProps {
  products: Product[]
  stores: Store[]
  activeStoreId: string
  storeSubtotals: { [key: string]: number }
  exchangeRates: { bcv: string; parallel: string } // Añadir las tasas de cambio
  dateFilter?: string | null // Añadir el filtro de fecha
  monthFilter?: string | null // Añadir el filtro de mes
}

export default function TotalSummary({
  products,
  stores,
  activeStoreId,
  storeSubtotals,
  exchangeRates,
  dateFilter = null, // Añadir el filtro de fecha con valor por defecto null
  monthFilter = null, // Añadir el filtro de mes con valor por defecto null
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

  // Modificar la función calculateFilteredTotal para que funcione con filtros de día y mes
  const calculateFilteredTotal = () => {
    if (!dateFilter && !monthFilter) return null

    // Filtrar productos por fecha/mes y tienda activa
    const filteredProducts = products.filter((product) => {
      if (!product.createdAt) return false

      // Verificar si el producto pertenece a la tienda activa (o cualquier tienda si estamos en "total")
      const belongsToActiveStore = activeStoreId === "total" || product.storeId === activeStoreId
      if (!belongsToActiveStore) return false

      // Extraer la fecha del producto
      const productDate = new Date(product.createdAt).toISOString().split("T")[0]

      // Si hay un filtro de día activo
      if (dateFilter) {
        return productDate === dateFilter
      }

      // Si hay un filtro de mes activo
      if (monthFilter) {
        // Extraer el año y mes (YYYY-MM) para comparar
        const productMonth = productDate.substring(0, 7)
        return productMonth === monthFilter
      }

      return false
    })

    // Calcular total de productos filtrados
    const filteredTotal = filteredProducts.reduce((sum, product) => {
      return sum + product.price * product.quantity
    }, 0)

    return {
      total: filteredTotal,
      count: filteredProducts.length,
    }
  }

  const filteredData = calculateFilteredTotal()

  // Función para formatear el período de filtro (día o mes)
  const formatFilterPeriod = () => {
    if (dateFilter) {
      return new Date(dateFilter).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } else if (monthFilter) {
      const [year, month] = monthFilter.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, 1)
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    }
    return ""
  }

  // Modificar el return para mostrar el total filtrado por fecha o mes
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">Total</h2>

      {(dateFilter || monthFilter) && filteredData !== null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">
            {activeStoreId === "total"
              ? "Total general"
              : `Total en ${stores.find((s) => s.id === activeStoreId)?.name || "esta tienda"}`}{" "}
            {dateFilter ? "del día" : "del mes de"} {formatFilterPeriod()}:
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1">
            <div className="font-bold text-xl">${filteredData.total.toFixed(2)}</div>
            <div className="text-sm text-gray-600">
              <div>BCV: Bs. {convertToBolivares(filteredData.total, exchangeRates.bcv)}</div>
              <div>Paralelo: Bs. {convertToBolivares(filteredData.total, exchangeRates.parallel)}</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {filteredData.count} producto{filteredData.count !== 1 ? "s" : ""} en este {dateFilter ? "día" : "mes"}
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
              .map((store) => {
                // Filtrar productos por tienda y fecha/mes si hay un filtro activo
                const storeProducts = (() => {
                  if (dateFilter) {
                    return (
                      productsByStore[store.id]?.filter((product) => {
                        if (!product.createdAt) return false
                        const productDate = new Date(product.createdAt).toISOString().split("T")[0]
                        return productDate === dateFilter
                      }) || []
                    )
                  } else if (monthFilter) {
                    return (
                      productsByStore[store.id]?.filter((product) => {
                        if (!product.createdAt) return false
                        const productDate = new Date(product.createdAt).toISOString().split("T")[0]
                        const productMonth = productDate.substring(0, 7)
                        return productMonth === monthFilter
                      }) || []
                    )
                  } else {
                    return productsByStore[store.id] || []
                  }
                })()

                // Calcular el subtotal de la tienda para los productos filtrados
                const filteredStoreSubtotal = storeProducts.reduce(
                  (sum, product) => sum + product.price * product.quantity,
                  0,
                )

                // Si hay un filtro activo y no hay productos para esta tienda en ese período, no mostrar la tienda
                if ((dateFilter || monthFilter) && storeProducts.length === 0) return null

                return (
                  <div key={store.id} className="mb-4">
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">{store.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          $
                          {dateFilter || monthFilter
                            ? filteredStoreSubtotal.toFixed(2)
                            : storeSubtotals[store.id].toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">
                          BCV: Bs.{" "}
                          {convertToBolivares(
                            dateFilter || monthFilter ? filteredStoreSubtotal : storeSubtotals[store.id],
                            exchangeRates.bcv,
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Paralelo: Bs.{" "}
                          {convertToBolivares(
                            dateFilter || monthFilter ? filteredStoreSubtotal : storeSubtotals[store.id],
                            exchangeRates.parallel,
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lista de productos de esta tienda */}
                    <div className="mt-2 pl-2">
                      {storeProducts.map((product) => (
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
                              Paralelo: Bs.{" "}
                              {convertToBolivares(product.price * product.quantity, exchangeRates.parallel)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-1 mt-1 text-sm">
                        <span className="text-gray-600">{storeProducts.length} productos</span>
                        <span className="font-medium">
                          Subtotal: $
                          {(dateFilter || monthFilter ? filteredStoreSubtotal : storeSubtotals[store.id]).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-gray-500">
            <span className="font-bold text-xl">Total General:</span>
            <div className="text-right">
              {dateFilter || monthFilter ? (
                <div className="text-2xl font-bold">${filteredData?.total.toFixed(2) || "0.00"}</div>
              ) : (
                <div className="text-2xl font-bold">${grandTotal.toFixed(2)}</div>
              )}
              <div className="text-sm text-gray-600">
                BCV: Bs.{" "}
                {convertToBolivares(
                  dateFilter || monthFilter ? filteredData?.total || 0 : grandTotal,
                  exchangeRates.bcv,
                )}
              </div>
              <div className="text-sm text-gray-600">
                Paralelo: Bs.{" "}
                {convertToBolivares(
                  dateFilter || monthFilter ? filteredData?.total || 0 : grandTotal,
                  exchangeRates.parallel,
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mostrar solo el total de la tienda actual
        <div>
          <div className="text-right">
            {dateFilter || monthFilter ? (
              <p className="text-2xl font-bold">${filteredData?.total.toFixed(2) || "0.00"}</p>
            ) : (
              <p className="text-2xl font-bold">${storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}</p>
            )}
            <div className="text-sm text-gray-600 mt-1">
              <div>
                BCV: Bs.{" "}
                {convertToBolivares(
                  dateFilter || monthFilter ? filteredData?.total || 0 : storeSubtotals[activeStoreId] || 0,
                  exchangeRates.bcv,
                )}
              </div>
              <div>
                Paralelo: Bs.{" "}
                {convertToBolivares(
                  dateFilter || monthFilter ? filteredData?.total || 0 : storeSubtotals[activeStoreId] || 0,
                  exchangeRates.parallel,
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {dateFilter || monthFilter
              ? `${filteredData?.count || 0} productos en este ${dateFilter ? "día" : "mes"}`
              : `${products.filter((p) => p.storeId === activeStoreId).length} productos`}
          </p>
        </div>
      )}
    </div>
  )
}
