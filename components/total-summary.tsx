"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Product } from "@/types"

interface TotalSummaryProps {
  products: Product[]
  selectedStore: string
  selectedDate: string | null
  selectedMonth: string | null
}

const TotalSummary: React.FC<TotalSummaryProps> = ({ products, selectedStore, selectedDate, selectedMonth }) => {
  const [total, setTotal] = useState<number>(0)
  const [storeSubtotals, setStoreSubtotals] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    // Filtrar productos por fecha o mes si están seleccionados
    let filteredProducts = [...products]

    if (selectedDate) {
      filteredProducts = filteredProducts.filter((product) => {
        if (!product.createdAt) return false
        const productDate = new Date(product.createdAt)
        const formattedProductDate = productDate.toISOString().split("T")[0]
        return formattedProductDate === selectedDate
      })
    } else if (selectedMonth) {
      filteredProducts = filteredProducts.filter((product) => {
        if (!product.createdAt) return false
        const productDate = new Date(product.createdAt)
        const formattedProductMonth = `${productDate.getFullYear()}-${String(productDate.getMonth() + 1).padStart(2, "0")}`
        return formattedProductMonth === selectedMonth
      })
    }

    // Calcular subtotales por tienda
    const subtotals: { [key: string]: number } = {}
    let grandTotal = 0

    filteredProducts.forEach((product) => {
      const storeName = product.storeName || "Sin tienda"
      const price = Number.parseFloat(product.price) || 0

      if (!subtotals[storeName]) {
        subtotals[storeName] = 0
      }

      subtotals[storeName] += price
      grandTotal += price
    })

    setStoreSubtotals(subtotals)
    setTotal(grandTotal)
  }, [products, selectedDate, selectedMonth])

  // Si estamos en la vista de una tienda específica, mostrar solo el total de esa tienda
  if (selectedStore !== "total") {
    const storeTotal = storeSubtotals[selectedStore] || 0
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">Total</h2>
        <p className="text-2xl font-bold text-green-600">${storeTotal.toFixed(2)}</p>
      </div>
    )
  }

  // En la vista "Total", mostrar el desglose por tiendas
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Resumen de Gastos</h2>

      {/* Mostrar subtotales por tienda */}
      {Object.keys(storeSubtotals).length > 0 ? (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Desglose por Tienda:</h3>
          <ul className="space-y-2">
            {Object.entries(storeSubtotals).map(([store, subtotal]) => (
              <li key={store} className="flex justify-between">
                <span>{store}</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 mb-4">No hay datos para el período seleccionado</p>
      )}

      {/* Mostrar total general */}
      <div className="border-t pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Total General:</h3>
          <p className="text-2xl font-bold text-green-600">${total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

export default TotalSummary
