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

      // Añadir un parámetro de timestamp para evitar la caché
      const timestamp = new Date().getTime()
      const response = await fetch(`${API_BASE_URL}/stores?_t=${timestamp}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          // Añadir cabeceras para evitar caché
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`)
        throw new Error(`Error al obtener tiendas: ${response.status} ${response.statusText}`)
      }

      const stores = await response.json()
      console.log(`Tiendas obtenidas: ${stores.length}`)

      // Asegurarse de que siempre exista la tienda "Total"
      const hasTotal = stores.some((store: Store) => store.name === "Total")
      if (!hasTotal) {
        stores.unshift({ id: "total", name: "Total" })
      }

      return stores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      // Si hay un error, devolver al menos la tienda "Total"
      return [{ id: "total", name: "Total" }]
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

  // Eliminar una tienda - Corregido para usar la URL correcta
  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log(`Eliminando tienda con ID: ${storeId}`)

      // Añadir un parámetro de timestamp para evitar la caché
      const timestamp = new Date().getTime()
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}?_t=${timestamp}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          // Añadir cabeceras para evitar caché
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      // Verificar si la respuesta es 404 (no encontrado)
      if (response.status === 404) {
        console.warn(`La tienda con ID ${storeId} no fue encontrada en el servidor`)
        return true
      }

      // Si la respuesta no es ok pero no es 404, registrar el error
      if (!response.ok) {
        console.warn(`Respuesta no OK al eliminar tienda: ${response.status} ${response.statusText}`)
        try {
          const errorBody = await response.text()
          console.error(`Error del servidor: ${errorBody}`)
        } catch (readError) {
          console.error("No se pudo leer el cuerpo de la respuesta de error")
        }
        return false
      }

      console.log(`Tienda con ID ${storeId} eliminada correctamente`)
      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      return false
    }
  },
}
