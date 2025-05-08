export const ExchangeRateService = {
  getExchangeRates: async (): Promise<{ bcv: string; parallel: string }> => {
    try {
      // Simulación de obtención de tasas de cambio
      // En un entorno real, esto haría una petición a una API
      return {
        bcv: "35.50",
        parallel: "37.80",
      }
    } catch (error) {
      console.error("Error al obtener tasas de cambio:", error)
      return {
        bcv: "Error",
        parallel: "Error",
      }
    }
  },
}
