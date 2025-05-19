// Servicio para manejar los ingresos
import type { Income } from "../types"

export class IncomeService {
  // URL de la API de WordPress
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
        return this.loadIncomesFromLocalStorage() // Usar datos locales si no hay token
      }

      try {
        console.log("Obteniendo ingresos de la API...")
        const response = await fetch(`${this.API_URL}/incomes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Respuesta de la API:", response.status, response.statusText)

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          console.error("Error en la respuesta de la API:", response.status, response.statusText)
          return this.loadIncomesFromLocalStorage() // Usar datos locales si la API falla
        }

        // Obtener el texto de la respuesta
        const text = await response.text()
        console.log("Texto de respuesta:", text.substring(0, 100) + (text.length > 100 ? "..." : ""))

        if (!text || text.trim() === "") {
          console.log("La respuesta está vacía, usando datos locales")
          return this.loadIncomesFromLocalStorage()
        }

        // Intentar analizar la respuesta como JSON
        try {
          const incomes = JSON.parse(text)
          console.log("Ingresos obtenidos de la API:", incomes.length)

          // Guardar en localStorage para tener un respaldo
          this.saveIncomesToLocalStorage(incomes)
          return incomes
        } catch (e) {
          console.error("Error al analizar la respuesta JSON:", e)
          return this.loadIncomesFromLocalStorage()
        }
      } catch (error) {
        console.error("Error al obtener ingresos de la API:", error)
        return this.loadIncomesFromLocalStorage()
      }
    } catch (error) {
      console.error("Error general al obtener ingresos:", error)
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

      // Crear un objeto de ingreso completo con ID temporal
      const newIncome: Income = {
        id: `local-${Date.now()}`,
        userId: "current-user",
        description: income.description,
        amount: income.amount,
        category: income.category,
        date: income.date,
        isFixed: income.isFixed,
        frequency: income.frequency,
        notes: income.notes,
        createdAt: new Date().toISOString(),
      }

      console.log("Intentando guardar ingreso en la API:", income)

      try {
        // Intentar guardar en la API
        const response = await fetch(`${this.API_URL}/incomes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(income),
        })

        console.log("Respuesta de la API al crear ingreso:", response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error al crear ingreso en la API:", errorText)
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const text = await response.text()
        console.log("Respuesta al crear ingreso:", text.substring(0, 100))

        if (!text || text.trim() === "") {
          throw new Error("La respuesta está vacía")
        }

        const apiIncome = JSON.parse(text)
        console.log("Ingreso creado en la API:", apiIncome)

        // Actualizar localStorage con el nuevo ingreso de la API
        const existingIncomes = this.loadIncomesFromLocalStorage()
        this.saveIncomesToLocalStorage([...existingIncomes, apiIncome])

        return apiIncome
      } catch (error) {
        console.error("Error al añadir ingreso en la API, guardando localmente:", error)

        // Guardar localmente si falla la API
        const existingIncomes = this.loadIncomesFromLocalStorage()
        this.saveIncomesToLocalStorage([...existingIncomes, newIncome])

        return newIncome
      }
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

      // Obtener ingresos actuales de localStorage
      const existingIncomes = this.loadIncomesFromLocalStorage()
      const incomeToUpdate = existingIncomes.find((income) => income.id === incomeId)

      if (!incomeToUpdate) {
        throw new Error("Ingreso no encontrado")
      }

      // Actualizar localmente
      const updatedIncome = { ...incomeToUpdate, ...updatedData }
      const updatedIncomes = existingIncomes.map((income) => (income.id === incomeId ? updatedIncome : income))

      // Guardar en localStorage
      this.saveIncomesToLocalStorage(updatedIncomes)

      // Si el ID comienza con "local-", no intentar actualizar en la API
      if (incomeId.startsWith("local-")) {
        console.log("Actualizando ingreso local:", incomeId)
        return updatedIncome
      }

      try {
        console.log("Intentando actualizar ingreso en la API:", incomeId, updatedData)

        // Intentar actualizar en la API
        const response = await fetch(`${this.API_URL}/incomes/${incomeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        })

        console.log("Respuesta de la API al actualizar ingreso:", response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error al actualizar ingreso en la API:", errorText)
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const text = await response.text()
        console.log("Respuesta al actualizar ingreso:", text.substring(0, 100))

        if (!text || text.trim() === "") {
          throw new Error("La respuesta está vacía")
        }

        const apiUpdatedIncome = JSON.parse(text)
        console.log("Ingreso actualizado en la API:", apiUpdatedIncome)

        return apiUpdatedIncome
      } catch (error) {
        console.error("Error al actualizar ingreso en la API, pero se actualizó localmente:", error)
        return updatedIncome
      }
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

      // Eliminar de localStorage
      const existingIncomes = this.loadIncomesFromLocalStorage()
      const updatedIncomes = existingIncomes.filter((income) => income.id !== incomeId)
      this.saveIncomesToLocalStorage(updatedIncomes)

      // Si el ID comienza con "local-", no intentar eliminar en la API
      if (incomeId.startsWith("local-")) {
        console.log("Eliminando ingreso local:", incomeId)
        return true
      }

      try {
        console.log("Intentando eliminar ingreso en la API:", incomeId)

        // Intentar eliminar de la API
        const response = await fetch(`${this.API_URL}/incomes/${incomeId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        console.log("Respuesta de la API al eliminar ingreso:", response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error al eliminar ingreso en la API:", errorText)
          throw new Error(`Error HTTP: ${response.status}`)
        }

        return true
      } catch (error) {
        console.error("Error al eliminar ingreso de la API, pero se eliminó localmente:", error)
        return true // Devolver true porque se eliminó localmente
      }
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

  // Guardar ingresos en localStorage
  static saveIncomesToLocalStorage(incomes: Income[]): void {
    try {
      localStorage.setItem("cached_incomes", JSON.stringify(incomes))
      localStorage.setItem("incomes_cache_time", new Date().toISOString())
      console.log("Ingresos guardados en localStorage:", incomes.length)
    } catch (error) {
      console.error("Error al guardar ingresos en localStorage:", error)
    }
  }

  // Cargar ingresos desde localStorage
  static loadIncomesFromLocalStorage(): Income[] {
    try {
      const cachedIncomes = localStorage.getItem("cached_incomes")
      if (cachedIncomes) {
        const incomes = JSON.parse(cachedIncomes)
        console.log("Ingresos cargados desde localStorage:", incomes.length)
        return incomes
      }
    } catch (error) {
      console.error("Error al cargar ingresos desde localStorage:", error)
    }
    return []
  }

  // Limpiar la caché de ingresos
  static clearIncomeCache(): void {
    try {
      localStorage.removeItem("cached_incomes")
      localStorage.removeItem("incomes_cache_time")
      console.log("Caché de ingresos limpiada")
    } catch (error) {
      console.error("Error al limpiar caché de ingresos:", error)
    }
  }
}
