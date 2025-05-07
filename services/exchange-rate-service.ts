// Servicio para obtener las tasas de cambio del dólar en Venezuela
export const ExchangeRateService = {
  // Función para obtener las tasas de cambio desde la API de pydolarvenezuela
  async getExchangeRates(): Promise<{ bcv: string; parallel: string; lastUpdate: string }> {
    try {
      // Usar las URLs proporcionadas para la API
      const [bcvResponse, parallelResponse] = await Promise.all([
        fetch("https://pydolarve.org/api/v2/dollar?monitor=bcv"),
        fetch("https://pydolarve.org/api/v2/dollar?monitor=enparalelovzla"),
      ])

      // Verificar si las respuestas son correctas
      if (!bcvResponse.ok || !parallelResponse.ok) {
        throw new Error("Error al obtener datos de la API")
      }

      // Convertir las respuestas a JSON
      const bcvData = await bcvResponse.json()
      const parallelData = await parallelResponse.json()

      // Verificar si los datos son válidos
      if (!bcvData.data || !bcvData.data.price || !parallelData.data || !parallelData.data.price) {
        throw new Error("Datos incompletos de la API")
      }

      // Obtener la fecha y hora actual en formato venezolano
      const now = new Date()
      const lastUpdate = now.toLocaleString("es-VE", {
        timeZone: "America/Caracas",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      // Formatear los precios para asegurar que usen punto como separador decimal
      const bcvPrice = bcvData.data.price.toString().replace(",", ".")
      const parallelPrice = parallelData.data.price.toString().replace(",", ".")

      return {
        bcv: bcvPrice,
        parallel: parallelPrice,
        lastUpdate: `${lastUpdate} (Fuente: pydolarvenezuela)`,
      }
    } catch (error) {
      console.error("Error al obtener tasas de cambio:", error)

      // En caso de error, devolvemos un mensaje de error
      return {
        bcv: "Error",
        parallel: "Error",
        lastUpdate: "No se pudieron obtener los datos. Intente nuevamente más tarde.",
      }
    }
  },

  // Método para obtener todas las tasas disponibles
  async getAllExchangeRates(): Promise<any> {
    try {
      const response = await fetch("https://pydolarve.org/api/v2/dollar")

      if (!response.ok) {
        throw new Error("Error al obtener todas las tasas de cambio")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al obtener todas las tasas de cambio:", error)
      return null
    }
  },

  // Método para convertir entre bolívares y dólares
  convertCurrency(amount: number, rate: string, toDollars: boolean): number {
    const rateValue = Number.parseFloat(rate.replace(",", "."))

    if (isNaN(rateValue) || rateValue === 0) {
      return 0
    }

    if (toDollars) {
      // Convertir de bolívares a dólares
      return amount / rateValue
    } else {
      // Convertir de dólares a bolívares
      return amount * rateValue
    }
  },
}
