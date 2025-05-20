import type { Income } from "../types"
import { format } from "date-fns"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const IncomeService = {
  // Obtener todos los ingresos
  getIncomes: async (): Promise<Income[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.log("No hay token, devolviendo solo ingresos locales")
        return IncomeService.loadIncomesFromLocalStorage()
      }

      // Añadir un parámetro de tiempo para evitar la caché
      const timestamp = new Date().getTime()

      // Intentamos obtener los ingresos del servidor
      console.log("Obteniendo ingresos del servidor...")
      const response = await fetch(`${API_BASE_URL}/incomes?_t=${timestamp}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        console.warn(`Error HTTP: ${response.status}, devolviendo ingresos locales`)
        return IncomeService.loadIncomesFromLocalStorage()
      }

      const serverIncomes = await response.json()
      console.log("Ingresos obtenidos del servidor:", serverIncomes.length)

      // Guardar los ingresos del servidor en localStorage como respaldo
      IncomeService.saveIncomesToLocalStorage(serverIncomes)

      return serverIncomes
    } catch (error) {
      console.error("Error al obtener ingresos:", error)
      // En caso de error, devolver los ingresos locales
      return IncomeService.loadIncomesFromLocalStorage()
    }
  },

  // Añadir un nuevo ingreso
  addIncome: async (incomeData: Partial<Income>): Promise<Income> => {
    try {
      const token = localStorage.getItem("auth_token")

      // Asegurarse de que la categoría no sea vacía
      const category = incomeData.category || "General"

      if (!token) {
        // Si no hay token, guardar localmente
        console.log("No hay token, guardando ingreso localmente")
        const localIncome: Income = {
          id: `local-${Date.now()}`,
          userId: "current-user",
          description: incomeData.description || "",
          amount: Number(incomeData.amount) || 0,
          category: category,
          date: incomeData.date || format(new Date(), "yyyy-MM-dd"),
          isFixed: incomeData.isFixed || false,
          frequency: incomeData.frequency || null,
          notes: incomeData.notes || null,
          createdAt: new Date().toISOString(),
        }

        // Guardar en localStorage
        const existingIncomes = IncomeService.loadIncomesFromLocalStorage()
        IncomeService.saveIncomesToLocalStorage([...existingIncomes, localIncome])

        return localIncome
      }

      // Intentar guardar en el servidor
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

      const serverIncome = await response.json()

      // Guardar también en localStorage para tener una copia actualizada
      const existingIncomes = IncomeService.loadIncomesFromLocalStorage()
      IncomeService.saveIncomesToLocalStorage([...existingIncomes, serverIncome])

      return serverIncome
    } catch (error) {
      console.error("Error al añadir ingreso:", error)

      // En caso de error, guardar localmente
      const localIncome: Income = {
        id: `local-${Date.now()}`,
        userId: "current-user",
        description: incomeData.description || "",
        amount: Number(incomeData.amount) || 0,
        category: incomeData.category || "General",
        date: incomeData.date || format(new Date(), "yyyy-MM-dd"),
        isFixed: incomeData.isFixed || false,
        frequency: incomeData.frequency || null,
        notes: incomeData.notes || null,
        createdAt: new Date().toISOString(),
      }

      // Guardar en localStorage
      const existingIncomes = IncomeService.loadIncomesFromLocalStorage()
      IncomeService.saveIncomesToLocalStorage([...existingIncomes, localIncome])

      return localIncome
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
    } catch (error) {
      console.error("Error al guardar ingresos en localStorage:", error)
    }
  },

  // Limpia la caché de ingresos
  clearIncomeCache: (): void => {
    console.log("Limpiando caché de ingresos")
    // Limpiar localStorage para forzar una recarga completa
    localStorage.removeItem("price_extractor_incomes")
  },
}
