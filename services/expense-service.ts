// Servicio para manejar los egresos (gastos)
import type { Expense } from "../types"

export class ExpenseService {
  // Usar la misma URL que ProductService
  private static API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "/api.php"

  // Obtener todos los egresos del usuario
  static async getExpenses(): Promise<Expense[]> {
    try {
      // Verificar si estamos en el navegador
      if (typeof window === "undefined") {
        return []
      }

      // Verificar si hay un token disponible
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.error("No hay token de autenticación")
        return this.loadExpensesFromLocalStorage() // Usar datos locales si no hay token
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
        console.error("Error en la respuesta de la API:", response.status, response.statusText)
        return this.loadExpensesFromLocalStorage() // Usar datos locales si la API falla
      }

      // Verificar si la respuesta está vacía
      const text = await response.text()
      if (!text) {
        console.log("La respuesta está vacía")
        return this.loadExpensesFromLocalStorage()
      }

      // Intentar analizar la respuesta como JSON
      try {
        const expenses = JSON.parse(text)
        console.log("Egresos obtenidos de la API:", expenses.length)

        // Guardar en localStorage para tener un respaldo
        this.saveExpensesToLocalStorage(expenses)
        return expenses
      } catch (e) {
        console.error("Error al analizar la respuesta JSON:", e)
        return this.loadExpensesFromLocalStorage()
      }
    } catch (error) {
      console.error("Error al obtener egresos:", error)
      return this.loadExpensesFromLocalStorage()
    }
  }

  // Añadir un nuevo egreso - SIMPLIFICADO PARA IMITAR ProductService
  static async addExpense(expense: Omit<Expense, "id" | "userId" | "createdAt">): Promise<Expense> {
    try {
      // Obtener el token
      const token = localStorage.getItem("auth_token")

      if (!token) {
        // Si no hay token, guardar localmente
        const newExpense: Expense = {
          id: `local-${Date.now()}`,
          userId: "current-user",
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          createdAt: new Date().toISOString(),
        }

        const existingExpenses = this.loadExpensesFromLocalStorage()
        this.saveExpensesToLocalStorage([...existingExpenses, newExpense])
        return newExpense
      }

      // Intentar guardar en la API - SIMILAR A ProductService
      console.log("Enviando egreso a la API:", expense)

      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expense),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error al crear egreso en la API:", errorText || response.statusText)

        // Si falla la API, guardar localmente
        const newExpense: Expense = {
          id: `local-${Date.now()}`,
          userId: "current-user",
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          createdAt: new Date().toISOString(),
        }

        const existingExpenses = this.loadExpensesFromLocalStorage()
        this.saveExpensesToLocalStorage([...existingExpenses, newExpense])
        return newExpense
      }

      const apiExpense = await response.json()
      console.log("Egreso creado en la API:", apiExpense)

      // Actualizar localStorage con el nuevo egreso de la API
      const existingExpenses = this.loadExpensesFromLocalStorage()
      this.saveExpensesToLocalStorage([...existingExpenses, apiExpense])

      return apiExpense
    } catch (error) {
      console.error("Error al añadir egreso:", error)

      // En caso de error, guardar localmente
      const newExpense: Expense = {
        id: `local-${Date.now()}`,
        userId: "current-user",
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        createdAt: new Date().toISOString(),
      }

      const existingExpenses = this.loadExpensesFromLocalStorage()
      this.saveExpensesToLocalStorage([...existingExpenses, newExpense])
      return newExpense
    }
  }

  // Actualizar un egreso existente
  static async updateExpense(expenseId: string, updatedData: Partial<Expense>): Promise<Expense> {
    try {
      // Obtener egresos actuales de localStorage
      const existingExpenses = this.loadExpensesFromLocalStorage()
      const expenseToUpdate = existingExpenses.find((expense) => expense.id === expenseId)

      if (!expenseToUpdate) {
        throw new Error("Egreso no encontrado")
      }

      // Actualizar localmente
      const updatedExpense = { ...expenseToUpdate, ...updatedData }
      const updatedExpenses = existingExpenses.map((expense) => (expense.id === expenseId ? updatedExpense : expense))

      // Guardar en localStorage
      this.saveExpensesToLocalStorage(updatedExpenses)

      // Si el ID comienza con "local-", no intentar actualizar en la API
      if (expenseId.startsWith("local-")) {
        console.log("Actualizando egreso local:", expenseId)
        return updatedExpense
      }

      // Obtener el token
      const token = localStorage.getItem("auth_token")

      // Si no hay token, devolver la versión actualizada localmente
      if (!token) {
        console.log("No hay token de autenticación, actualizando solo localmente")
        return updatedExpense
      }

      try {
        console.log("Intentando actualizar egreso en la API:", expenseId, updatedData)

        // Intentar actualizar en la API
        const response = await fetch(`${this.API_URL}/expenses/${expenseId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        })

        if (!response.ok) {
          console.error("Error al actualizar egreso en la API:", response.status, response.statusText)
          return updatedExpense // Devolver la versión actualizada localmente
        }

        const apiUpdatedExpense = await response.json()
        console.log("Egreso actualizado en la API:", apiUpdatedExpense)

        return apiUpdatedExpense
      } catch (error) {
        console.error("Error al actualizar egreso en la API, pero se actualizó localmente:", error)
        return updatedExpense
      }
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      throw error
    }
  }

  // Eliminar un egreso
  static async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      // Eliminar de localStorage
      const existingExpenses = this.loadExpensesFromLocalStorage()
      const updatedExpenses = existingExpenses.filter((expense) => expense.id !== expenseId)
      this.saveExpensesToLocalStorage(updatedExpenses)

      // Si el ID comienza con "local-", no intentar eliminar en la API
      if (expenseId.startsWith("local-")) {
        console.log("Eliminando egreso local:", expenseId)
        return true
      }

      // Obtener el token
      const token = localStorage.getItem("auth_token")

      // Si no hay token, devolver true porque se eliminó localmente
      if (!token) {
        console.log("No hay token de autenticación, eliminando solo localmente")
        return true
      }

      try {
        console.log("Intentando eliminar egreso en la API:", expenseId)

        // Intentar eliminar de la API
        const response = await fetch(`${this.API_URL}/expenses/${expenseId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          console.error("Error al eliminar egreso en la API:", response.status, response.statusText)
          return true // Devolver true porque se eliminó localmente
        }

        return true
      } catch (error) {
        console.error("Error al eliminar egreso de la API, pero se eliminó localmente:", error)
        return true // Devolver true porque se eliminó localmente
      }
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

  // Guardar egresos en localStorage
  static saveExpensesToLocalStorage(expenses: Expense[]): void {
    try {
      localStorage.setItem("cached_expenses", JSON.stringify(expenses))
      localStorage.setItem("expenses_cache_time", new Date().toISOString())
      console.log("Egresos guardados en localStorage:", expenses.length)
    } catch (error) {
      console.error("Error al guardar egresos en localStorage:", error)
    }
  }

  // Cargar egresos desde localStorage
  static loadExpensesFromLocalStorage(): Expense[] {
    try {
      const cachedExpenses = localStorage.getItem("cached_expenses")
      if (cachedExpenses) {
        const expenses = JSON.parse(cachedExpenses)
        console.log("Egresos cargados desde localStorage:", expenses.length)
        return expenses
      }
    } catch (error) {
      console.error("Error al cargar egresos desde localStorage:", error)
    }
    return []
  }

  // Limpiar la caché de egresos
  static clearExpenseCache(): void {
    try {
      localStorage.removeItem("cached_expenses")
      localStorage.removeItem("expenses_cache_time")
      console.log("Caché de egresos limpiada")
    } catch (error) {
      console.error("Error al limpiar caché de egresos:", error)
    }
  }
}
