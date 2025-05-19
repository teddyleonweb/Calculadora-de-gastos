// Servicio para manejar los ingresos
import type { Income } from "../types"

export class IncomeService {
  private static API_URL = "/api.php"

  // Obtener todos los ingresos del usuario
  static async getIncomes(): Promise<Income[]> {
    try {
      const response = await fetch(`${this.API_URL}/incomes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener ingresos")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al obtener ingresos:", error)
      return []
    }
  }

  // Añadir un nuevo ingreso
  static async addIncome(income: Omit<Income, "id" | "userId" | "createdAt">): Promise<Income> {
    try {
      const response = await fetch(`${this.API_URL}/incomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(income),
      })

      if (!response.ok) {
        throw new Error("Error al añadir ingreso")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al añadir ingreso:", error)
      throw error
    }
  }

  // Actualizar un ingreso existente
  static async updateIncome(incomeId: string, updatedData: Partial<Income>): Promise<Income> {
    try {
      const response = await fetch(`${this.API_URL}/incomes/${incomeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar ingreso")
      }

      return await response.json()
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)
      throw error
    }
  }

  // Eliminar un ingreso
  static async deleteIncome(incomeId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/incomes/${incomeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar ingreso")
      }

      return true
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)
      return false
    }
  }

  // Obtener ingresos por mes y año
  static async getIncomesByMonthAndYear(month: number, year: number): Promise<Income[]> {
    try {
      const incomes = await this.getIncomes()
      return incomes.filter((income) => {
        const date = new Date(income.date)
        return date.getMonth() === month && date.getFullYear() === year
      })
    } catch (error) {
      console.error("Error al filtrar ingresos por mes y año:", error)
      return []
    }
  }

  // Obtener ingresos fijos
  static async getFixedIncomes(): Promise<Income[]> {
    try {
      const incomes = await this.getIncomes()
      return incomes.filter((income) => income.isFixed)
    } catch (error) {
      console.error("Error al obtener ingresos fijos:", error)
      return []
    }
  }

  // Obtener ingresos variables
  static async getVariableIncomes(): Promise<Income[]> {
    try {
      const incomes = await this.getIncomes()
      return incomes.filter((income) => !income.isFixed)
    } catch (error) {
      console.error("Error al obtener ingresos variables:", error)
      return []
    }
  }

  // Calcular total de ingresos
  static calculateTotal(incomes: Income[]): number {
    return incomes.reduce((total, income) => total + income.amount, 0)
  }

  // Agrupar ingresos por categoría
  static groupByCategory(incomes: Income[]): Record<string, Income[]> {
    return incomes.reduce(
      (grouped, income) => {
        if (!grouped[income.category]) {
          grouped[income.category] = []
        }
        grouped[income.category].push(income)
        return grouped
      },
      {} as Record<string, Income[]>,
    )
  }
}
