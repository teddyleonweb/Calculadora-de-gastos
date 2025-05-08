"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"

const ExchangeRateDashboard: React.FC = () => {
  const [rates, setRates] = useState({
    bcv: "...",
    parallel: "...",
  })
  const [amount, setAmount] = useState("")
  const [convertedAmount, setConvertedAmount] = useState({
    toBs: "",
    toUsd: "",
  })

  useEffect(() => {
    const loadRates = async () => {
      try {
        const data = await ExchangeRateService.getExchangeRates()
        setRates(data)
      } catch (error) {
        console.error("Error al cargar tasas de cambio:", error)
      }
    }

    loadRates()
    const interval = setInterval(loadRates, 30 * 60 * 1000) // Actualizar cada 30 minutos

    return () => clearInterval(interval)
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)

    if (value && !isNaN(Number(value))) {
      const numValue = Number(value)
      const parallelRate = Number(rates.parallel)

      if (!isNaN(parallelRate) && parallelRate > 0) {
        setConvertedAmount({
          toBs: (numValue * parallelRate).toFixed(2),
          toUsd: (numValue / parallelRate).toFixed(2),
        })
      }
    } else {
      setConvertedAmount({
        toBs: "",
        toUsd: "",
      })
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Tasas de Cambio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Tasa BCV</h3>
          <p className="text-3xl font-bold text-blue-600">{rates.bcv} Bs.</p>
          <p className="text-sm text-gray-500 mt-1">Tasa oficial del Banco Central de Venezuela</p>
        </div>

        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Tasa Paralela</h3>
          <p className="text-3xl font-bold text-green-600">{rates.parallel} Bs.</p>
          <p className="text-sm text-gray-500 mt-1">Tasa del mercado paralelo</p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Conversor de Divisas</h3>

        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Ingrese un monto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">USD a Bolívares:</p>
            <p className="text-xl font-bold">{convertedAmount.toBs || "0.00"} Bs.</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">Bolívares a USD:</p>
            <p className="text-xl font-bold">${convertedAmount.toUsd || "0.00"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExchangeRateDashboard
