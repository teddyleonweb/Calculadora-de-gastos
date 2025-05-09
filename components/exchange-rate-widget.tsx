import ExchangeRates from "./exchange-rates"
import CurrencyConverter from "./currency-converter"

export default function ExchangeRateWidget() {
  return (
    <div className="space-y-4 p-4 rounded-lg shadow-md bg-white">
      <ExchangeRates />
      <CurrencyConverter />
      {/* Display BCV value with specific styling */}
      <div className="mt-4 text-sm font-medium text-gray-700">BCV: 92.83</div>
    </div>
  )
}
