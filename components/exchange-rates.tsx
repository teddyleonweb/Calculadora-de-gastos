"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { DollarSign, RefreshCw, AlertTriangle } from "lucide-react"

export default function ExchangeRates() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
    cop_usd: string
    lastUpdate: string
  }>({
    bcv: "Cargando...",
    parallel: "Cargando...",
    cop_usd: "Cargando...",
    lastUpdate: "",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ExchangeRateService.getExchangeRates()

      // Verificar si hay un error
      if (data.bcv === "Error" || data.parallel === "Error" || data.cop_usd === "Error") {
        setError("No se pudieron cargar las tasas de cambio. Intente nuevamente más tarde.")
        return
      }

      setRates(data)
    } catch (error) {
      console.error("Error al cargar tasas de cambio:", error)
      setError("No se pudieron cargar las tasas de cambio. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold flex items-center">
          <DollarSign className="w-5 h-5 mr-1 text-green-600" />
          Tasas de Cambio
        </h2>
        <button
          onClick={loadRates}
          disabled={loading}
          className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center mb-3">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">BCV</div>
              <div className="text-xl font-bold">{loading ? "..." : `${rates.bcv} Bs/USD`}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Paralelo</div>
              <div className="text-xl font-bold">{loading ? "..." : `${rates.parallel} Bs/USD`}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Peso Colombiano</div>
              <div className="text-xl font-bold">{loading ? "..." : `${rates.cop_usd} USD/COP`}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">Última actualización: {rates.lastUpdate}</div>
        </>
      )}
    </div>
  )
}
