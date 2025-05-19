// Servicio para manejar los egresos
import type { Expense } from "../types"

export class ExpenseService {
  // Obtener todos los egresos del usuario
  static async getExpenses(userId: string): Promise<Expense[]> {
    try {
      // Intentar obtener los egresos del localStorage
      const cachedExpenses = localStorage.getItem(`expenses_${userId}`)
      if (cachedExpenses) {
        return JSON.parse(cachedExpenses)
      }
      return []
    } catch (error) {
      console.error("Error al obtener egresos:", error)
      return []
    }
  }

  // Añadir un nuevo egreso
  static async addExpense(userId: string, expense: Omit<Expense, "id">): Promise<Expense> {
    try {
      // Generar un ID único para el egreso
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)

      // Crear el nuevo egreso con el ID generado
      const newExpense: Expense = {
        ...expense,
        id,
        userId,
      }

      // Obtener los egresos existentes
      const expenses = await this.getExpenses(userId)

      // Añadir el nuevo egreso
      expenses.push(newExpense)

      // Guardar los egresos actualizados en localStorage
      localStorage.setItem(`expenses_${userId}`, JSON.stringify(expenses))

      return newExpense
    } catch (error) {
      console.error("Error al añadir egreso:", error)
      throw error
    }
  }

  // Actualizar un egreso existente
  static async updateExpense(userId: string, expenseId: string, updatedData: Partial<Expense>): Promise<boolean> {
    try {
      // Obtener los egresos existentes
      const expenses = await this.getExpenses(userId)

      // Encontrar el índice del egreso a actualizar
      const index = expenses.findIndex((expense) => expense.id === expenseId)

      if (index === -1) {
        return false
      }

      // Actualizar el egreso
      expenses[index] = {
        ...expenses[index],
        ...updatedData,
      }

      // Guardar los egresos actualizados en localStorage
      localStorage.setItem(`expenses_${userId}`, JSON.stringify(expenses))

      return true
    } catch (error) {
      console.error("Error al actualizar egreso:", error)
      return false
    }
  }

  // Eliminar un egreso
  static async deleteExpense(userId: string, expenseId: string): Promise<boolean> {
    try {
      // Obtener los egresos existentes
      const expenses = await this.getExpenses(userId)

      // Filtrar el egreso a eliminar
      const updatedExpenses = expenses.filter((expense) => expense.id !== expenseId)

      // Guardar los egresos actualizados en localStorage
      localStorage.setItem(`expenses_${userId}`, JSON.stringify(updatedExpenses))

      return true
    } catch (error) {
      console.error("Error al eliminar egreso:", error)
      return false
    }
  }
}
