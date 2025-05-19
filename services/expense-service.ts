// Servicio para manejar los egresos (gastos)
import type { Expense } from "@/types"

export class ExpenseService {
  // URL de la API (misma que usa ProductService e IncomeService)
  private static API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "/api.php"

  // Clave para localStorage
  private static STORAGE_KEY = "price_extractor_expenses"

  /**
   * Obtiene todos los egresos del usuario
   */
  static async getExpenses(): Promise<Expense[]> {
    try {
      // Verificar si estamos en el navegador
      if (typeof window === "undefined") {
        return []
      }

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.log("No hay token de autenticación, cargando desde localStorage")
        return this.loadExpensesFromLocalStorage()
      }

      // Intentar obtener desde la API - CORREGIDO: usar la ruta correcta /expenses
      console.log("Obteniendo egresos desde la API")
      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error(`Error al obtener egresos: ${response.status} ${response.statusText}`)
        return this.loadExpensesFromLocalStorage()
      }

      const data = await response.json()
      console.log("Egresos obtenidos de la API:", data)

      // Guardar en localStorage como respaldo
      this.saveExpensesToLocalStorage(data)

      return data
    } catch (error) {
      console.error("Error al obtener egresos:", error)
      return this.loadExpensesFromLocalStorage()
    }
  }

  // Método addExpense usando JSON y la ruta correcta
  static async addExpense(expense: Omit<Expense, "id" | "userId" | "createdAt">): Promise<Expense> {
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.log("No hay token de autenticación, guardando solo localmente")
        // Si no hay token, guardar solo localmente
        const newExpense: Expense = {
          id: `local-${Date.now()}`,
          userId: "current-user",
          description: expense.description,
          amount: expense.amount,
          category: expense.category || "General", // Asegurar que siempre haya una categoría
          date: expense.date,
          createdAt: new Date().toISOString(),
        }

        const existingExpenses = this.loadExpensesFromLocalStorage()
        this.saveExpensesToLocalStorage([...existingExpenses, newExpense])
        return newExpense
      }

      // Asegurar que la categoría nunca sea vacía
      const category = expense.category || "General"

      // Usar JSON y la ruta correcta
      const expenseData = {
        description: expense.description,
        amount: expense.amount,
        category: category,
        date: expense.date,
      }

      // Intentar guardar en la API
      console.log("Enviando egreso a la API:", expenseData)
      const response = await fetch(`${this.API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al crear egreso: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al crear egreso: ${response.status} ${errorText || response.statusText}`)
      }

      const apiExpense = await response.json()
      console.log("Egreso creado en la API:", apiExpense)

      // Actualizar localStorage con el nuevo egreso
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
        category: expense.category || "General",
        date: expense.date,
        createdAt: new Date().toISOString(),
      }

      const existingExpenses = this.loadExpensesFromLocalStorage()
      this.saveExpensesToLocalStorage([...existingExpenses, newExpense])
      return newExpense
    }
  }

  // Método updateExpense usando JSON y la ruta correcta
  static async updateExpense(
    id: string,
    expense: Partial<Omit<Expense, "id" | "userId" | "createdAt">>,
  ): Promise<Expense> {
    try {
      // Si es un ID local, actualizar solo localmente
      if (id.startsWith("local-")) {
        const existingExpenses = this.loadExpensesFromLocalStorage()
        const expenseToUpdate = existingExpenses.find((item) => item.id === id)

        if (!expenseToUpdate) {
          throw new Error("Egreso no encontrado")
        }

        // Asegurar que la categoría nunca sea vacía
        if (expense.category === "") {
          expense.category = "General"
        }

        const updatedExpense = { ...expenseToUpdate, ...expense }
        const updatedExpenses = existingExpenses.map((item) => (item.id === id ? updatedExpense : item))

        this.saveExpensesToLocalStorage(updatedExpenses)
        return updatedExpense
      }

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // Asegurar que la categoría nunca sea vacía
      if (expense.category === "") {
        expense.category = "General"
      }

      // Usar JSON y la ruta correcta
      const updateData: any = { ...expense }

      // Intentar actualizar en la API
      console.log("Actualizando egreso en la API:", updateData)
      const response = await fetch(`${this.API_URL}/expenses/${id}`, {
        method: "PUT", // Usar PUT para actualizar
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al actualizar egreso: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al actualizar egreso: ${response.status} ${errorText || response.statusText}`)
      }

      const updatedExpense = await response.json()
      console.log("Egreso actualizado en la API:", updatedExpense)

      // Actualizar en localStorage
      const existingExpenses = this.loadExpensesFromLocalStorage()
      const updatedExpenses = existingExpenses.map((item) => (item.id === id ? updatedExpense : item))

      this.saveExpensesToLocalStorage(updatedExpenses)
      return updatedExpense
    } catch (error) {
      console.error("Error al actualizar egreso:", error)

      // Si hay error y tenemos los datos del egreso, intentar actualizar localmente
      if (id && !id.startsWith("local-")) {
        const existingExpenses = this.loadExpensesFromLocalStorage()
        const expenseToUpdate = existingExpenses.find((item) => item.id === id)

        if (expenseToUpdate) {
          // Asegurar que la categoría nunca sea vacía
          if (expense.category === "") {
            expense.category = "General"
          }

          const updatedExpense = { ...expenseToUpdate, ...expense }
          const updatedExpenses = existingExpenses.map((item) => (item.id === id ? updatedExpense : item))

          this.saveExpensesToLocalStorage(updatedExpenses)
          return updatedExpense
        }
      }

      throw error
    }
  }

  // Método deleteExpense usando la ruta correcta
  static async deleteExpense(id: string): Promise<boolean> {
    try {
      // Si es un ID local, eliminar solo localmente
      if (id.startsWith("local-")) {
        const existingExpenses = this.loadExpensesFromLocalStorage()
        const filteredExpenses = existingExpenses.filter((item) => item.id !== id)

        this.saveExpensesToLocalStorage(filteredExpenses)
        return true
      }

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // Intentar eliminar en la API usando la ruta correcta
      console.log("Eliminando egreso en la API:", id)
      const response = await fetch(`${this.API_URL}/expenses/${id}`, {
        method: "DELETE", // Usar DELETE para eliminar
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al eliminar egreso: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error al eliminar egreso: ${response.status} ${errorText || response.statusText}`)
      }

      // Eliminar de localStorage
      const existingExpenses = this.loadExpensesFromLocalStorage()
      const filteredExpenses = existingExpenses.filter((item) => item.id !== id)

      this.saveExpensesToLocalStorage(filteredExpenses)
      return true
    } catch (error) {
      console.error("Error al eliminar egreso:", error)

      // Si hay error, intentar eliminar localmente de todos modos
      if (id) {
        const existingExpenses = this.loadExpensesFromLocalStorage()
        const filteredExpenses = existingExpenses.filter((item) => item.id !== id)

        this.saveExpensesToLocalStorage(filteredExpenses)
        return true
      }

      return false
    }
  }

  /**
   * Carga egresos desde localStorage
   */
  static loadExpensesFromLocalStorage(): Expense[] {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY)
      return storedData ? JSON.parse(storedData) : []
    } catch (error) {
      console.error("Error al cargar egresos desde localStorage:", error)
      return []
    }
  }

  /**
   * Guarda egresos en localStorage
   */
  static saveExpensesToLocalStorage(expenses: Expense[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(expenses))
      console.log("Egresos guardados en localStorage:", expenses.length)
    } catch (error) {
      console.error("Error al guardar egresos en localStorage:", error)
    }
  }

  /**
   * Limpia la caché de egresos
   */
  static clearExpenseCache(): void {
    // No tenemos una caché en memoria, solo en localStorage
    // Pero podríamos implementarla si es necesario
  }

  /**
   * Agrupa egresos por categoría
   */
  static groupByCategory(expenses: Expense[]): Record<string, Expense[]> {
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
  }

  /**
   * Calcula el total de egresos
   */
  static calculateTotal(expenses: Expense[]): number {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }
}
