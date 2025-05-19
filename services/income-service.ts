import type { Income } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const IncomeService = {
  // Obtener todos los ingresos
  getIncomes: async (): Promise<Income[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/incomes`, {
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
      console.error("Error al obtener ingresos:", error)
      throw error
    }
  },

  // Añadir un nuevo ingreso
  addIncome: async (income: Income): Promise<Income> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Asegurarse de que la categoría no sea vacía
      const category = income.category || "General"

      const response = await fetch(`${API_BASE_URL}/incomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: income.description,
          amount: income.amount,
          category: category,
          date: income.date,
          isFixed: income.isFixed || false,
          frequency: income.frequency || null,
          notes: income.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al añadir ingreso:", error)
      throw error
    }
  },

  // Actualizar un ingreso existente
  updateIncome: async (income: Income): Promise<Income> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Asegurarse de que la categoría no sea vacía
      const category = income.category || "General"

      const response = await fetch(`${API_BASE_URL}/incomes/${income.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: income.description,
          amount: income.amount,
          category: category,
          date: income.date,
          isFixed: income.isFixed || false,
          frequency: income.frequency || null,
          notes: income.notes || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)
      throw error
    }
  },

  // Eliminar un ingreso
  deleteIncome: async (id: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
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
      console.error("Error al eliminar ingreso:", error)
      throw error
    }
  },
}
