// Servicio para obtener las tasas de cambio entre diferentes monedas
export const ExchangeRateService = {
  // Función para obtener las tasas de cambio desde APIs confiables
  async getExchangeRates(): Promise<{
    bcv: string
    parallel: string
    cop_usd: string
    lastUpdate: string
  }> {
    try {
      // Usar la API de dolarapi.com para Venezuela
      const [bcvResponse, parallelResponse, copResponse] = await Promise.all([
        fetch("https://ve.dolarapi.com/v1/dolares/oficial"),
        fetch("https://ve.dolarapi.com/v1/dolares/paralelo"),
        // Usamos la API de exchangerate-api para el peso colombiano
        fetch("https://open.er-api.com/v6/latest/USD"),
      ])

      // Verificar si las respuestas son correctas
      if (!bcvResponse.ok || !parallelResponse.ok || !copResponse.ok) {
        throw new Error("Error al obtener datos de las APIs")
      }

      // Convertir las respuestas a JSON
      const bcvData = await bcvResponse.json()
      const parallelData = await parallelResponse.json()
      const copData = await copResponse.json()

      // Verificar si los datos son válidos
      if (!bcvData || !parallelData || !copData || !copData.rates || !copData.rates.COP) {
        throw new Error("Datos incompletos de las APIs")
      }

      // Obtener los valores
      const bcvPrice = bcvData.promedio || bcvData.venta || "Error"
      const parallelPrice = parallelData.promedio || parallelData.venta || "Error"
      const copUsdRate = (1 / copData.rates.COP).toFixed(6) // USD por 1 COP

      // Obtener la fecha de actualización
      let lastUpdate = "Desconocida"
      if (bcvData.fechaActualizacion) {
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
          lastUpdate = bcvData.fechaActualizacion
        }
      }

      return {
        bcv: bcvPrice.toString(),
        parallel: parallelPrice.toString(),
        cop_usd: copUsdRate.toString(),
        lastUpdate: `${lastUpdate} (Fuente: ${bcvData.fuente || "dolarapi.com"} y exchangerate-api)`,
      }
    } catch (error) {
      console.error("Error al obtener tasas de cambio:", error)
      return {
        bcv: "Error",
        parallel: "Error",
        cop_usd: "Error",
        lastUpdate: "No se pudieron obtener los datos. Intente nuevamente más tarde.",
      }
    }
  },

  // Método para obtener todas las tasas disponibles
  async getAllExchangeRates(): Promise<any> {
    try {
      // Obtener todas las tasas disponibles
      const [veResponse, copResponse] = await Promise.all([
        fetch("https://ve.dolarapi.com/v1/dolares"),
        fetch("https://open.er-api.com/v6/latest/USD"),
      ])

      if (!veResponse.ok || !copResponse.ok) {
        throw new Error("Error al obtener todas las tasas de cambio")
      }

      const veData = await veResponse.json()
      const copData = await copResponse.json()

      // Procesar los datos para tener un formato más amigable
      const processedData: Record<string, { price: string; name?: string }> = {}

      // Si la respuesta es un array, procesar cada elemento
      if (Array.isArray(veData)) {
        veData.forEach((item) => {
          if (item && item.nombre) {
            processedData[item.nombre] = {
              price: (item.promedio || item.venta || 0).toString(),
              name: item.nombre,
            }
          }
        })
      }

      // Añadir tasa COP/USD
      if (copData && copData.rates && copData.rates.COP) {
        processedData["COP/USD"] = {
          price: copData.rates.COP.toString(),
          name: "Peso Colombiano",
        }
      }

      return Object.keys(processedData).length > 0 ? processedData : null
    } catch (error) {
      console.error("Error al obtener todas las tasas de cambio:", error)
      return null
    }
  },

  // Método para convertir entre diferentes monedas
  convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: {
      bcv: string
      parallel: string
      cop_usd: string
    },
  ): number {
    // Primero convertimos todo a USD como moneda base
    let amountInUsd = 0

    // Convertir de la moneda origen a USD
    switch (fromCurrency) {
      case "USD":
        amountInUsd = amount
        break
      case "VES": // Bolívares
        // Usamos la tasa paralela para mayor precisión en conversiones reales
        const vesRate = Number.parseFloat(rates.parallel.replace(",", "."))
        if (!isNaN(vesRate) && vesRate !== 0) {
          amountInUsd = amount / vesRate
        }
        break
      case "COP": // Pesos colombianos
        const copRate = Number.parseFloat(rates.cop_usd.replace(",", "."))
        if (!isNaN(copRate) && copRate !== 0) {
          amountInUsd = amount * copRate // COP a USD
        }
        break
    }

    // Ahora convertimos de USD a la moneda destino
    switch (toCurrency) {
      case "USD":
        return amountInUsd
      case "VES": // Bolívares
        const vesRate = Number.parseFloat(rates.parallel.replace(",", "."))
        if (!isNaN(vesRate) && vesRate !== 0) {
          return amountInUsd * vesRate
        }
        break
      case "COP": // Pesos colombianos
        const copRate = Number.parseFloat(rates.cop_usd.replace(",", "."))
        if (!isNaN(copRate) && copRate !== 0) {
          return amountInUsd / copRate // USD a COP
        }
        break
    }

    return 0 // En caso de error
  },

  // Método para convertir entre bolívares y dólares (mantener compatibilidad)
  convertCurrencyLegacy(amount: number, rate: string, toDollars: boolean): number {
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
