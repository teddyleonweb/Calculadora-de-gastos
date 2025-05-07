"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { Calculator } from "lucide-react"

export default function CurrencyConverter() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
  }>({
    bcv: "0",
    parallel: "0",
  })

  const [amount, setAmount] = useState<string>("1")
  const [currency, setCurrency] = useState<"usd" | "bs">("usd")
  const [rateType, setRateType] = useState<"bcv" | "parallel">("bcv")
  const [result, setResult] = useState<string>("0")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true)
        const data = await ExchangeRateService.getExchangeRatesWithFallback()

        // Convertir a números para cálculos
        setRates({
          bcv: data.bcv.replace(/,/g, "."),
          parallel: data.parallel.replace(/,/g, "."),
        })
      } catch (err) {
        console.error("Error al cargar tasas para el conversor:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [])

  useEffect(() => {
    // Calcular el resultado cuando cambian los valores
    calculate()
  }, [amount, currency, rateType, rates])

  const calculate = () => {
    try {
      const numAmount = Number.parseFloat(amount) || 0
      const rate = Number.parseFloat(rateType === "bcv" ? rates.bcv : rates.parallel) || 0

      if (rate === 0) {
        setResult("Tasa no disponible")
        return
      }

      let calculatedResult: number

      if (currency === "usd") {
        // Convertir de USD a Bs
        calculatedResult = numAmount * rate
        setResult(calculatedResult.toFixed(2) + " Bs.")
      } else {
        // Convertir de Bs a USD
        calculatedResult = numAmount / rate
        setResult("$" + calculatedResult.toFixed(2))
      }
    } catch (error) {
      console.error("Error en el cálculo:", error)
      setResult("Error en el cálculo")
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-bold mb-3 flex items-center">
        <Calculator className="w-5 h-5 mr-1 text-blue-600" />
        Conversor de Moneda
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Ingrese monto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "usd" | "bs")}
            className="w-full p-2 border rounded-md"
          >
            <option value="usd">Dólares (USD)</option>
            <option value="bs">Bolívares (Bs)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tasa a utilizar</label>
          <select
            value={rateType}
            onChange={(e) => setRateType(e.target.value as "bcv" | "parallel")}
            className="w-full p-2 border rounded-md"
          >
            <option value="bcv">BCV (Oficial)</option>
            <option value="parallel">Paralelo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
          <div className="w-full p-2 border rounded-md bg-gray-50 font-bold">{loading ? "Calculando..." : result}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-3">
        Tasas actuales: BCV {rates.bcv} Bs/USD | Paralelo {rates.parallel} Bs/USD
      </div>
    </div>
  )
}
