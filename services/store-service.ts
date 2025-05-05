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

      // Usar el proxy para evitar problemas de CORS
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}/stores`)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Respuesta status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al obtener tiendas: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log("Respuesta de tiendas:", responseData)

      // Manejar respuesta vacía o no válida
      if (!responseData) {
        console.log("Respuesta vacía, devolviendo array vacío")
        return []
      }

      // Verificar si es un array
      if (Array.isArray(responseData)) {
        return responseData
      }
      // Verificar si es un objeto con una propiedad que contiene el array
      else if (responseData && typeof responseData === "object") {
        // Buscar una propiedad que pueda contener un array
        for (const key in responseData) {
          if (Array.isArray(responseData[key])) {
            return responseData[key]
          }
        }
      }

      // Si hay texto en la respuesta pero no es un array ni un objeto con array
      if (responseData.text) {
        console.warn("La respuesta contiene texto pero no JSON válido:", responseData.text)
      }

      // Si no se encontró un array, devolver array vacío
      console.warn("La respuesta no contiene un array de tiendas:", responseData)
      return []
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      return [] // Devolver array vacío en caso de error
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

      // Usar el proxy-post para métodos POST
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}/stores`,
          method: "POST",
          data: { name, image },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al añadir tienda: ${response.status} ${response.statusText}`)
      }

      const newStore = await response.json()
      console.log("Tienda añadida:", newStore)
      return newStore
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      // Crear una tienda temporal con ID generado localmente
      return {
        id: `temp-${Date.now()}`,
        name,
        image,
        isDefault: false,
      }
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

      // Usar el proxy-post para métodos PUT
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}/stores/${storeId}`,
          method: "PUT",
          data: { name, image },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al actualizar tienda: ${response.status} ${response.statusText}`)
      }

      const updatedStore = await response.json()
      console.log("Tienda actualizada:", updatedStore)
      return updatedStore
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      // Devolver un objeto con los datos actualizados
      return {
        id: storeId,
        name,
        image,
        isDefault: false,
      }
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

      // Usar el proxy-post para métodos DELETE
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}/stores/${storeId}`,
          method: "DELETE",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al eliminar tienda: ${response.status} ${response.statusText}`)
      }

      console.log("Tienda eliminada correctamente")
      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      return false
    }
  },
}
