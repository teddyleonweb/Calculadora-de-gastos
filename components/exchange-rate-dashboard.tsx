import ExchangeRates from "./exchange-rates"
import CurrencyConverter from "./currency-converter"
import ExchangeRateHistory from "./exchange-rate-history"

export default function ExchangeRateDashboard() {
  return (
    <div className="space-y-4">
      <ExchangeRates />
      <CurrencyConverter />
      <ExchangeRateHistory />
    </div>
  )
}
