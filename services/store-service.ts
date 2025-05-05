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

      const responseText = await response.text()
      console.log("Respuesta de tiendas (texto):", responseText)

      // Manejar respuesta vacía
      if (!responseText.trim()) {
        console.log("Respuesta vacía, devolviendo array vacío")
        return []
      }

      try {
        const stores = JSON.parse(responseText)
        console.log("Tiendas obtenidas:", stores)
        return Array.isArray(stores) ? stores : []
      } catch (parseError) {
        console.error("Error al parsear JSON de tiendas:", parseError)
        return []
      }
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

      const responseText = await response.text()
      console.log("Respuesta de añadir tienda (texto):", responseText)

      try {
        const newStore = JSON.parse(responseText)
        console.log("Tienda añadida:", newStore)
        return newStore
      } catch (parseError) {
        console.error("Error al parsear JSON de la nueva tienda:", parseError)
        // Crear una tienda temporal con ID generado localmente
        return {
          id: `temp-${Date.now()}`,
          name,
          image,
          isDefault: false,
        }
      }
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

      const responseText = await response.text()
      console.log("Respuesta de actualizar tienda (texto):", responseText)

      try {
        const updatedStore = JSON.parse(responseText)
        console.log("Tienda actualizada:", updatedStore)
        return updatedStore
      } catch (parseError) {
        console.error("Error al parsear JSON de la tienda actualizada:", parseError)
        // Devolver un objeto con los datos actualizados
        return {
          id: storeId,
          name,
          image,
          isDefault: false,
        }
      }
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
