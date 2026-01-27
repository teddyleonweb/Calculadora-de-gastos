"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { DollarSign, RefreshCw, AlertTriangle } from "lucide-react"

export default function ExchangeRates() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
    cop_usd: string
    bcv_euro: string
    lastUpdate: string
  }>({
    bcv: "Cargando...",
    parallel: "Cargando...",
    cop_usd: "Cargando...",
    bcv_euro: "Cargando...",
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
      if (data.bcv === "Error" || data.parallel === "Error" || data.cop_usd === "Error" || data.bcv_euro === "Error") {
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
              <div className="text-xs font-semibold text-blue-600 mb-1 uppercase">BCV USD</div>
              <div className="text-lg font-bold text-blue-700">{loading ? "..." : `${rates.bcv} Bs`}</div>
              <div className="text-xs text-gray-500">1 USD</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
              <div className="text-xs font-semibold text-yellow-600 mb-1 uppercase">BCV EUR</div>
              <div className="text-lg font-bold text-yellow-700">{loading ? "..." : `${rates.bcv_euro} Bs`}</div>
              <div className="text-xs text-gray-500">1 EUR</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
              <div className="text-xs font-semibold text-green-600 mb-1 uppercase">Paralelo</div>
              <div className="text-lg font-bold text-green-700">{loading ? "..." : `${rates.parallel} Bs`}</div>
              <div className="text-xs text-gray-500">1 USD</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
              <div className="text-xs font-semibold text-purple-600 mb-1 uppercase">COP/USD</div>
              <div className="text-lg font-bold text-purple-700">{loading ? "..." : `${rates.cop_usd} USD`}</div>
              <div className="text-xs text-gray-500">1 COP</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">Última actualización: {rates.lastUpdate}</div>
        </>
      )}
    </div>
  )
}
