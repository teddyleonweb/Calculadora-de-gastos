import type { Income } from "@/types"

export class IncomeService {
  // URL de la API (misma que usa ProductService)
  private static API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "/api.php"

  // Clave para localStorage
  private static STORAGE_KEY = "price_extractor_incomes"

  // Variable para caché
  private static cachedIncomes: Income[] | null = null

  /**
   * Obtiene todos los ingresos del usuario
   */
  static async getIncomes(): Promise<Income[]> {
    try {
      // Si hay caché, devolverla
      if (this.cachedIncomes) {
        return this.cachedIncomes
      }

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.log("No hay token de autenticación, cargando desde localStorage")
        // Si no hay token, cargar desde localStorage
        const localIncomes = this.loadIncomesFromLocalStorage()
        this.cachedIncomes = localIncomes
        return localIncomes
      }

      // Intentar obtener desde la API
      console.log("Obteniendo ingresos desde la API")
      const response = await fetch(`${this.API_URL}/incomes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      // Guardar en caché y localStorage como respaldo
      this.cachedIncomes = data
      this.saveIncomesToLocalStorage(data)

      return data
    } catch (error) {
      console.error("Error al obtener ingresos:", error)

      // En caso de error, intentar cargar desde localStorage
      const localIncomes = this.loadIncomesFromLocalStorage()
      this.cachedIncomes = localIncomes
      return localIncomes
    }
  }

  /**
   * Añade un nuevo ingreso
   */
  static async addIncome(income: Omit<Income, "id" | "userId" | "createdAt">): Promise<Income> {
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.log("No hay token de autenticación, guardando solo localmente")
        // Si no hay token, guardar solo localmente
        const newIncome: Income = {
          id: `local-${Date.now()}`,
          userId: "current-user",
          ...income,
          createdAt: new Date().toISOString(),
        }

        const existingIncomes = this.loadIncomesFromLocalStorage()
        this.saveIncomesToLocalStorage([...existingIncomes, newIncome])

        // Actualizar caché
        this.cachedIncomes = [...existingIncomes, newIncome]

        return newIncome
      }

      // Intentar guardar en la API
      console.log("Enviando ingreso a la API:", income)
      const response = await fetch(`${this.API_URL}/incomes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(income),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log("Ingreso guardado en la API:", data)

      // Actualizar caché
      const existingIncomes = this.loadIncomesFromLocalStorage()
      this.cachedIncomes = [...existingIncomes, data]
      this.saveIncomesToLocalStorage(this.cachedIncomes)

      return data
    } catch (error) {
      console.error("Error al añadir ingreso en la API, guardando localmente:", error)

      // En caso de error, guardar localmente
      const newIncome: Income = {
        id: `local-${Date.now()}`,
        userId: "current-user",
        ...income,
        createdAt: new Date().toISOString(),
      }

      const existingIncomes = this.loadIncomesFromLocalStorage()
      this.saveIncomesToLocalStorage([...existingIncomes, newIncome])

      // Actualizar caché
      this.cachedIncomes = [...existingIncomes, newIncome]

      return newIncome
    }
  }

  /**
   * Actualiza un ingreso existente
   */
  static async updateIncome(id: string, income: Partial<Omit<Income, "id" | "userId" | "createdAt">>): Promise<Income> {
    try {
      // Si es un ID local, actualizar solo localmente
      if (id.startsWith("local-")) {
        const existingIncomes = this.loadIncomesFromLocalStorage()
        const updatedIncomes = existingIncomes.map((item) => {
          if (item.id === id) {
            return { ...item, ...income }
          }
          return item
        })

        this.saveIncomesToLocalStorage(updatedIncomes)
        this.cachedIncomes = updatedIncomes

        const updatedIncome = updatedIncomes.find((item) => item.id === id)
        if (!updatedIncome) {
          throw new Error("No se encontró el ingreso a actualizar")
        }

        return updatedIncome
      }

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // Intentar actualizar en la API
      const response = await fetch(`${this.API_URL}/incomes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(income),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()

      // Actualizar caché y localStorage
      const existingIncomes = this.loadIncomesFromLocalStorage()
      const updatedIncomes = existingIncomes.map((item) => {
        if (item.id === id) {
          return data
        }
        return item
      })

      this.saveIncomesToLocalStorage(updatedIncomes)
      this.cachedIncomes = updatedIncomes

      return data
    } catch (error) {
      console.error("Error al actualizar ingreso:", error)

      // En caso de error, intentar actualizar localmente
      const existingIncomes = this.loadIncomesFromLocalStorage()
      const incomeToUpdate = existingIncomes.find((item) => item.id === id)

      if (!incomeToUpdate) {
        throw new Error("No se encontró el ingreso a actualizar")
      }

      const updatedIncome = { ...incomeToUpdate, ...income }
      const updatedIncomes = existingIncomes.map((item) => {
        if (item.id === id) {
          return updatedIncome
        }
        return item
      })

      this.saveIncomesToLocalStorage(updatedIncomes)
      this.cachedIncomes = updatedIncomes

      return updatedIncome
    }
  }

  /**
   * Elimina un ingreso
   */
  static async deleteIncome(id: string): Promise<boolean> {
    try {
      // Si es un ID local, eliminar solo localmente
      if (id.startsWith("local-")) {
        const existingIncomes = this.loadIncomesFromLocalStorage()
        const filteredIncomes = existingIncomes.filter((item) => item.id !== id)

        this.saveIncomesToLocalStorage(filteredIncomes)
        this.cachedIncomes = filteredIncomes

        return true
      }

      // Obtener token de autenticación
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // Intentar eliminar en la API
      const response = await fetch(`${this.API_URL}/incomes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      // Actualizar caché y localStorage
      const existingIncomes = this.loadIncomesFromLocalStorage()
      const filteredIncomes = existingIncomes.filter((item) => item.id !== id)

      this.saveIncomesToLocalStorage(filteredIncomes)
      this.cachedIncomes = filteredIncomes

      return true
    } catch (error) {
      console.error("Error al eliminar ingreso:", error)

      // En caso de error, intentar eliminar localmente
      const existingIncomes = this.loadIncomesFromLocalStorage()
      const filteredIncomes = existingIncomes.filter((item) => item.id !== id)

      this.saveIncomesToLocalStorage(filteredIncomes)
      this.cachedIncomes = filteredIncomes

      return true
    }
  }

  /**
   * Carga ingresos desde localStorage
   */
  static loadIncomesFromLocalStorage(): Income[] {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY)
      return storedData ? JSON.parse(storedData) : []
    } catch (error) {
      console.error("Error al cargar ingresos desde localStorage:", error)
      return []
    }
  }

  /**
   * Guarda ingresos en localStorage
   */
  static saveIncomesToLocalStorage(incomes: Income[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(incomes))
    } catch (error) {
      console.error("Error al guardar ingresos en localStorage:", error)
    }
  }

  /**
   * Limpia la caché de ingresos
   */
  static clearIncomeCache(): void {
    this.cachedIncomes = null
  }

  /**
   * Agrupa ingresos por categoría
   */
  static groupByCategory(incomes: Income[]): Record<string, Income[]> {
    return incomes.reduce(
      (acc, income) => {
        const category = income.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(income)
        return acc
      },
      {} as Record<string, Income[]>,
    )
  }

  /**
   * Calcula el total de ingresos
   */
  static calculateTotal(incomes: Income[]): number {
    return incomes.reduce((total, income) => total + income.amount, 0)
  }
}
