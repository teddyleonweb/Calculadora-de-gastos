import type { Expense } from "../types/finance"
import { API_CONFIG } from "../config/api"

export class ExpenseService {
  static async getExpenses(userId: string, projectId?: string): Promise<Expense[]> {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return []
      }

      let url = API_CONFIG.getEndpointUrl("/expenses")
      if (projectId) {
        url += `?project_id=${projectId}` // Añadir project_id como parámetro de consulta
      }
      url = API_CONFIG.getUrlWithTimestamp(url)
      console.log(`Solicitando egresos desde: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`Egresos obtenidos: ${data.length || 0}`)

      if (Array.isArray(data)) {
        return data
      } else if (data && typeof data === "object") {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            return data[key]
          }
        }
      }

      console.warn("No se pudo obtener un array de egresos de la respuesta", data)
      return []
    } catch (error) {
      console.error("Error en getExpenses:", error)
      return []
    }
  }

  static async addExpense(
    userId: string,
    expense: Omit<Expense, "id" | "createdAt"> & { projectId: string },
  ): Promise<Expense | null> {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return null
      }

      const expenseToSend = { ...expense }

      // Asegurarse de que projectId esté incluido en el payload
      if (!expenseToSend.projectId) {
        console.error("projectId es requerido para añadir un egreso")
        return null
      }

      if (expenseToSend.date) {
        const parts = expenseToSend.date.split("-")
        if (parts.length === 3) {
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1
          const day = Number.parseInt(parts[2], 10) + 1

          const adjustedDate = new Date(year, month, day)
          expenseToSend.date = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`
        }
      }

      console.log("Enviando datos de egreso:", expenseToSend)

      const response = await fetch(API_CONFIG.getEndpointUrl("/expenses"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseToSend),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al añadir egreso: ${response.status} ${response.statusText}`)
      }

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
    expense: Partial<Omit<Expense, "id" | "createdAt">> & { projectId?: string },
  ): Promise<Expense | null> {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return null
      }

      const expenseToSend = { ...expense }

      if (expenseToSend.date) {
        const parts = expenseToSend.date.split("-")
        if (parts.length === 3) {
          const year = Number.parseInt(parts[0], 10)
          const month = Number.parseInt(parts[1], 10) - 1
          const day = Number.parseInt(parts[2], 10) + 1

          const adjustedDate = new Date(year, month, day)
          expenseToSend.date = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`
        }
      }

      console.log(`Actualizando egreso ${expenseId}:`, expenseToSend)

      const response = await fetch(API_CONFIG.getEndpointUrl(`/expenses/${expenseId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseToSend),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al actualizar egreso: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Egreso actualizado:", data)
      return data
    } catch (error) {
      console.error("Error en updateExpense:", error)
      return null
    }
  }

  static async deleteExpense(userId: string, expenseId: string, projectId?: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return false
      }

      console.log(`Eliminando egreso ${expenseId} para proyecto ${projectId || "N/A"}`)
      // Enviar projectId en el cuerpo si la API lo requiere para el alcance de la eliminación
      const body = projectId ? JSON.stringify({ project_id: projectId }) : undefined

      const response = await fetch(API_CONFIG.getEndpointUrl(`/expenses/${expenseId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al eliminar egreso: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Respuesta de eliminación:", data)
      return data.success === true
    } catch (error) {
      console.error("Error en deleteExpense:", error)
      return false
    }
  }
}
