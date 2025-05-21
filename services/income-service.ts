import type { Income } from "../types/finance"
import { API_CONFIG } from "../config/api"

export class IncomeService {
  static async getIncomes(userId: string): Promise<Income[]> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return []
      }

      // Añadir un timestamp para evitar la caché
      const url = API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/incomes"))
      console.log(`Solicitando ingresos desde: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log(`Ingresos obtenidos: ${data.length || 0}`)

      // Si la respuesta es un array, devolverlo directamente
      if (Array.isArray(data)) {
        return data
      }
      // Si la respuesta es un objeto con una propiedad que contiene los ingresos
      else if (data && typeof data === "object") {
        // Intentar encontrar una propiedad que contenga un array
        for (const key in data) {
          if (Array.isArray(data[key])) {
            return data[key]
          }
        }
      }

      // Si no se pudo obtener un array de ingresos, devolver un array vacío
      console.warn("No se pudo obtener un array de ingresos de la respuesta", data)
      return []
    } catch (error) {
      console.error("Error en getIncomes:", error)
      // Devolver un array vacío en caso de error
      return []
    }
  }

  static async addIncome(userId: string, income: Omit<Income, "id" | "createdAt">): Promise<Income | null> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return null
      }

      // Crear una copia del objeto para no modificar el original
      const incomeToSend = { ...income }

      // Ajustar la fecha para compensar cualquier problema de zona horaria
      if (incomeToSend.date) {
        // Dividir la fecha en partes (asumiendo formato YYYY-MM-DD)
        const parts = incomeToSend.date.split("-")
        if (parts.length === 3) {
          // Crear un objeto Date con las partes (año, mes-1, día)
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1
          const day = Number.parseInt(parts[2], 10) + 1 // Añadir un día para compensar

          // Crear la fecha y convertirla de nuevo a formato YYYY-MM-DD
          const adjustedDate = new Date(year, month, day)
          incomeToSend.date = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`
        }
      }

      console.log("Enviando datos de ingreso:", incomeToSend)

      const response = await fetch(API_CONFIG.getEndpointUrl("/incomes"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(incomeToSend),
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al añadir ingreso: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log("Ingreso añadido:", data)
      return data
    } catch (error) {
      console.error("Error en addIncome:", error)
      return null
    }
  }

  static async updateIncome(
    userId: string,
    incomeId: string,
    income: Partial<Omit<Income, "id" | "createdAt">>,
  ): Promise<Income | null> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return null
      }

      // Crear una copia del objeto para no modificar el original
      const incomeToSend = { ...income }

      // Ajustar la fecha para compensar cualquier problema de zona horaria
      if (incomeToSend.date) {
        // Dividir la fecha en partes (asumiendo formato YYYY-MM-DD)
        const parts = incomeToSend.date.split("-")
        if (parts.length === 3) {
          // Crear un objeto Date con las partes (año, mes-1, día)
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1
          const day = Number.parseInt(parts[2], 10) + 1 // Añadir un día para compensar

          // Crear la fecha y convertirla de nuevo a formato YYYY-MM-DD
          const adjustedDate = new Date(year, month, day)
          incomeToSend.date = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`
        }
      }

      console.log(`Actualizando ingreso ${incomeId}:`, incomeToSend)

      const response = await fetch(API_CONFIG.getEndpointUrl(`/incomes/${incomeId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(incomeToSend),
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al actualizar ingreso: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log("Ingreso actualizado:", data)
      return data
    } catch (error) {
      console.error("Error en updateIncome:", error)
      return null
    }
  }

  static async deleteIncome(userId: string, incomeId: string): Promise<boolean> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return false
      }

      console.log(`Eliminando ingreso ${incomeId}`)

      const response = await fetch(API_CONFIG.getEndpointUrl(`/incomes/${incomeId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al eliminar ingreso: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log("Respuesta de eliminación:", data)
      return data.success === true
    } catch (error) {
      console.error("Error en deleteIncome:", error)
      return false
    }
  }
}
