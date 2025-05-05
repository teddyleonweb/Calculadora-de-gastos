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
        throw new Error(`Error al obtener tiendas: ${response.status} ${response.statusText}`)
      }

      const stores = await response.json()
      console.log("Tiendas obtenidas:", stores)

      // Asegurarse de que siempre haya una tienda "Total"
      const totalStore = stores.find((store: Store) => store.name === "Total")

      if (!totalStore && stores.length > 0) {
        return [
          {
            id: "total",
            name: "Total",
            isDefault: true,
          },
          ...stores,
        ]
      } else if (stores.length === 0) {
        return [
          {
            id: "total",
            name: "Total",
            isDefault: true,
          },
        ]
      }

      return stores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)

      // Si hay un error, devolver al menos la tienda Total
      return [
        {
          id: "total",
          name: "Total",
          isDefault: true,
        },
      ]
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string): Promise<Store> => {
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
        body: JSON.stringify({
          name,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al añadir tienda: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const store = await response.json()
      console.log("Tienda añadida:", store)

      return store
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

      console.log("Actualizando tienda:", storeId, name, image ? "con imagen" : "sin imagen")

      const data: any = { name }

      if (image !== undefined) {
        data.image = image
      }

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al actualizar tienda: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const store = await response.json()
      console.log("Tienda actualizada:", store)

      return store
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
        throw new Error(`Error al eliminar tienda: ${response.status} ${response.statusText} - ${errorText}`)
      }

      console.log("Tienda eliminada correctamente")
      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      throw error
    }
  },
}
