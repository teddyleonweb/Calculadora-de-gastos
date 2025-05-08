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

  // Modificar la función getDateOnly para asegurar una comparación correcta de fechas
  // Reemplazar la función getDateOnly (aproximadamente línea 30) con esta versión:

  // Función para comparar si dos fechas son el mismo día
  const isSameDay = (date1: string, date2: string): boolean => {
    try {
      const d1 = new Date(date1)
      const d2 = new Date(date2)

      return (
        d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate()
      )
    } catch (error) {
      console.error("Error al comparar fechas:", error)
      return false
    }
  }

  // Agrupar productos por tienda para el resumen
  const productsByStore: { [key: string]: Product[] } = {}

  // Inicializar los subtotales filtrados
  const filteredStoreSubtotals: { [key: string]: number } = {}
  stores.forEach((store) => {
    filteredStoreSubtotals[store.id] = 0
    productsByStore[store.id] = []
  })

  // Modificar también la parte donde se filtran los productos por fecha (aproximadamente línea 50):
  // Agrupar productos por tienda y calcular subtotales filtrados
  products.forEach((product) => {
    // Verificar si el producto tiene fecha y si coincide con el filtro
    let includeInFiltered = true
    if (dateFilter && product.createdAt) {
      includeInFiltered = isSameDay(product.createdAt, dateFilter)
    }

    // Agrupar para el desglose
    if (!productsByStore[product.storeId]) {
      productsByStore[product.storeId] = []
    }

    // Solo añadir el producto si pasa el filtro de fecha
    if (includeInFiltered) {
      productsByStore[product.storeId].push(product)
      // Calcular subtotales filtrados
      filteredStoreSubtotals[product.storeId] += product.price * product.quantity
    }
  })

  // Calcular el total general filtrado
  const filteredGrandTotal = Object.values(filteredStoreSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

  // Función para convertir dólares a bolívares
  const convertToBolivares = (dollarAmount: number, rate: string): string => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return "N/A"
    return (dollarAmount * rateValue).toFixed(2)
  }

  // Modificar también la función calculateFilteredTotal (aproximadamente línea 80):
  const calculateFilteredTotal = () => {
    if (!dateFilter) return null

    // Filtrar productos por fecha
    const filteredProducts = products.filter((product) => {
      if (!product.createdAt) return false

      // En la vista Total, incluir productos de todas las tiendas
      // En otras vistas, solo incluir productos de la tienda activa
      const belongsToActiveStore = activeStoreId === "total" || product.storeId === activeStoreId

      const isMatchingDate = isSameDay(product.createdAt, dateFilter)

      return belongsToActiveStore && isMatchingDate
    })

    // Calcular total de productos filtrados
    const filteredTotal = filteredProducts.reduce((sum, product) => {
      return sum + product.price * product.quantity
    }, 0)

    return {
      total: filteredTotal,
      count: filteredProducts.length,
      products: filteredProducts,
    }
  }

  const filteredData = calculateFilteredTotal()

  // Modificar el return para mostrar el total filtrado por fecha
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">Total</h2>

      {dateFilter && filteredData !== null && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">
            {activeStoreId === "total"
              ? "Total general"
              : `Total en ${stores.find((s) => s.id === activeStoreId)?.name || "esta tienda"}`}{" "}
            del día{" "}
            {new Date(dateFilter).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            :
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1">
            <div className="font-bold text-xl">
              ${activeStoreId === "total" ? filteredGrandTotal.toFixed(2) : filteredData.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              <div>
                BCV: Bs.{" "}
                {convertToBolivares(
                  activeStoreId === "total" ? filteredGrandTotal : filteredData.total,
                  exchangeRates.bcv,
                )}
              </div>
              <div>
                Paralelo: Bs.{" "}
                {convertToBolivares(
                  activeStoreId === "total" ? filteredGrandTotal : filteredData.total,
                  exchangeRates.parallel,
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {activeStoreId === "total"
                ? products.filter((p) => dateFilter && p.createdAt && isSameDay(p.createdAt, dateFilter)).length
                : filteredData.count}{" "}
              producto
              {(activeStoreId === "total"
                ? products.filter((p) => dateFilter && p.createdAt && isSameDay(p.createdAt, dateFilter)).length
                : filteredData.count) !== 1
                ? "s"
                : ""}{" "}
              en este día
            </div>
          </div>
        </div>
      )}

      {showBreakdown ? (
        <div>
          {/* Mostrar desglose por tienda */}
          <div className="mb-4">
            {stores
              .filter(
                (store) =>
                  store.id !== "total" &&
                  (dateFilter ? filteredStoreSubtotals[store.id] > 0 : storeSubtotals[store.id] > 0),
              )
              .map((store) => {
                // Obtener los productos de esta tienda (ya filtrados por fecha si hay filtro)
                const storeProducts = productsByStore[store.id] || []

                // Calcular el subtotal de la tienda para los productos filtrados
                const filteredStoreSubtotal = storeProducts.reduce(
                  (sum, product) => sum + product.price * product.quantity,
                  0,
                )

                // Si hay un filtro de fecha y no hay productos para esta tienda en esa fecha, no mostrar la tienda
                if (dateFilter && storeProducts.length === 0) return null

                return (
                  <div key={store.id} className="mb-4">
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">{store.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          ${dateFilter ? filteredStoreSubtotal.toFixed(2) : storeSubtotals[store.id].toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">
                          BCV: Bs.{" "}
                          {convertToBolivares(
                            dateFilter ? filteredStoreSubtotal : storeSubtotals[store.id],
                            exchangeRates.bcv,
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Paralelo: Bs.{" "}
                          {convertToBolivares(
                            dateFilter ? filteredStoreSubtotal : storeSubtotals[store.id],
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
                          {dateFilter ? filteredStoreSubtotal.toFixed(2) : storeSubtotals[store.id].toFixed(2)}
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
              {dateFilter ? (
                <div className="text-2xl font-bold">${filteredGrandTotal.toFixed(2)}</div>
              ) : (
                <div className="text-2xl font-bold">${grandTotal.toFixed(2)}</div>
              )}
              <div className="text-sm text-gray-600">
                BCV: Bs. {convertToBolivares(dateFilter ? filteredGrandTotal : grandTotal, exchangeRates.bcv)}
              </div>
              <div className="text-sm text-gray-600">
                Paralelo: Bs. {convertToBolivares(dateFilter ? filteredGrandTotal : grandTotal, exchangeRates.parallel)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mostrar solo el total de la tienda actual
        <div>
          <div className="text-right">
            {dateFilter ? (
              <p className="text-2xl font-bold">${filteredData?.total.toFixed(2) || "0.00"}</p>
            ) : (
              <p className="text-2xl font-bold">${storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}</p>
            )}
            <div className="text-sm text-gray-600 mt-1">
              <div>
                BCV: Bs.{" "}
                {convertToBolivares(
                  dateFilter ? filteredData?.total || 0 : storeSubtotals[activeStoreId] || 0,
                  exchangeRates.bcv,
                )}
              </div>
              <div>
                Paralelo: Bs.{" "}
                {convertToBolivares(
                  dateFilter ? filteredData?.total || 0 : storeSubtotals[activeStoreId] || 0,
                  exchangeRates.parallel,
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {dateFilter
              ? `${filteredData?.count || 0} productos en este día`
              : `${products.filter((p) => p.storeId === activeStoreId).length} productos`}
          </p>
        </div>
      )}
    </div>
  )
}
