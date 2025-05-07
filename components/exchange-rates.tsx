"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { RefreshCw, DollarSign, AlertTriangle } from "lucide-react"

export default function ExchangeRates() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
    lastUpdate: string
  }>({
    bcv: "Cargando...",
    parallel: "Cargando...",
    lastUpdate: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = async () => {
    try {
      setLoading(true)
      setError(null)
      // Usar el método con fallback para mayor confiabilidad
      const data = await ExchangeRateService.getExchangeRatesWithFallback()
      setRates(data)
    } catch (err) {
      console.error("Error al cargar tasas de cambio:", err)
      setError("No se pudieron cargar las tasas de cambio. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRates()

    // Actualizar cada 30 minutos
    const intervalId = setInterval(fetchRates, 30 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold flex items-center">
          <DollarSign className="w-5 h-5 mr-1 text-green-600" />
          Tasas de Cambio
        </h2>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-3 bg-blue-50">
            <div className="text-sm text-gray-600 mb-1">Dólar BCV (Oficial)</div>
            <div className="text-xl font-bold">{rates.bcv} Bs.</div>
          </div>
          <div className="border rounded-md p-3 bg-green-50">
            <div className="text-sm text-gray-600 mb-1">Dólar Paralelo</div>
            <div className="text-xl font-bold">{rates.parallel} Bs.</div>
          </div>
        </div>
      )}

      {rates.lastUpdate && (
        <div className="text-xs text-gray-500 mt-2 text-right">Última actualización: {rates.lastUpdate}</div>
      )}
    </div>
  )
}
