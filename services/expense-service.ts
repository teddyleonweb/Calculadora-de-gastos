import type { Expense } from "../types/finance"

// URL base de la API de WordPress
const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export class ExpenseService {
  static async getExpenses(userId: string): Promise<Expense[]> {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return []
      }

      // Añadir un timestamp para evitar la caché
      const timestamp = new Date().getTime()

      console.log(`Solicitando egresos desde: ${API_URL}/expenses?_t=${timestamp}`)

      const response = await fetch(`${API_URL}/expenses?_t=${timestamp}`, {
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

      console.log("Enviando datos de egreso:", expense)

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expense),
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

      console.log(`Actualizando egreso ${expenseId}:`, expense)

      const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expense),
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

      const response = await fetch(`${API_URL}/expenses/${expenseId}`, {
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
