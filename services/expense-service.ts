// Servicio para manejar los egresos (gastos)
import type { Expense } from "@/types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const ExpenseService = {
  // Obtener todos los egresos
  getExpenses: async (): Promise<Expense[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al obtener egresos:", error)
      throw error
    }
  },

  // Añadir un nuevo egreso
  addExpense: async (expense: Expense): Promise<Expense> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Asegurarse de que la categoría no sea vacía
      const category = expense.category || "General"

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: expense.description,
          amount: expense.amount,
          category: category,
          date: expense.date,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al añadir egreso:", error)
      throw error
    }
  },

  // Actualizar un egreso existente
  updateExpense: async (expense: Expense): Promise<Expense> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Asegurarse de que la categoría no sea vacía
      const category = expense.category || "General"

      const response = await fetch(`${API_BASE_URL}/expenses/${expense.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: expense.description,
          amount: expense.amount,
          category: category,
          date: expense.date,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      throw error
    }
  },

  // Eliminar un egreso
  deleteExpense: async (id: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar egreso:", error)
      throw error
    }
  },

  /**
   * Carga egresos desde localStorage
   */
  loadExpensesFromLocalStorage(): Expense[] {
    try {
      const storedData = localStorage.getItem("price_extractor_expenses")
      return storedData ? JSON.parse(storedData) : []
    } catch (error) {
      console.error("Error al cargar egresos desde localStorage:", error)
      return []
    }
  },

  /**
   * Guarda egresos en localStorage
   */
  saveExpensesToLocalStorage(expenses: Expense[]): void {
    try {
      localStorage.setItem("price_extractor_expenses", JSON.stringify(expenses))
      console.log("Egresos guardados en localStorage:", expenses.length)
    } catch (error) {
      console.error("Error al guardar egresos en localStorage:", error)
    }
  },

  /**
   * Limpia la caché de egresos
   */
  clearExpenseCache(): void {
    // No tenemos una caché en memoria, solo en localStorage
    // Pero podríamos implementarla si es necesario
  },

  /**
   * Agrupa egresos por categoría
   */
  groupByCategory(expenses: Expense[]): Record<string, Expense[]> {
    return expenses.reduce(
      (acc, expense) => {
        const category = expense.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(expense)
        return acc
      },
      {} as Record<string, Expense[]>,
    )
  },

  /**
   * Calcula el total de egresos
   */
  calculateTotal(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  },
}
