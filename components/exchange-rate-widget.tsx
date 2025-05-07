import ExchangeRates from "./exchange-rates"
import CurrencyConverter from "./currency-converter"

export default function ExchangeRateWidget() {
  return (
    <div className="space-y-4">
      <ExchangeRates />
      <CurrencyConverter />
    </div>
  )
}
