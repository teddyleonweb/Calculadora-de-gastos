"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { ArrowLeftRight, Calculator } from "lucide-react"

export default function CurrencyConverter() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
  }>({
    bcv: "36.31", // Valor de respaldo
    parallel: "37.85", // Valor de respaldo
  })

  const [amount, setAmount] = useState<string>("1")
  const [convertedBCV, setConvertedBCV] = useState<string>("0")
  const [convertedParallel, setConvertedParallel] = useState<string>("0")
  const [direction, setDirection] = useState<"toBs" | "toUsd">("toBs")
  const [loading, setLoading] = useState(false)

  // Cargar las tasas al inicio
  useEffect(() => {
    const loadRates = async () => {
      try {
        setLoading(true)
        const data = await ExchangeRateService.getExchangeRates()
        setRates({
          bcv: data.bcv,
          parallel: data.parallel,
        })
      } catch (error) {
        console.error("Error al cargar tasas para el conversor:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRates()
  }, [])

  // Realizar la conversión cuando cambian los valores
  useEffect(() => {
    const amountValue = Number.parseFloat(amount) || 0

    if (direction === "toBs") {
      // Convertir de USD a Bs
      const bcvValue = ExchangeRateService.convertCurrency(amountValue, rates.bcv, false)
      const parallelValue = ExchangeRateService.convertCurrency(amountValue, rates.parallel, false)

      setConvertedBCV(bcvValue.toFixed(2))
      setConvertedParallel(parallelValue.toFixed(2))
    } else {
      // Convertir de Bs a USD
      const bcvValue = ExchangeRateService.convertCurrency(amountValue, rates.bcv, true)
      const parallelValue = ExchangeRateService.convertCurrency(amountValue, rates.parallel, true)

      setConvertedBCV(bcvValue.toFixed(2))
      setConvertedParallel(parallelValue.toFixed(2))
    }
  }, [amount, rates, direction])

  // Cambiar la dirección de la conversión
  const toggleDirection = () => {
    setDirection((prev) => (prev === "toBs" ? "toUsd" : "toBs"))
    setAmount("1") // Resetear el monto al cambiar la dirección
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-bold mb-3 flex items-center">
        <Calculator className="w-5 h-5 mr-1 text-blue-600" />
        Conversor de Moneda
      </h2>

      <div className="flex flex-col md:flex-row items-center mb-4 gap-2">
        <div className="w-full md:flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {direction === "toBs" ? "Dólares (USD)" : "Bolívares (Bs)"}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md"
            min="0"
            step="0.01"
          />
        </div>

        <button
          onClick={toggleDirection}
          className="mx-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 my-2 md:my-0"
          aria-label="Cambiar dirección de conversión"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <div className="w-full md:flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {direction === "toBs" ? "Bolívares (Bs)" : "Dólares (USD)"}
          </label>
          <div className="text-center">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border rounded-md bg-blue-50">
                <div className="text-xs text-gray-500 mb-1">BCV</div>
                <div className="font-bold">{loading ? "..." : convertedBCV}</div>
              </div>
              <div className="p-2 border rounded-md bg-green-50">
                <div className="text-xs text-gray-500 mb-1">Paralelo</div>
                <div className="font-bold">{loading ? "..." : convertedParallel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Tasas actuales: BCV {rates.bcv} Bs/USD | Paralelo {rates.parallel} Bs/USD
      </div>
    </div>
  )
}
