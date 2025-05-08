import ExchangeRates from "./exchange-rates"
import CurrencyConverter from "./currency-converter"

export default function ExchangeRateDashboard() {
  return (
    <div className="space-y-4">
      <ExchangeRates />
      <CurrencyConverter />
    </div>
  )
}
