"use client"

import type { Product } from "../types"

interface TotalSummaryProps {
  products: Product[]
}

export default function TotalSummary({ products }: TotalSummaryProps) {
  // Calcular el total general
  const grandTotal = products.reduce((sum, product) => sum + product.price * product.quantity, 0)

  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-bold mb-2">Total</h2>
      <div>
        <p className="text-2xl font-bold">${grandTotal.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">{products.length} productos</p>
      </div>
    </div>
  )
}
