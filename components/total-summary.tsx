"use client"

import { useEffect, useState } from "react"
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
  // Estados para almacenar los productos filtrados y sus totales
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [filteredTotal, setFilteredTotal] = useState<number>(0)
  const [filteredStoreSubtotals, setFilteredStoreSubtotals] = useState<{ [key: string]: number }>({})
  const [productsByStore, setProductsByStore] = useState<{ [key: string]: Product[] }>({})

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

  // Efecto para filtrar productos por fecha y calcular totales
  useEffect(() => {
    // Inicializar los subtotales filtrados
    const newFilteredStoreSubtotals: { [key: string]: number } = {}
    const newProductsByStore: { [key: string]: Product[] } = {}

    // Inicializar para todas las tiendas
    stores.forEach((store) => {
      newFilteredStoreSubtotals[store.id] = 0
      newProductsByStore[store.id] = []
    })

    // Filtrar productos por fecha si hay un filtro activo
    let filtered = products
    if (dateFilter) {
      filtered = products.filter((product) => {
        if (!product.createdAt) return false
        return isSameDay(product.createdAt, dateFilter)
      })
    }

    // Filtrar por tienda activa si no estamos en la vista "Total"
    if (activeStoreId !== "total" && activeStoreId !== totalStore?.id) {
      filtered = filtered.filter((product) => product.storeId === activeStoreId)
    }

    // Calcular subtotales por tienda para los productos filtrados
    filtered.forEach((product) => {
      // Agrupar por tienda
      if (!newProductsByStore[product.storeId]) {
        newProductsByStore[product.storeId] = []
      }
      newProductsByStore[product.storeId].push(product)

      // Calcular subtotal
      if (!newFilteredStoreSubtotals[product.storeId]) {
        newFilteredStoreSubtotals[product.storeId] = 0
      }
      newFilteredStoreSubtotals[product.storeId] += product.price * product.quantity
    })

    // Calcular total general filtrado
    const newFilteredTotal = Object.values(newFilteredStoreSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

    // Actualizar estados
    setFilteredProducts(filtered)
    setFilteredTotal(newFilteredTotal)
    setFilteredStoreSubtotals(newFilteredStoreSubtotals)
    setProductsByStore(newProductsByStore)

    console.log("Productos filtrados:", filtered.length)
    console.log("Total filtrado:", newFilteredTotal)
    console.log("Subtotales por tienda:", newFilteredStoreSubtotals)
  }, [products, dateFilter, activeStoreId, stores, totalStore?.id])

  // Función para convertir dólares a bolívares
  const convertToBolivares = (dollarAmount: number, rate: string): string => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return "N/A"
    return (dollarAmount * rateValue).toFixed(2)
  }

  // Modificar el return para mostrar el total filtrado por fecha
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">Total</h2>

      {dateFilter && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800">
            {activeStoreId === "total" || activeStoreId === totalStore?.id
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
            <div className="font-bold text-xl">${filteredTotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">
              <div>BCV: Bs. {convertToBolivares(filteredTotal, exchangeRates.bcv)}</div>
              <div>Paralelo: Bs. {convertToBolivares(filteredTotal, exchangeRates.parallel)}</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""} en este día
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
                  store.id !== totalStore?.id &&
                  (dateFilter ? filteredStoreSubtotals[store.id] > 0 : storeSubtotals[store.id] > 0),
              )
              .map((store) => {
                // Obtener los productos de esta tienda (ya filtrados por fecha si hay filtro)
                const storeProducts = productsByStore[store.id] || []

                // Calcular el subtotal de la tienda para los productos filtrados
                const storeSubtotal = dateFilter ? filteredStoreSubtotals[store.id] || 0 : storeSubtotals[store.id] || 0

                // Si hay un filtro de fecha y no hay productos para esta tienda en esa fecha, no mostrar la tienda
                if (dateFilter && storeProducts.length === 0) return null

                return (
                  <div key={store.id} className="mb-4">
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-bold text-lg">{store.name}</span>
                      <div className="text-right">
                        <div className="font-bold text-lg">${storeSubtotal.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">
                          BCV: Bs. {convertToBolivares(storeSubtotal, exchangeRates.bcv)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Paralelo: Bs. {convertToBolivares(storeSubtotal, exchangeRates.parallel)}
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
                        <span className="font-medium">Subtotal: ${storeSubtotal.toFixed(2)}</span>
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
                <div className="text-2xl font-bold">${filteredTotal.toFixed(2)}</div>
              ) : (
                <div className="text-2xl font-bold">${grandTotal.toFixed(2)}</div>
              )}
              <div className="text-sm text-gray-600">
                BCV: Bs. {convertToBolivares(dateFilter ? filteredTotal : grandTotal, exchangeRates.bcv)}
              </div>
              <div className="text-sm text-gray-600">
                Paralelo: Bs. {convertToBolivares(dateFilter ? filteredTotal : grandTotal, exchangeRates.parallel)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mostrar solo el total de la tienda actual
        <div>
          <div className="text-right">
            {dateFilter ? (
              <p className="text-2xl font-bold">${filteredTotal.toFixed(2)}</p>
            ) : (
              <p className="text-2xl font-bold">${storeSubtotals[activeStoreId]?.toFixed(2) || "0.00"}</p>
            )}
            <div className="text-sm text-gray-600 mt-1">
              <div>
                BCV: Bs.{" "}
                {convertToBolivares(dateFilter ? filteredTotal : storeSubtotals[activeStoreId] || 0, exchangeRates.bcv)}
              </div>
              <div>
                Paralelo: Bs.{" "}
                {convertToBolivares(
                  dateFilter ? filteredTotal : storeSubtotals[activeStoreId] || 0,
                  exchangeRates.parallel,
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {dateFilter
              ? `${filteredProducts.length} productos en este día`
              : `${products.filter((p) => p.storeId === activeStoreId).length} productos`}
          </p>
        </div>
      )}
    </div>
  )
}
