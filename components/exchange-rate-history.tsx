"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { RefreshCw, TrendingUp } from "lucide-react"

// Esta función simula datos históricos ya que la API no proporciona historial
// En un entorno real, deberías obtener estos datos de tu backend
const generateMockHistoricalData = () => {
  const data = []
  const today = new Date()
  const bcvBase = 36.31
  const parallelBase = 37.85

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Generar variaciones aleatorias pero realistas
    const bcvVariation = Math.random() * 0.4 - 0.2 // -0.2 a +0.2
    const parallelVariation = Math.random() * 0.6 - 0.3 // -0.3 a +0.3

    data.push({
      date: date.toLocaleDateString("es-VE"),
      bcv: (bcvBase + bcvVariation * i).toFixed(2),
      parallel: (parallelBase + parallelVariation * i).toFixed(2),
    })
  }

  return data
}

export default function ExchangeRateHistory() {
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadHistoricalData = () => {
    setLoading(true)

    // Simular una carga de datos
    setTimeout(() => {
      setHistoricalData(generateMockHistoricalData())
      setLoading(false)
    }, 1000)
  }

  useEffect(() => {
    loadHistoricalData()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <TrendingUp className="w-5 h-5 mr-1 text-purple-600" />
          Historial de Tasas de Cambio
        </h2>
        <button
          onClick={loadHistoricalData}
          disabled={loading}
          className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Mostrar solo algunas fechas para evitar sobrecarga
                  const date = new Date(value)
                  return date.getDate() % 5 === 0 ? value : ""
                }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bcv" name="BCV (Oficial)" stroke="#3b82f6" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="parallel" name="Paralelo" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2 text-center">
        Nota: Este gráfico muestra datos simulados para fines de demostración.
      </div>
    </div>
  )
}
