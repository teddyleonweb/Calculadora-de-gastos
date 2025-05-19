// Servicio para manejar los egresos
import type { Expense } from "../types"

export class ExpenseService {
  private static API_URL = "/api.php"

  // Obtener todos los egresos del usuario
  static async getExpenses(): Promise<Expense[]> {
    try {
      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener egresos")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al obtener egresos:", error)
      return []
    }
  }

  // Añadir un nuevo egreso
  static async addExpense(expense: Omit<Expense, "id" | "userId" | "createdAt">): Promise<Expense> {
    try {
      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(expense),
      })

      if (!response.ok) {
        throw new Error("Error al añadir egreso")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al añadir egreso:", error)
      throw error
    }
  }

  // Actualizar un egreso existente
  static async updateExpense(expenseId: string, updatedData: Partial<Expense>): Promise<Expense> {
    try {
      const response = await fetch(`${this.API_URL}/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar egreso")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      throw error
    }
  }

  // Eliminar un egreso
  static async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar egreso")
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

  // Obtener egresos por categoría
  static async getExpensesByCategory(category: string): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses()
      return expenses.filter((expense) => expense.category === category)
    } catch (error) {
      console.error("Error al filtrar egresos por categoría:", error)
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
