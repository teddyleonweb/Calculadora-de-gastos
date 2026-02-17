"use client"

import { useState, useEffect } from "react"
import { ExchangeRateService } from "../services/exchange-rate-service"
import { ArrowLeftRight, Calculator, AlertTriangle, RefreshCw } from "lucide-react"

type Currency = "USD" | "VES" | "COP" | "EUR"

export default function CurrencyConverter() {
  const [rates, setRates] = useState<{
    bcv: string
    parallel: string
    cop_usd: string
    bcv_euro: string
  }>({
    bcv: "0",
    parallel: "0",
    cop_usd: "0",
    bcv_euro: "0",
  })

  const [amount, setAmount] = useState<string>("1")
  const [fromCurrency, setFromCurrency] = useState<Currency>("USD")
  const [toCurrency, setToCurrency] = useState<Currency>("VES")
  const [convertedAmount, setConvertedAmount] = useState<string>("0")
  const [convertedBCV, setConvertedBCV] = useState<string>("0")
  const [convertedParallel, setConvertedParallel] = useState<string>("0")
  const [convertedBCVEuro, setConvertedBCVEuro] = useState<string>("0")
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
        bcv_euro: data.bcv_euro,
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
      setConvertedBCV("0")
      setConvertedParallel("0")
      setConvertedBCVEuro("0")
      return
    }

    const amountValue = Number.parseFloat(amount) || 0

    // Caso especial para conversión USD-VES o VES-USD
    if ((fromCurrency === "USD" && toCurrency === "VES") || (fromCurrency === "VES" && toCurrency === "USD")) {
      const bcvRate = Number.parseFloat(rates.bcv.replace(",", "."))
      const parallelRate = Number.parseFloat(rates.parallel.replace(",", "."))
      const bcvEuroRate = Number.parseFloat((rates.bcv_euro || "0").replace(",", "."))

      if (fromCurrency === "USD" && toCurrency === "VES") {
        // USD a VES
        setConvertedBCV((amountValue * bcvRate).toFixed(2))
        setConvertedParallel((amountValue * parallelRate).toFixed(2))
        // BCV EUR: convertir USD a EUR primero (USD * bcvRate / bcvEuroRate) y luego mostrar el equivalente en Bs por EUR
        if (bcvEuroRate > 0) {
          setConvertedBCVEuro((amountValue * bcvEuroRate).toFixed(2))
        } else {
          setConvertedBCVEuro("N/A")
        }
        setConvertedAmount((amountValue * parallelRate).toFixed(2))
      } else {
        // VES a USD
        setConvertedBCV((amountValue / bcvRate).toFixed(2))
        setConvertedParallel((amountValue / parallelRate).toFixed(2))
        if (bcvEuroRate > 0) {
          setConvertedBCVEuro((amountValue / bcvEuroRate).toFixed(2))
        } else {
          setConvertedBCVEuro("N/A")
        }
        setConvertedAmount((amountValue / parallelRate).toFixed(2))
      }
    } else if ((fromCurrency === "USD" && toCurrency === "EUR") || (fromCurrency === "EUR" && toCurrency === "USD")) {
      // Conversiones USD-EUR usando la tasa BCV-EUR
      const bcvEuroRate = Number.parseFloat(rates.bcv_euro.replace(",", "."))
      const bcvRate = Number.parseFloat(rates.bcv.replace(",", "."))
      
      if (fromCurrency === "USD" && toCurrency === "EUR") {
        // USD a EUR: (USD * bcvRate) / bcvEuroRate
        setConvertedBCV((amountValue * (bcvRate / bcvEuroRate)).toFixed(2))
        setConvertedParallel("0")
        setConvertedAmount((amountValue * (bcvRate / bcvEuroRate)).toFixed(2))
      } else {
        // EUR a USD: (EUR * bcvEuroRate) / bcvRate
        setConvertedBCV((amountValue * (bcvEuroRate / bcvRate)).toFixed(2))
        setConvertedParallel("0")
        setConvertedAmount((amountValue * (bcvEuroRate / bcvRate)).toFixed(2))
      }
    } else if ((fromCurrency === "VES" && toCurrency === "EUR") || (fromCurrency === "EUR" && toCurrency === "VES")) {
      // Conversiones directas VES-EUR
      const bcvEuroRate = Number.parseFloat(rates.bcv_euro.replace(",", "."))
      
      if (fromCurrency === "VES" && toCurrency === "EUR") {
        // VES a EUR
        setConvertedBCV((amountValue / bcvEuroRate).toFixed(2))
        setConvertedParallel("0")
        setConvertedAmount((amountValue / bcvEuroRate).toFixed(2))
      } else {
        // EUR a VES
        setConvertedBCV((amountValue * bcvEuroRate).toFixed(2))
        setConvertedParallel("0")
        setConvertedAmount((amountValue * bcvEuroRate).toFixed(2))
      }
    } else {
      // Para otras conversiones, usar el método general
      const result = ExchangeRateService.convertCurrency(amountValue, fromCurrency, toCurrency, rates)
      setConvertedAmount(result.toFixed(2))
      setConvertedBCV("0") // No aplica
      setConvertedParallel("0") // No aplica
    }
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
      case "EUR":
        return "€ "
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
      case "EUR":
        return "Euros"
      default:
        return ""
    }
  }

  // Verificar si estamos en el caso especial USD-VES o VES-USD
  const isVesUsdConversion = () => {
    return (fromCurrency === "USD" && toCurrency === "VES") || (fromCurrency === "VES" && toCurrency === "USD")
  }

  // Verificar si la conversión incluye EUR
  const isEurConversion = () => {
    return fromCurrency === "EUR" || toCurrency === "EUR"
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
              <option value="EUR">EUR</option>
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
              <option value="EUR">EUR</option>
            </select>
          </div>

          {isVesUsdConversion() ? (
            // Mostrar las 3 tasas para conversiones USD-VES
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 border-2 border-blue-300 rounded-md bg-blue-50">
                <div className="text-xs font-semibold text-blue-600 mb-1">BCV USD</div>
                <div className="font-bold text-blue-700 text-sm">
                  {loading ? "..." : `Bs ${convertedBCV}`}
                </div>
                <div className="text-xs text-blue-500 mt-1 border-t border-blue-200 pt-1">
                  {loading ? "..." : `$ ${(Number.parseFloat(amount) || 0).toFixed(2)}`}
                </div>
                <div className="text-[10px] text-gray-400">
                  {`Tasa: ${rates.bcv}`}
                </div>
              </div>
              <div className="p-2 border-2 border-yellow-300 rounded-md bg-yellow-50">
                <div className="text-xs font-semibold text-yellow-600 mb-1">BCV EUR</div>
                <div className="font-bold text-yellow-700 text-sm">
                  {loading ? "..." : `Bs ${convertedBCVEuro}`}
                </div>
                <div className="text-xs text-yellow-600 mt-1 border-t border-yellow-200 pt-1">
                  {loading || convertedBCVEuro === "N/A" ? "..." : (() => {
                    const bcvRate = Number.parseFloat(rates.bcv.replace(",", "."))
                    const bcvEuroRate = Number.parseFloat((rates.bcv_euro || "0").replace(",", "."))
                    if (bcvEuroRate > 0 && bcvRate > 0) {
                      const amountVal = Number.parseFloat(amount) || 0
                      return `€ ${(amountVal * (bcvRate / bcvEuroRate)).toFixed(2)}`
                    }
                    return "..."
                  })()}
                </div>
                <div className="text-[10px] text-gray-400">
                  {`Tasa: ${rates.bcv_euro || "..."}`}
                </div>
              </div>
              <div className="p-2 border-2 border-green-300 rounded-md bg-green-50">
                <div className="text-xs font-semibold text-green-600 mb-1">Paralelo</div>
                <div className="font-bold text-green-700 text-sm">
                  {loading ? "..." : `Bs ${convertedParallel}`}
                </div>
                <div className="text-xs text-green-600 mt-1 border-t border-green-200 pt-1">
                  {loading ? "..." : `$ ${(Number.parseFloat(amount) || 0).toFixed(2)}`}
                </div>
                <div className="text-[10px] text-gray-400">
                  {`Tasa: ${rates.parallel}`}
                </div>
              </div>
            </div>
          ) : (
            // Mostrar un solo resultado para otras conversiones
            <div className="relative">
              <span className="absolute left-2 top-2 text-gray-500">{getCurrencySymbol(toCurrency)}</span>
              <input
                type="number"
                value={convertedAmount}
                readOnly
                className="w-full p-2 pl-12 border rounded-md bg-gray-50"
              />
            </div>
          )}
        </div>
      </div>

      {!error && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-sm text-gray-800 mb-3 text-center">Tasas de Cambio Actuales</h3>
          
          {/* Tasas BCV principales */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg border border-blue-300 shadow-sm">
              <div className="text-xs text-gray-500 font-semibold">BCV USD</div>
              <div className="text-lg font-bold text-blue-600">
                1 USD = <span className="text-xl">{rates.bcv}</span> Bs
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-yellow-300 shadow-sm">
              <div className="text-xs text-gray-500 font-semibold">BCV EUR</div>
              <div className="text-lg font-bold text-yellow-600">
                1 EUR = <span className="text-xl">{rates.bcv_euro}</span> Bs
              </div>
            </div>
          </div>

          {/* Otras tasas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-semibold">PARALELO</div>
              <div className="text-lg font-bold text-gray-700">
                1 USD = <span className="text-base">{rates.parallel}</span> Bs
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-semibold">COP/USD</div>
              <div className="text-lg font-bold text-gray-700">
                1 COP = <span className="text-base">{rates.cop_usd}</span> USD
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
