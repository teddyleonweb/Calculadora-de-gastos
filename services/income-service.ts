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
  updateIncome: async (id: string | number, incomeData: Partial<Income>): Promise<Income> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Asegurarse de que la categoría no sea vacía
      const category = incomeData.category || "General"

      const response = await fetch(`${API_BASE_URL}/incomes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: incomeData.description,
          amount: incomeData.amount,
          category: category,
          date: incomeData.date,
          isFixed: incomeData.isFixed || false,
          frequency: incomeData.frequency || null,
          notes: incomeData.notes || null,
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
  deleteIncome: async (id: string | number): Promise<boolean> => {
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

  // Agrupa ingresos por categoría
  groupByCategory: (incomes: Income[]): Record<string, Income[]> => {
    return incomes.reduce(
      (acc, income) => {
        const category = income.category || "Sin categoría"
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(income)
        return acc
      },
      {} as Record<string, Income[]>,
    )
  },

  // Calcula el total de ingresos
  calculateTotal: (incomes: Income[]): number => {
    return incomes.reduce((total, income) => total + income.amount, 0)
  },

  // Carga ingresos desde localStorage (para respaldo)
  loadIncomesFromLocalStorage: (): Income[] => {
    try {
      const storedData = localStorage.getItem("price_extractor_incomes")
      return storedData ? JSON.parse(storedData) : []
    } catch (error) {
      console.error("Error al cargar ingresos desde localStorage:", error)
      return []
    }
  },

  // Guarda ingresos en localStorage (para respaldo)
  saveIncomesToLocalStorage: (incomes: Income[]): void => {
    try {
      localStorage.setItem("price_extractor_incomes", JSON.stringify(incomes))
    } catch (error) {
      console.error("Error al guardar ingresos en localStorage:", error)
    }
  },

  // Limpia la caché de ingresos
  clearIncomeCache: (): void => {
    // Esta función se mantiene por compatibilidad, pero no hace nada en la nueva implementación
    console.log("Caché de ingresos limpiada")
  },
}
