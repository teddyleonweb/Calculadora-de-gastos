import type { Store } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const StoreService = {
  // Obtener todas las tiendas del usuario
  getStores: async (userId: string): Promise<Store[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo tiendas desde:", `${API_BASE_URL}/stores`)

      const response = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al obtener tiendas: ${response.status} ${response.statusText}`)
      }

      const stores = await response.json()
      console.log("Tiendas obtenidas:", stores)

      return stores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      throw error
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string, image?: string): Promise<Store> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Añadiendo tienda:", name)

      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, image }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al añadir tienda: ${response.status} ${response.statusText}`)
      }

      const newStore = await response.json()
      console.log("Tienda añadida:", newStore)

      return newStore
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  // Actualizar una tienda
  updateStore: async (userId: string, storeId: string, name: string, image?: string): Promise<Store> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Actualizando tienda:", storeId, name)

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, image }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al actualizar tienda: ${response.status} ${response.statusText}`)
      }

      const updatedStore = await response.json()
      console.log("Tienda actualizada:", updatedStore)

      return updatedStore
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      throw error
    }
  },

  // Eliminar una tienda
  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Eliminando tienda:", storeId)

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al eliminar tienda: ${response.status} ${response.statusText}`)
      }

      console.log("Tienda eliminada correctamente")
      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      throw error
    }
  },
}
