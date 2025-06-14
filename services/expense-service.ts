import type { Expense } from "../types/finance"
import { API_CONFIG } from "../config/api"

export class ExpenseService {
  static async getExpenses(userId: string): Promise<Expense[]> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return []
      }

      // Cambiar la ruta a /expenses
      const url = API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/expenses"))
      console.log(`Solicitando egresos desde: ${url}`)

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
      console.log(`Egresos obtenidos: ${data.length || 0}`)

      // Si la respuesta es un array, devolverlo directamente
      if (Array.isArray(data)) {
        return data
      }
      // Si la respuesta es un objeto con una propiedad que contiene los egresos
      else if (data && typeof data === "object") {
        // Intentar encontrar una propiedad que contenga un array
        for (const key in data) {
          if (Array.isArray(data[key])) {
            return data[key]
          }
        }
      }

      // Si no se pudo obtener un array de egresos, devolver un array vacío
      console.warn("No se pudo obtener un array de egresos de la respuesta", data)
      return []
    } catch (error) {
      console.error("Error en getExpenses:", error)
      // Devolver un array vacío en caso de error
      return []
    }
  }

  static async addExpense(userId: string, expense: Omit<Expense, "id" | "createdAt">): Promise<Expense | null> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return null
      }

      // Crear una copia del objeto para no modificar el original
      const expenseToSend = { ...expense }

      // Ajustar la fecha para compensar cualquier problema de zona horaria
      if (expenseToSend.date) {
        // Dividir la fecha en partes (asumiendo formato YYYY-MM-DD)
        const parts = expenseToSend.date.split("-")
        if (parts.length === 3) {
          // Crear un objeto Date con las partes (año, mes-1, día)
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1
          const day = Number.parseInt(parts[2], 10) + 1 // Añadir un día para compensar

          // Crear la fecha y convertirla de nuevo a formato YYYY-MM-DD
          const adjustedDate = new Date(year, month, day)
          expenseToSend.date = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`
        }
      }

      console.log("Enviando datos de egreso:", expenseToSend)

      // Cambiar la ruta a /expenses
      // hasta que se implemente el endpoint específico para gastos
      const response = await fetch(API_CONFIG.getEndpointUrl("/expenses"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseToSend),
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al añadir egreso: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log("Egreso añadido:", data)
      return data
    } catch (error) {
      console.error("Error en addExpense:", error)
      return null
    }
  }

  static async updateExpense(
    userId: string,
    expenseId: string,
    expense: Partial<Omit<Expense, "id" | "createdAt">>,
  ): Promise<Expense | null> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return null
      }

      // Crear una copia del objeto para no modificar el original
      const expenseToSend = { ...expense }

      // Ajustar la fecha para compensar cualquier problema de zona horaria
      if (expenseToSend.date) {
        // Dividir la fecha en partes (asumiendo formato YYYY-MM-DD)
        const parts = expenseToSend.date.split("-")
        if (parts.length === 3) {
          // Crear un objeto Date con las partes (año, mes-1, día)
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1
          const day = Number.parseInt(parts[2], 10) + 1 // Añadir un día para compensar

          // Crear la fecha y convertirla de nuevo a formato YYYY-MM-DD
          const adjustedDate = new Date(year, month, day)
          expenseToSend.date = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`
        }
      }

      console.log(`Actualizando egreso ${expenseId}:`, expenseToSend)

      // Cambiar la ruta a /expenses
      const response = await fetch(API_CONFIG.getEndpointUrl(`/expenses/${expenseId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseToSend),
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al actualizar egreso: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log("Egreso actualizado:", data)
      return data
    } catch (error) {
      console.error("Error en updateExpense:", error)
      return null
    }
  }

  static async deleteExpense(userId: string, expenseId: string): Promise<boolean> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return false
      }

      console.log(`Eliminando egreso ${expenseId}`)

      // Cambiar la ruta a /expenses
      const response = await fetch(API_CONFIG.getEndpointUrl(`/expenses/${expenseId}`), {
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
        throw new Error(`Error al eliminar egreso: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const data = await response.json()
      console.log("Respuesta de eliminación:", data)
      return data.success === true
    } catch (error) {
      console.error("Error en deleteExpense:", error)
      return false
    }
  }
}
