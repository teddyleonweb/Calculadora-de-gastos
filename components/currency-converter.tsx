"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { ArrowLeftRight, Calculator, AlertTriangle, RefreshCw } from "lucide-react"

type Currency = "USD" | "VES" | "COP"

export default function CurrencyConverter() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
    cop_usd: string
  }>({
    bcv: "0",
    parallel: "0",
    cop_usd: "0",
  })

  const [amount, setAmount] = useState<string>("1")
  const [fromCurrency, setFromCurrency] = useState<Currency>("USD")
  const [toCurrency, setToCurrency] = useState<Currency>("VES")
  const [convertedAmount, setConvertedAmount] = useState<string>("0")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar las tasas al inicio
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

      setRates({
        bcv: data.bcv,
        parallel: data.parallel,
        cop_usd: data.cop_usd,
      })
    } catch (error) {
      console.error("Error al cargar tasas para el conversor:", error)
      setError("No se pudieron cargar las tasas de cambio. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  // Realizar la conversión cuando cambian los valores
  useEffect(() => {
    if (rates.bcv === "0" || rates.parallel === "0" || rates.cop_usd === "0" || error) {
      setConvertedAmount("0")
      return
    }

    const amountValue = Number.parseFloat(amount) || 0

    // Usar el nuevo método de conversión
    const result = ExchangeRateService.convertCurrency(amountValue, fromCurrency, toCurrency, rates)

    setConvertedAmount(result.toFixed(2))
  }, [amount, rates, fromCurrency, toCurrency, error])

  // Cambiar la dirección de la conversión
  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  // Obtener el símbolo de la moneda
  const getCurrencySymbol = (currency: Currency): string => {
    switch (currency) {
      case "USD":
        return "$ "
      case "VES":
        return "Bs "
      case "COP":
        return "COP "
      default:
        return ""
    }
  }

  // Obtener el nombre completo de la moneda
  const getCurrencyName = (currency: Currency): string => {
    switch (currency) {
      case "USD":
        return "Dólares"
      case "VES":
        return "Bolívares"
      case "COP":
        return "Pesos Colombianos"
      default:
        return ""
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold flex items-center">
          <Calculator className="w-5 h-5 mr-1 text-blue-600" />
          Conversor de Moneda
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
      ) : null}

      <div className="flex flex-col md:flex-row items-center mb-4 gap-2">
        <div className="w-full md:flex-1">
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">{getCurrencyName(fromCurrency)}</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as Currency)}
              className="text-xs bg-gray-100 border-none rounded"
              disabled={loading || error !== null}
            >
              <option value="USD">USD</option>
              <option value="VES">VES</option>
              <option value="COP">COP</option>
            </select>
          </div>
          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-500">{getCurrencySymbol(fromCurrency)}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 pl-12 border rounded-md"
              min="0"
              step="0.01"
              disabled={loading || error !== null}
            />
          </div>
        </div>

        <button
          onClick={swapCurrencies}
          className="mx-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 my-2 md:my-0"
          aria-label="Cambiar dirección de conversión"
          disabled={loading || error !== null}
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <div className="w-full md:flex-1">
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">{getCurrencyName(toCurrency)}</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as Currency)}
              className="text-xs bg-gray-100 border-none rounded"
              disabled={loading || error !== null}
            >
              <option value="USD">USD</option>
              <option value="VES">VES</option>
              <option value="COP">COP</option>
            </select>
          </div>
          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-500">{getCurrencySymbol(toCurrency)}</span>
            <input
              type="number"
              value={convertedAmount}
              readOnly
              className="w-full p-2 pl-12 border rounded-md bg-gray-50"
            />
          </div>
        </div>
      </div>

      {!error && (
        <div className="text-xs text-gray-500 text-center">
          <div>Tasas actuales:</div>
          <div>
            1 USD = {rates.parallel} Bs (Paralelo) | 1 USD = {rates.bcv} Bs (BCV)
          </div>
          <div>1 COP = {rates.cop_usd} USD</div>
        </div>
      )}
    </div>
  )
}
