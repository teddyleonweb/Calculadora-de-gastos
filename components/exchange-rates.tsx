"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { RefreshCw, DollarSign, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"

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

  const [allRates, setAllRates] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllRates, setShowAllRates] = useState(false)

  const fetchRates = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener las tasas principales
      const data = await ExchangeRateService.getExchangeRates()

      // Verificar si hay un error
      if (data.bcv === "Error" || data.parallel === "Error") {
        setError("No se pudieron cargar las tasas de cambio. Intente nuevamente más tarde.")
        return
      }

      setRates(data)

      // Obtener todas las tasas disponibles
      if (showAllRates) {
        const allRatesData = await ExchangeRateService.getAllExchangeRates()
        setAllRates(allRatesData)
      }
    } catch (err) {
      console.error("Error al cargar tasas de cambio:", err)
      setError("No se pudieron cargar las tasas de cambio. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar todas las tasas cuando se expande la sección
  const handleToggleAllRates = async () => {
    const newState = !showAllRates
    setShowAllRates(newState)

    if (newState && !allRates) {
      try {
        setLoading(true)
        const allRatesData = await ExchangeRateService.getAllExchangeRates()
        setAllRates(allRatesData)
      } catch (err) {
        console.error("Error al cargar todas las tasas:", err)
      } finally {
        setLoading(false)
      }
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center mb-3">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="border rounded-md p-3 bg-blue-50">
          <div className="text-sm text-gray-600 mb-1">Dólar BCV (Oficial)</div>
          <div className="text-xl font-bold">{rates.bcv === "Error" ? "No disponible" : `${rates.bcv} Bs.`}</div>
        </div>
        <div className="border rounded-md p-3 bg-green-50">
          <div className="text-sm text-gray-600 mb-1">Dólar Paralelo</div>
          <div className="text-xl font-bold">
            {rates.parallel === "Error" ? "No disponible" : `${rates.parallel} Bs.`}
          </div>
        </div>
      </div>

      <button
        onClick={handleToggleAllRates}
        className="w-full flex justify-between items-center text-sm text-gray-600 hover:text-gray-800 py-2 border-t"
      >
        <span>Ver todas las tasas disponibles</span>
        {showAllRates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showAllRates && (
        <div className="mt-3 border-t pt-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : allRates ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(allRates).map(([key, value]: [string, any]) => (
                <div key={key} className="border rounded-md p-2">
                  <div className="text-xs text-gray-500 mb-1">{key}</div>
                  <div className="font-semibold">{value.price} Bs.</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-2">No se pudieron cargar todas las tasas</div>
          )}
        </div>
      )}

      {rates.lastUpdate && !error && (
        <div className="text-xs text-gray-500 mt-2 text-right">Última actualización: {rates.lastUpdate}</div>
      )}
    </div>
  )
}
