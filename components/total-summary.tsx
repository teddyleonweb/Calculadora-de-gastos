"use client"

import type { Product, Store } from "../types"

interface TotalSummaryProps {
  products: Product[]
  stores: Store[]
  activeStoreId: string
  storeSubtotals: { [key: string]: number }
  exchangeRates: { bcv: string; parallel: string; binance?: string }
  dateFilter?: string | null
}

export default function TotalSummary({
  products,
  stores,
  activeStoreId,
  storeSubtotals,
  exchangeRates,
  dateFilter = null,
}: TotalSummaryProps) {
  // Calcular el total general
  const grandTotal = Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

  // Si estamos en la vista de "Total", mostrar el desglose por tienda
  const totalStore = stores.find((store) => store.name === "Total")
  const showBreakdown = totalStore && activeStoreId === totalStore.id

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

  // Función para obtener valor numérico de bolívares
  const getBolivaresValue = (dollarAmount: number, rate: string): number => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return 0
    return dollarAmount * rateValue
  }

  // Función para calcular el total filtrado
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

  // Determinar qué total mostrar basado en si hay un filtro de fecha
  const totalToShow = dateFilter
    ? showBreakdown
      ? filteredGrandTotal
      : filteredData?.total || 0
    : showBreakdown
      ? grandTotal
      : storeSubtotals[activeStoreId] || 0

  // Determinar cuántos productos mostrar
  const productCount = dateFilter
    ? showBreakdown
      ? products.filter((p) => p.createdAt && isSameDay(p.createdAt, dateFilter)).length
      : filteredData?.count || 0
    : showBreakdown
      ? products.length
      : products.filter((p) => p.storeId === activeStoreId).length

  // Componente para mostrar el total (se usará tanto arriba como abajo)
  const TotalDisplay = ({ isTopDisplay = false }: { isTopDisplay?: boolean }) => {
    // Determinar el título y el total a mostrar
    const title = showBreakdown
      ? "Total General:"
      : activeStoreId === "total"
        ? "Total General:"
        : `Total en ${stores.find((s) => s.id === activeStoreId)?.name || "esta tienda"}:`

    const displayTotal = dateFilter
      ? showBreakdown
        ? filteredGrandTotal
        : filteredData?.total || 0
      : showBreakdown
        ? grandTotal
        : storeSubtotals[activeStoreId] || 0

    // Determinar el número de productos
    const numProducts = dateFilter
      ? showBreakdown
        ? products.filter((p) => p.createdAt && isSameDay(p.createdAt, dateFilter)).length
        : filteredData?.count || 0
      : showBreakdown
        ? products.length
        : products.filter((p) => p.storeId === activeStoreId).length

    // Calcular ahorros
    const binanceRate = exchangeRates.binance || exchangeRates.parallel
    const bcvRateNum = Number.parseFloat(exchangeRates.bcv.replace(",", ".")) || 0
    const parallelRateNum = Number.parseFloat(exchangeRates.parallel.replace(",", ".")) || 0
    const binanceRateNum = Number.parseFloat(binanceRate.replace(",", ".")) || 0
    
    const bcvValue = getBolivaresValue(displayTotal, exchangeRates.bcv)
    const parallelValue = getBolivaresValue(displayTotal, exchangeRates.parallel)
    const binanceValue = getBolivaresValue(displayTotal, binanceRate)

    // Ahorro en Bs: Compras en Binance/Paralelo y pagas a BCV
    const ahorroBsBinanceBCV = binanceValue - bcvValue
    const ahorroBsParaleloBCV = parallelValue - bcvValue
    
    // Ahorro en USD: Los Bs extra que obtienes, convertidos a USD a tasa BCV
    const ahorroUsdBinanceBCV = bcvRateNum > 0 ? ahorroBsBinanceBCV / bcvRateNum : 0
    const ahorroUsdParaleloBCV = bcvRateNum > 0 ? ahorroBsParaleloBCV / bcvRateNum : 0

    if (isTopDisplay) {
      // Estilo del cuadro celeste para la parte superior
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">
            {title}
            {dateFilter && (
              <span>
                {" "}
                del día{" "}
                {new Date(dateFilter).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1">
            <div className="text-sm space-y-1">
              <div className="flex justify-between items-center p-1.5 bg-white rounded border border-blue-100">
                <span className="text-gray-700 font-medium">BCV:</span>
                <div className="text-right">
                  <span className="font-bold text-lg">${displayTotal.toFixed(2)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="font-medium text-gray-600">Bs. {bcvRateNum > 0 ? bcvValue.toFixed(2) : "..."}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-green-50 rounded border border-green-200">
                <span className="text-gray-700 font-medium">Paralelo:</span>
                <div className="text-right">
                  <span className="font-bold text-lg text-green-600">${(displayTotal - ahorroUsdParaleloBCV).toFixed(2)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="font-medium text-gray-600">Bs. {parallelRateNum > 0 ? parallelValue.toFixed(2) : "..."}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-green-50 rounded border border-green-200">
                <span className="text-gray-700 font-medium">Binance:</span>
                <div className="text-right">
                  <span className="font-bold text-lg text-green-600">${(displayTotal - ahorroUsdBinanceBCV).toFixed(2)}</span>
                  <span className="text-gray-500 mx-1">|</span>
                  <span className="font-medium text-gray-600">Bs. {binanceRateNum > 0 ? binanceValue.toFixed(2) : "..."}</span>
                </div>
              </div>
            </div>
            
            {/* Tabla comparativa de tasas */}
            {displayTotal > 0 && bcvRateNum > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-blue-700 text-sm mb-2">Comparativa de gastos:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="border border-blue-200 px-2 py-1 text-left">Tasa</th>
                        <th className="border border-blue-200 px-2 py-1 text-right">Bs/USD</th>
                        <th className="border border-blue-200 px-2 py-1 text-right">Total Bs.</th>
                        <th className="border border-blue-200 px-2 py-1 text-right">Costo $</th>
                        <th className="border border-blue-200 px-2 py-1 text-right">Ahorro Bs.</th>
                        <th className="border border-blue-200 px-2 py-1 text-right">Ahorro $</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="border border-blue-200 px-2 py-1 font-medium">BCV</td>
                        <td className="border border-blue-200 px-2 py-1 text-right">{bcvRateNum.toFixed(2)}</td>
                        <td className="border border-blue-200 px-2 py-1 text-right">Bs. {bcvValue.toFixed(2)}</td>
                        <td className="border border-blue-200 px-2 py-1 text-right font-medium">${displayTotal.toFixed(2)}</td>
                        <td className="border border-blue-200 px-2 py-1 text-right text-gray-500">-</td>
                        <td className="border border-blue-200 px-2 py-1 text-right text-gray-500">-</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="border border-blue-200 px-2 py-1 font-medium">Paralelo</td>
                        <td className="border border-blue-200 px-2 py-1 text-right">{parallelRateNum.toFixed(2)}</td>
                        <td className="border border-blue-200 px-2 py-1 text-right">Bs. {parallelValue.toFixed(2)}</td>
                        <td className="border border-blue-200 px-2 py-1 text-right font-medium text-green-600">
                          ${(displayTotal - ahorroUsdParaleloBCV).toFixed(2)}
                        </td>
                        <td className="border border-blue-200 px-2 py-1 text-right">
                          {ahorroBsParaleloBCV > 0 ? (
                            <span className="text-green-600 font-bold">+{ahorroBsParaleloBCV.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="border border-blue-200 px-2 py-1 text-right">
                          {ahorroUsdParaleloBCV > 0 ? (
                            <span className="text-green-600 font-bold">+${ahorroUsdParaleloBCV.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                      {exchangeRates.binance && (
                        <tr className="bg-green-50">
                          <td className="border border-blue-200 px-2 py-1 font-medium">Binance</td>
                          <td className="border border-blue-200 px-2 py-1 text-right">{binanceRateNum.toFixed(2)}</td>
                          <td className="border border-blue-200 px-2 py-1 text-right">Bs. {binanceValue.toFixed(2)}</td>
                          <td className="border border-blue-200 px-2 py-1 text-right font-medium text-green-600">
                            ${(displayTotal - ahorroUsdBinanceBCV).toFixed(2)}
                          </td>
                          <td className="border border-blue-200 px-2 py-1 text-right">
                            {ahorroBsBinanceBCV > 0 ? (
                              <span className="text-green-600 font-bold">+{ahorroBsBinanceBCV.toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="border border-blue-200 px-2 py-1 text-right">
                            {ahorroUsdBinanceBCV > 0 ? (
                              <span className="text-green-600 font-bold">+${ahorroUsdBinanceBCV.toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Cambia USD a Bs. a tasa mayor y paga a tasa BCV para ahorrar
                </p>
              </div>
            )}
            
            <div className="text-sm text-gray-600 mt-1">
              {numProducts} producto{numProducts !== 1 ? "s" : ""}
              {dateFilter ? " en este día" : ""}
            </div>
          </div>
        </div>
      )
    } else if (showBreakdown) {
      // Para la parte inferior en la vista de desglose
      return (
        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-500">
          <span className="font-bold text-xl">Total General:</span>
          <div className="text-right">
            <div className="text-2xl font-bold">${displayTotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">BCV: Bs. {convertToBolivares(displayTotal, exchangeRates.bcv)}</div>
            <div className="text-sm text-gray-600">
              Paralelo: Bs. {convertToBolivares(displayTotal, exchangeRates.parallel)}
            </div>
          </div>
        </div>
      )
    } else {
      // No mostrar nada en la parte inferior para tiendas individuales
      return null
    }
  }

  return (
    <div className="bg-gray-100 p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Total</h2>
      </div>

      {/* Mostrar el total en la parte superior */}
      <TotalDisplay isTopDisplay={true} />

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

          {/* Mostrar el total en la parte inferior */}
          <TotalDisplay />
        </div>
      ) : (
        // Para tiendas individuales, no necesitamos duplicar el total
        // ya que el componente es más pequeño y todo es visible sin scroll
        <div>{/* El total ya se muestra arriba, no necesitamos duplicarlo aquí */}</div>
      )}
    </div>
  )
}
