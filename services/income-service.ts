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

      // Intentar obtener datos de la API
      const response = await fetch(`${API_BASE_URL}/incomes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const remoteIncomes = await response.json()

      // Guardar los datos remotos en localStorage como respaldo
      // pero NO mezclar con datos locales para evitar conflictos
      IncomeService.saveIncomesToLocalStorage(remoteIncomes)

      console.log("Ingresos obtenidos de la API:", remoteIncomes.length)
      return remoteIncomes
    } catch (error) {
      console.error("Error al obtener ingresos de la API:", error)

      // Solo usar localStorage como fallback si hay un error de red
      console.log("Intentando cargar ingresos desde localStorage como respaldo...")
      const localIncomes = IncomeService.loadIncomesFromLocalStorage()

      if (localIncomes.length > 0) {
        console.log("Se cargaron", localIncomes.length, "ingresos desde localStorage")
        return localIncomes
      }

      throw error
    }
  },

  // Añadir un nuevo ingreso
  addIncome: async (incomeData: Partial<Income>): Promise<Income> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Asegurarse de que la categoría no sea vacía
      const category = incomeData.category || "General"

      const response = await fetch(`${API_BASE_URL}/incomes`, {
        method: "POST",
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

      const newIncome = await response.json()

      // Actualizar el localStorage después de añadir exitosamente a la API
      // Primero obtenemos los ingresos actuales
      const currentIncomes = IncomeService.loadIncomesFromLocalStorage()
      // Añadimos el nuevo ingreso
      currentIncomes.push(newIncome)
      // Guardamos la lista actualizada
      IncomeService.saveIncomesToLocalStorage(currentIncomes)

      return newIncome
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

      // Asegurarse de que el ID sea numérico (eliminar cualquier prefijo "local-")
      const numericId = String(id).replace("local-", "")

      console.log(`Actualizando ingreso con ID: ${numericId}`, incomeData)

      const response = await fetch(`${API_BASE_URL}/incomes/${numericId}`, {
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
        console.error(`Error al actualizar ingreso: ${response.status} - ${response.statusText}`)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const updatedIncome = await response.json()

      // Actualizar el localStorage después de actualizar exitosamente en la API
      const currentIncomes = IncomeService.loadIncomesFromLocalStorage()
      const updatedIncomes = currentIncomes.map((income) => (income.id === updatedIncome.id ? updatedIncome : income))
      IncomeService.saveIncomesToLocalStorage(updatedIncomes)

      return updatedIncome
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

      // Asegurarse de que el ID sea numérico (eliminar cualquier prefijo "local-")
      const numericId = String(id).replace("local-", "")

      console.log(`Eliminando ingreso con ID: ${numericId}`)

      const response = await fetch(`${API_BASE_URL}/incomes/${numericId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error(`Error al eliminar ingreso: ${response.status} - ${response.statusText}`)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      // Si la eliminación fue exitosa, actualizar también el localStorage
      if (data.success) {
        const currentIncomes = IncomeService.loadIncomesFromLocalStorage()
        const filteredIncomes = currentIncomes.filter((income) => String(income.id) !== String(numericId))
        IncomeService.saveIncomesToLocalStorage(filteredIncomes)
      }

      return data.success === true
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
      console.log(`Guardados ${incomes.length} ingresos en localStorage`)
    } catch (error) {
      console.error("Error al guardar ingresos en localStorage:", error)
    }
  },

  // Sincroniza los datos locales con el servidor
  syncWithServer: async (): Promise<void> => {
    try {
      console.log("Sincronizando ingresos con el servidor...")

      // Obtener datos frescos del servidor
      const remoteIncomes = await IncomeService.getIncomes()

      // Guardar los datos remotos en localStorage
      IncomeService.saveIncomesToLocalStorage(remoteIncomes)

      console.log("Sincronización completada con éxito")
    } catch (error) {
      console.error("Error al sincronizar con el servidor:", error)
    }
  },

  // Limpia la caché de ingresos
  clearIncomeCache: (): void => {
    localStorage.removeItem("price_extractor_incomes")
    console.log("Caché de ingresos limpiada")
  },
}
