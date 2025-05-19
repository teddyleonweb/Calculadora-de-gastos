// Servicio para manejar los egresos (gastos)
import type { Expense } from "../types"

export class ExpenseService {
  // Usar una variable de entorno o una URL relativa para la API
  private static API_URL = "/api.php"

  // Obtener todos los egresos del usuario
  static async getExpenses(): Promise<Expense[]> {
    try {
      // Verificar si estamos en el navegador
      if (typeof window === "undefined") {
        return []
      }

      // Verificar si hay un token disponible
      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No hay token de autenticación")
        return []
      }

      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        // Intentar obtener el mensaje de error
        let errorMessage
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || `Error HTTP: ${response.status}`
        } catch (e) {
          errorMessage = `Error HTTP: ${response.status}`
        }
        throw new Error(errorMessage)
      }

      // Verificar si la respuesta está vacía
      const text = await response.text()
      if (!text) {
        console.log("La respuesta está vacía")
        return []
      }

      // Intentar analizar la respuesta como JSON
      try {
        return JSON.parse(text)
      } catch (e) {
        console.error("Error al analizar la respuesta JSON:", text.substring(0, 100) + "...")
        return []
      }
    } catch (error) {
      console.error("Error al obtener egresos:", error)
      return []
    }
  }

  // Añadir un nuevo egreso
  static async addExpense(expense: Omit<Expense, "id" | "userId" | "createdAt">): Promise<Expense> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expense),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const text = await response.text()
      if (!text) {
        throw new Error("La respuesta está vacía")
      }

      return JSON.parse(text)
    } catch (error) {
      console.error("Error al añadir egreso:", error)
      throw error
    }
  }

  // Actualizar un egreso existente
  static async updateExpense(expenseId: string, updatedData: Partial<Expense>): Promise<Expense> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.API_URL}/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      const text = await response.text()
      if (!text) {
        throw new Error("La respuesta está vacía")
      }

      return JSON.parse(text)
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      throw error
    }
  }

  // Eliminar un egreso
  static async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.API_URL}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error HTTP: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar egreso:", error)
      return false
    }
  }

  // Obtener egresos por mes y año
  static async getExpensesByMonthAndYear(month: number, year: number): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses()
      return expenses.filter((expense) => {
        const date = new Date(expense.date)
        return date.getMonth() === month && date.getFullYear() === year
      })
    } catch (error) {
      console.error("Error al filtrar egresos por mes y año:", error)
      return []
    }
  }

  // Calcular total de egresos
  static calculateTotal(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  // Agrupar egresos por categoría
  static groupByCategory(expenses: Expense[]): Record<string, Expense[]> {
    return expenses.reduce(
      (grouped, expense) => {
        if (!grouped[expense.category]) {
          grouped[expense.category] = []
        }
        grouped[expense.category].push(expense)
        return grouped
      },
      {} as Record<string, Expense[]>,
    )
  }
}
