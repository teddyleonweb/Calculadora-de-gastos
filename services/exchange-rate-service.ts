// Servicio para obtener las tasas de cambio del dólar en Venezuela
export const ExchangeRateService = {
  // Función para obtener las tasas de cambio desde la API de pydolarvenezuela
  async getExchangeRates(): Promise<{ bcv: string; parallel: string; lastUpdate: string }> {
    try {
      // Usar el endpoint correcto según la documentación
      const bcvResponse = await fetch("https://pydolarve.org/api/v2/tipo-cambio")

      // Para el dólar paralelo, usamos el endpoint de monitores específicos
      const parallelResponse = await fetch("https://pydolarve.org/api/v2/monitors/enparalelovzla")

      // Verificar si las respuestas son correctas
      if (!bcvResponse.ok || !parallelResponse.ok) {
        throw new Error("Error al obtener datos de la API")
      }

      // Convertir las respuestas a JSON
      const bcvData = await bcvResponse.json()
      const parallelData = await parallelResponse.json()

      // Verificar la estructura de los datos y extraer los precios
      let bcvPrice = "Error"
      let parallelPrice = "Error"

      // Extraer el precio del BCV
      if (bcvData && bcvData.price) {
        bcvPrice = bcvData.price.toString()
      }

      // Extraer el precio del paralelo
      if (parallelData && parallelData.price) {
        parallelPrice = parallelData.price.toString()
      }

      // Si no se pudieron obtener los precios, intentar con una estructura alternativa
      if (bcvPrice === "Error" && bcvData && bcvData.data && bcvData.data.price) {
        bcvPrice = bcvData.data.price.toString()
      }

      if (parallelPrice === "Error" && parallelData && parallelData.data && parallelData.data.price) {
        parallelPrice = parallelData.data.price.toString()
      }

      // Si aún no tenemos precios válidos, lanzar un error
      if (bcvPrice === "Error" || parallelPrice === "Error") {
        console.error("Estructura de respuesta inesperada:", { bcvData, parallelData })
        throw new Error("Estructura de datos inesperada en la respuesta de la API")
      }

      // Formatear los precios para asegurar que usen punto como separador decimal
      bcvPrice = bcvPrice.replace(",", ".")
      parallelPrice = parallelPrice.replace(",", ".")

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

      return {
        bcv: bcvPrice,
        parallel: parallelPrice,
        lastUpdate: `${lastUpdate} (Fuente: pydolarve.org)`,
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
      const response = await fetch("https://pydolarve.org/api/v2/monitors")

      if (!response.ok) {
        throw new Error("Error al obtener todas las tasas de cambio")
      }

      const data = await response.json()

      // Procesar los datos para tener un formato más amigable
      const processedData: Record<string, { price: string; name?: string }> = {}

      // Si la respuesta tiene la estructura esperada, procesarla
      if (data && typeof data === "object") {
        // Intentar diferentes estructuras posibles
        if (Array.isArray(data)) {
          // Si es un array, procesar cada elemento
          data.forEach((monitor) => {
            if (monitor && monitor.name && monitor.price) {
              processedData[monitor.name] = {
                price: monitor.price.toString(),
                name: monitor.name,
              }
            }
          })
        } else if (data.monitors && typeof data.monitors === "object") {
          // Si tiene una propiedad 'monitors', procesar cada monitor
          Object.entries(data.monitors).forEach(([key, value]: [string, any]) => {
            if (value && value.price) {
              processedData[key] = {
                price: value.price.toString(),
                name: key,
              }
            }
          })
        }
      }

      return Object.keys(processedData).length > 0 ? processedData : null
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
