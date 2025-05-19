import type { Income } from "../types"
import { v4 as uuidv4 } from "uuid"

export class IncomeService {
  private static STORAGE_KEY = "incomes"

  // Obtener todos los ingresos de un usuario
  static async getIncomes(userId: string): Promise<Income[]> {
    try {
      const storedIncomes = localStorage.getItem(this.STORAGE_KEY)
      if (!storedIncomes) {
        return []
      }

      const allIncomes: Income[] = JSON.parse(storedIncomes)
      return allIncomes.filter((income) => income.userId === userId)
    } catch (error) {
      console.error("Error al obtener ingresos:", error)
      return []
    }
  }

  // Añadir un nuevo ingreso
  static async addIncome(userId: string, income: Omit<Income, "id">): Promise<Income> {
    try {
      const storedIncomes = localStorage.getItem(this.STORAGE_KEY)
      const allIncomes: Income[] = storedIncomes ? JSON.parse(storedIncomes) : []

      const newIncome: Income = {
        ...income,
        id: uuidv4(),
        userId,
      }

      allIncomes.push(newIncome)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allIncomes))

      return newIncome
    } catch (error) {
      console.error("Error al añadir ingreso:", error)
      throw new Error("No se pudo añadir el ingreso")
    }
  }

  // Actualizar un ingreso existente
  static async updateIncome(userId: string, incomeId: string, updatedData: Partial<Income>): Promise<boolean> {
    try {
      const storedIncomes = localStorage.getItem(this.STORAGE_KEY)
      if (!storedIncomes) {
        return false
      }

      const allIncomes: Income[] = JSON.parse(storedIncomes)
      const incomeIndex = allIncomes.findIndex((income) => income.id === incomeId && income.userId === userId)

      if (incomeIndex === -1) {
        return false
      }

      allIncomes[incomeIndex] = {
        ...allIncomes[incomeIndex],
        ...updatedData,
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allIncomes))
      return true
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)
      return false
    }
  }

  // Eliminar un ingreso
  static async deleteIncome(userId: string, incomeId: string): Promise<boolean> {
    try {
      const storedIncomes = localStorage.getItem(this.STORAGE_KEY)
      if (!storedIncomes) {
        return false
      }

      const allIncomes: Income[] = JSON.parse(storedIncomes)
      const updatedIncomes = allIncomes.filter((income) => !(income.id === incomeId && income.userId === userId))

      if (updatedIncomes.length === allIncomes.length) {
        return false
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedIncomes))
      return true
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)
      return false
    }
  }

  // Obtener ingresos por mes
  static async getIncomesByMonth(userId: string, year: number, month: number): Promise<Income[]> {
    try {
      const incomes = await this.getIncomes(userId)
      const monthStr = month.toString().padStart(2, "0")
      const yearMonthPrefix = `${year}-${monthStr}`

      return incomes.filter((income) => income.date.startsWith(yearMonthPrefix))
    } catch (error) {
      console.error("Error al obtener ingresos por mes:", error)
      return []
    }
  }

  // Obtener ingresos fijos
  static async getFixedIncomes(userId: string): Promise<Income[]> {
    try {
      const incomes = await this.getIncomes(userId)
      return incomes.filter((income) => income.isFixed)
    } catch (error) {
      console.error("Error al obtener ingresos fijos:", error)
      return []
    }
  }

  // Obtener ingresos variables
  static async getVariableIncomes(userId: string): Promise<Income[]> {
    try {
      const incomes = await this.getIncomes(userId)
      return incomes.filter((income) => !income.isFixed)
    } catch (error) {
      console.error("Error al obtener ingresos variables:", error)
      return []
    }
  }

  // Calcular total de ingresos
  static async getTotalIncome(userId: string, startDate?: string, endDate?: string): Promise<number> {
    try {
      const incomes = await this.getIncomes(userId)
      let filteredIncomes = incomes

      if (startDate) {
        filteredIncomes = filteredIncomes.filter((income) => income.date >= startDate)
      }

      if (endDate) {
        filteredIncomes = filteredIncomes.filter((income) => income.date <= endDate)
      }

      return filteredIncomes.reduce((total, income) => total + income.amount, 0)
    } catch (error) {
      console.error("Error al calcular total de ingresos:", error)
      return 0
    }
  }

  // Agrupar ingresos por categoría
  static async groupIncomesByCategory(userId: string): Promise<{ [category: string]: Income[] }> {
    try {
      const incomes = await this.getIncomes(userId)
      const groupedIncomes: { [category: string]: Income[] } = {}

      incomes.forEach((income) => {
        if (!groupedIncomes[income.category]) {
          groupedIncomes[income.category] = []
        }
        groupedIncomes[income.category].push(income)
      })

      return groupedIncomes
    } catch (error) {
      console.error("Error al agrupar ingresos por categoría:", error)
      return {}
    }
  }

  // Calcular total por categoría
  static async getTotalByCategory(userId: string): Promise<{ [category: string]: number }> {
    try {
      const groupedIncomes = await this.groupIncomesByCategory(userId)
      const totalByCategory: { [category: string]: number } = {}

      Object.entries(groupedIncomes).forEach(([category, incomes]) => {
        totalByCategory[category] = incomes.reduce((total, income) => total + income.amount, 0)
      })

      return totalByCategory
    } catch (error) {
      console.error("Error al calcular total por categoría:", error)
      return {}
    }
  }
}
