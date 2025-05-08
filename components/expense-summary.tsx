import type React from "react"
import type { Product, Store } from "../types"

interface ExpenseSummaryProps {
  products: Product[]
  stores: Store[]
  storeSubtotals: { [key: string]: number }
  exchangeRates: {
    bcv: string
    parallel: string
  }
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({ products, stores, storeSubtotals, exchangeRates }) => {
  // Calcular el total general
  const totalGeneral = Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

  // Calcular el total en dólares (usando la tasa paralela)
  const totalDolares = totalGeneral / Number(exchangeRates.parallel || 0)

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Resumen de Gastos</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Gastos por Tienda</h3>
        <div className="space-y-2">
          {stores.map((store) => (
            <div key={store.id} className="flex justify-between items-center p-2 border-b">
              <span>{store.name}</span>
              <span className="font-medium">${(storeSubtotals[store.id] || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Total General:</span>
          <span className="text-xl font-bold text-green-600">${totalGeneral.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Equivalente en USD:</span>
          <span className="font-medium text-blue-600">${isNaN(totalDolares) ? "0.00" : totalDolares.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default ExpenseSummary
