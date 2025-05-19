// Servicio para manejar los ingresos
import type { Income } from "../types"

export class IncomeService {
  // Usar una variable de entorno o una URL relativa para la API
  private static API_URL = "/api.php"

  // Obtener todos los ingresos del usuario
  static async getIncomes(): Promise<Income[]> {
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

      const response = await fetch(`${this.API_URL}/incomes`, {
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
      console.error("Error al obtener ingresos:", error)
      return []
    }
  }

  // Añadir un nuevo ingreso
  static async addIncome(income: Omit<Income, "id" | "userId" | "createdAt">): Promise<Income> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.API_URL}/incomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(income),
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
      console.error("Error al añadir ingreso:", error)
      throw error
    }
  }

  // Actualizar un ingreso existente
  static async updateIncome(incomeId: string, updatedData: Partial<Income>): Promise<Income> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.API_URL}/incomes/${incomeId}`, {
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
      console.error("Error al actualizar ingreso:", error)
      throw error
    }
  }

  // Eliminar un ingreso
  static async deleteIncome(incomeId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`${this.API_URL}/incomes/${incomeId}`, {
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
