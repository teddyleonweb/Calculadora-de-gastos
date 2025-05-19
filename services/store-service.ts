import type { Store } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const StoreService = {
  // Obtener todas las tiendas
  getStores: async (): Promise<Store[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/stores`, {
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
      console.error("Error al obtener tiendas:", error)
      throw error
    }
  },

  // Añadir una nueva tienda
  addStore: async (store: Store): Promise<Store> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: store.name,
          image: store.image || null,
          isDefault: store.isDefault || false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  // Actualizar una tienda existente
  updateStore: async (store: Store): Promise<Store> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/stores/${store.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: store.name,
          image: store.image,
          isDefault: store.isDefault || false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      throw error
    }
  },

  // Eliminar una tienda
  deleteStore: async (id: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/stores/${id}`, {
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
      console.error("Error al eliminar tienda:", error)
      throw error
    }
  },
}
