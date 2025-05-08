"use client"

import { useState, useEffect } from "react"
import type { Product, Store } from "../types"

interface TotalSummaryProps {
  products: Product[]
  stores: Store[]
  activeStoreId: string
  storeSubtotals: { [key: string]: number }
  exchangeRates: {
    bcv: string
    parallel: string
  }
  dateFilter: string | null // Añadir el filtro de fecha como prop
}

export default function TotalSummary({
  products,
  stores,
  activeStoreId,
  storeSubtotals,
  exchangeRates,
  dateFilter, // Recibir el filtro de fecha
}: TotalSummaryProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [total, setTotal] = useState<number>(0)
  const [bcvTotal, setBcvTotal] = useState<number>(0)
  const [parallelTotal, setParallelTotal] = useState<number>(0)

  // Actualizar los productos filtrados cuando cambian los productos, la tienda activa o el filtro de fecha
  useEffect(() => {
    // Filtrar productos por tienda y fecha
    let filtered = products

    // Aplicar filtro de fecha si existe
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      // Establecer la hora a las 0:00:00 para comparar solo la fecha
      filterDate.setHours(0, 0, 0, 0)

      filtered = filtered.filter((product) => {
        // Si el producto no tiene fecha, no lo incluimos
        if (!product.createdAt) return false

        const productDate = new Date(product.createdAt)
        // Establecer la hora a las 0:00:00 para comparar solo la fecha
        productDate.setHours(0, 0, 0, 0)

        return productDate.getTime() === filterDate.getTime()
      })
    }

    // Aplicar filtro de tienda
    if (activeStoreId !== "total") {
      // Si no es la tienda "Total", filtrar por tienda específica
      filtered = filtered.filter((product) => product.storeId === activeStoreId)
    }

    setFilteredProducts(filtered)
  }, [products, activeStoreId, dateFilter])

  // Calcular el total cuando cambian los productos filtrados o las tasas de cambio
  useEffect(() => {
    // Calcular el total en dólares
    const newTotal = filteredProducts.reduce((sum, product) => sum + product.price * product.quantity, 0)
    setTotal(newTotal)

    // Calcular el total en bolívares según BCV
    const bcvRate = Number.parseFloat(exchangeRates.bcv.replace(/[^\d.]/g, "")) || 0
    setBcvTotal(newTotal * bcvRate)

    // Calcular el total en bolívares según tasa paralela
    const parallelRate = Number.parseFloat(exchangeRates.parallel.replace(/[^\d.]/g, "")) || 0
    setParallelTotal(newTotal * parallelRate)
  }, [filteredProducts, exchangeRates])

  // Obtener el nombre de la tienda activa
  const activeStoreName =
    activeStoreId === "total" ? "Total" : stores.find((store) => store.id === activeStoreId)?.name || "Tienda"

  // Formatear números para mostrar
  const formatNumber = (num: number) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow mb-4">
      <div className="bg-blue-100 p-3 rounded-md mb-4">
        <h3 className="text-lg font-bold">
          Total en {activeStoreName} {dateFilter ? `del día ${new Date(dateFilter).toLocaleDateString()}` : ""}:
        </h3>
        <div className="text-3xl font-bold">${formatNumber(total)}</div>
        <div className="text-sm text-gray-600">
          BCV: Bs. {formatNumber(bcvTotal)}
          <br />
          Paralelo: Bs. {formatNumber(parallelTotal)}
        </div>
        <div className="text-sm mt-1">
          {filteredProducts.length} productos en {dateFilter ? "este día" : "total"}
        </div>
      </div>

      {/* Mostrar subtotales por tienda solo cuando estamos en la vista "Total" */}
      {activeStoreId === "total" && (
        <div>
          <h3 className="text-lg font-bold mb-2">Subtotales por tienda:</h3>
          <div className="space-y-2">
            {stores
              .filter((store) => store.id !== "total") // Excluir la tienda "Total" de los subtotales
              .map((store) => {
                // Calcular el subtotal para esta tienda con el filtro de fecha aplicado
                const storeProducts = products.filter((product) => {
                  // Primero filtrar por tienda
                  if (product.storeId !== store.id) return false

                  // Luego aplicar filtro de fecha si existe
                  if (dateFilter) {
                    const filterDate = new Date(dateFilter)
                    filterDate.setHours(0, 0, 0, 0)

                    if (!product.createdAt) return false

                    const productDate = new Date(product.createdAt)
                    productDate.setHours(0, 0, 0, 0)

                    return productDate.getTime() === filterDate.getTime()
                  }

                  return true
                })

                // Calcular el subtotal
                const storeSubtotal = storeProducts.reduce((sum, product) => sum + product.price * product.quantity, 0)

                // Calcular totales en bolívares
                const bcvRate = Number.parseFloat(exchangeRates.bcv.replace(/[^\d.]/g, "")) || 0
                const parallelRate = Number.parseFloat(exchangeRates.parallel.replace(/[^\d.]/g, "")) || 0
                const storeBcvTotal = storeSubtotal * bcvRate
                const storeParallelTotal = storeSubtotal * parallelRate

                // No mostrar tiendas sin productos cuando hay filtro de fecha
                if (dateFilter && storeProducts.length === 0) return null

                return (
                  <div key={store.id} className="flex justify-between items-center border-b pb-2">
                    <div className="font-medium">{store.name}</div>
                    <div className="text-right">
                      <div className="font-bold">${formatNumber(storeSubtotal)}</div>
                      <div className="text-xs text-gray-600">
                        BCV: Bs. {formatNumber(storeBcvTotal)}
                        <br />
                        Paralelo: Bs. {formatNumber(storeParallelTotal)}
                      </div>
                    </div>
                  </div>
                )
              })
              .filter(Boolean)}{" "}
            {/* Filtrar los null que retornamos para tiendas sin productos */}
          </div>
        </div>
      )}
    </div>
  )
}
