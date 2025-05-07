// Servicio para obtener las tasas de cambio del dólar en Venezuela
export const ExchangeRateService = {
  // Función para obtener las tasas de cambio desde la API de dolarapi.com
  async getExchangeRates(): Promise<{ bcv: string; parallel: string; lastUpdate: string }> {
    try {
      // Usar la API de dolarapi.com
      const [bcvResponse, parallelResponse] = await Promise.all([
        fetch("https://ve.dolarapi.com/v1/dolares/oficial"),
        fetch("https://ve.dolarapi.com/v1/dolares/paralelo"),
      ])

      // Verificar si las respuestas son correctas
      if (!bcvResponse.ok || !parallelResponse.ok) {
        throw new Error("Error al obtener datos de la API")
      }

      // Convertir las respuestas a JSON
      const bcvData = await bcvResponse.json()
      const parallelData = await parallelResponse.json()

      // Verificar si los datos son válidos
      if (!bcvData || !parallelData) {
        throw new Error("Datos incompletos de la API")
      }

      // Obtener los valores de promedio (o venta si no hay promedio)
      const bcvPrice = bcvData.promedio || bcvData.venta || "Error"
      const parallelPrice = parallelData.promedio || parallelData.venta || "Error"

      // Obtener la fecha de actualización
      let lastUpdate = "Desconocida"
      if (bcvData.fechaActualizacion) {
        // Intentar formatear la fecha si está disponible
        try {
          const date = new Date(bcvData.fechaActualizacion)
          lastUpdate = date.toLocaleString("es-VE", {
            timeZone: "America/Caracas",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        } catch (e) {
          // Si hay un error al formatear, usar la fecha tal como viene
          lastUpdate = bcvData.fechaActualizacion
        }
      }

      return {
        bcv: bcvPrice.toString(),
        parallel: parallelPrice.toString(),
        lastUpdate: `${lastUpdate} (Fuente: ${bcvData.fuente || "dolarapi.com"})`,
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
      // Obtener todas las tasas disponibles
      const response = await fetch("https://ve.dolarapi.com/v1/dolares")

      if (!response.ok) {
        throw new Error("Error al obtener todas las tasas de cambio")
      }

      const data = await response.json()

      // Procesar los datos para tener un formato más amigable
      const processedData: Record<string, { price: string; name?: string }> = {}

      // Si la respuesta es un array, procesar cada elemento
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item && item.nombre) {
            processedData[item.nombre] = {
              price: (item.promedio || item.venta || 0).toString(),
              name: item.nombre,
            }
          }
        })
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
