import type { Store } from "../types"

// Modificar la URL base para incluir la ruta completa
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const StoreService = {
  // Obtener todas las tiendas del usuario
  getStores: async (userId: string): Promise<Store[]> => {
    try {
      console.log("Obteniendo tiendas para el usuario:", userId)

      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.warn("No hay token de autenticación, usando modo local")
        // Modo local como respaldo
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const userStores = stores.filter((store: any) => store.userId === userId)

        // Si no hay tiendas, crear la tienda por defecto
        if (userStores.length === 0) {
          const defaultStore = {
            id: "default",
            name: "Total",
            userId: userId,
            isDefault: true,
          }
          stores.push(defaultStore)
          localStorage.setItem("stores", JSON.stringify(stores))
          userStores.push(defaultStore)
        }

        return userStores.map((store: any) => ({
          id: store.id,
          name: store.name,
          isDefault: store.isDefault,
          image: store.image || undefined,
        }))
      }

      const response = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Respuesta del servidor:", response.status)

      // Si la API falla, usar modo local como respaldo
      if (!response.ok) {
        console.warn("Error en la API de WordPress, usando modo local como respaldo")

        // Modo local como respaldo
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const userStores = stores.filter((store: any) => store.userId === userId)

        // Si no hay tiendas, crear la tienda por defecto
        if (userStores.length === 0) {
          const defaultStore = {
            id: "default",
            name: "Total",
            userId: userId,
            isDefault: true,
          }
          stores.push(defaultStore)
          localStorage.setItem("stores", JSON.stringify(stores))
          userStores.push(defaultStore)
        }

        return userStores.map((store: any) => ({
          id: store.id,
          name: store.name,
          isDefault: store.isDefault,
          image: store.image || undefined,
        }))
      }

      const stores = await response.json()

      return stores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)

      // En caso de error, intentar usar modo local
      console.warn("Error en la API, usando modo local como respaldo")
      const stores = JSON.parse(localStorage.getItem("stores") || "[]")
      const userStores = stores.filter((store: any) => store.userId === userId)

      return userStores.map((store: any) => ({
        id: store.id,
        name: store.name,
        isDefault: store.isDefault,
        image: store.image || undefined,
      }))
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string): Promise<Store> => {
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
          name,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al añadir tienda")
      }

      const store = await response.json()

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
        throw new Error("Error al actualizar tienda")
      }

      const store = await response.json()

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

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar tienda")
      }

      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      throw error
    }
  },
}
