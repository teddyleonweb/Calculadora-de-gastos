// Servicio para obtener tasas de cambio
export class ExchangeRateService {
  // Obtener las tasas de cambio principales (BCV y paralelo)
  static async getExchangeRates() {
    try {
      // Obtener la tasa del BCV (oficial)
      const bcvResponse = await fetch("https://ve.dolarapi.com/v1/dolares/oficial")
      const bcvData = await bcvResponse.json()

      // Obtener la tasa del paralelo
      const parallelResponse = await fetch("https://ve.dolarapi.com/v1/dolares/paralelo")
      const parallelData = await parallelResponse.json()

      // Formatear la fecha de actualización
      const lastUpdate = new Date(bcvData.fechaActualizacion).toLocaleString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })

      return {
        bcv: bcvData.venta.toFixed(2),
        parallel: parallelData.venta.toFixed(2),
        lastUpdate,
      }
    } catch (error) {
      console.error("Error al obtener tasas de cambio:", error)
      return {
        bcv: "Error",
        parallel: "Error",
        lastUpdate: "Error al obtener datos",
      }
    }
  }

  // Obtener todas las tasas de cambio disponibles
  static async getAllExchangeRates() {
    try {
      // Obtener todas las tasas
      const response = await fetch("https://ve.dolarapi.com/v1/dolares")
      const data = await response.json()

      // Procesar los datos para tener un formato uniforme
      const formattedRates = {}

      // Procesar cada monitor
      data.forEach((monitor) => {
        formattedRates[monitor.nombre] = {
          price: monitor.venta.toFixed(2),
          lastUpdate: new Date(monitor.fechaActualizacion).toLocaleString(),
        }
      })

      return formattedRates
    } catch (error) {
      console.error("Error al obtener todas las tasas de cambio:", error)
      return null
    }
  }
}
