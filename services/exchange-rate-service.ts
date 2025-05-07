// Servicio para obtener las tasas de cambio del dólar en Venezuela
export const ExchangeRateService = {
  // Función para obtener las tasas de cambio desde monitordolarvenezuela.com
  async getExchangeRates(): Promise<{ bcv: string; parallel: string; lastUpdate: string }> {
    try {
      // Utilizamos un proxy CORS para evitar problemas de CORS
      const corsProxy = "https://corsproxy.io/?"
      const url = `${corsProxy}https://monitordolarvenezuela.com/`

      const response = await fetch(url)
      const html = await response.text()

      // Extraer los valores usando expresiones regulares más precisas
      // Buscamos los valores que están dentro de los divs específicos
      const bcvRegex = /Dólar BCV[\s\S]*?Bs = ([0-9,.]+)/i
      const parallelRegex = /Dólar Paralelo[\s\S]*?Bs = ([0-9,.]+)/i

      // Extraer los valores
      const bcvMatch = html.match(bcvRegex)
      const parallelMatch = html.match(parallelRegex)

      // Si no encontramos los valores con las expresiones regulares, intentar con otra estrategia
      let bcvValue = bcvMatch ? bcvMatch[1] : "No disponible"
      let parallelValue = parallelMatch ? parallelMatch[1] : "No disponible"

      // Si no se encontraron los valores, intentar con otra estrategia
      if (bcvValue === "No disponible" || parallelValue === "No disponible") {
        // Buscar por clases o IDs específicos
        const bcvAltRegex = /<div[^>]*class="[^"]*bcv[^"]*"[^>]*>[\s\S]*?Bs = ([0-9,.]+)/i
        const parallelAltRegex = /<div[^>]*class="[^"]*paralelo[^"]*"[^>]*>[\s\S]*?Bs = ([0-9,.]+)/i

        const bcvAltMatch = html.match(bcvAltRegex)
        const parallelAltMatch = html.match(parallelAltRegex)

        if (bcvAltMatch) bcvValue = bcvAltMatch[1]
        if (parallelAltMatch) parallelValue = parallelAltMatch[1]
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

      return {
        bcv: bcvValue,
        parallel: parallelValue,
        lastUpdate,
      }
    } catch (error) {
      console.error("Error al obtener tasas de cambio:", error)
      return {
        bcv: "Error",
        parallel: "Error",
        lastUpdate: new Date().toLocaleString("es-VE"),
      }
    }
  },

  // Método alternativo usando una API específica (como respaldo)
  async getExchangeRatesFromAPI(): Promise<{ bcv: string; parallel: string; lastUpdate: string }> {
    try {
      // Esta es una API ficticia, deberías reemplazarla con una API real que proporcione estos datos
      // Por ejemplo, podrías usar la API de DolarToday o alguna otra fuente confiable
      const response = await fetch("https://api.example.com/exchange-rates/venezuela")
      const data = await response.json()

      return {
        bcv: data.bcv,
        parallel: data.parallel,
        lastUpdate: data.lastUpdate,
      }
    } catch (error) {
      console.error("Error al obtener tasas de cambio desde API:", error)
      return {
        bcv: "Error",
        parallel: "Error",
        lastUpdate: new Date().toLocaleString("es-VE"),
      }
    }
  },

  // Método que intenta ambas estrategias
  async getExchangeRatesWithFallback(): Promise<{ bcv: string; parallel: string; lastUpdate: string }> {
    try {
      // Primero intentar con web scraping
      const scrapingResult = await this.getExchangeRates()

      // Si ambos valores están disponibles, retornar el resultado
      if (
        scrapingResult.bcv !== "Error" &&
        scrapingResult.bcv !== "No disponible" &&
        scrapingResult.parallel !== "Error" &&
        scrapingResult.parallel !== "No disponible"
      ) {
        return scrapingResult
      }

      // Si el scraping falló, intentar con la API
      console.log("Web scraping falló, intentando con API...")
      return await this.getExchangeRatesFromAPI()
    } catch (error) {
      console.error("Error en ambos métodos de obtención de tasas:", error)
      return {
        bcv: "No disponible",
        parallel: "No disponible",
        lastUpdate: new Date().toLocaleString("es-VE"),
      }
    }
  },
}
