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

      // Verificar que la URL sea correcta
      const url = `${API_BASE_URL}/stores`
      console.log("URL completa:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      console.log("Respuesta status:", response.status)
      console.log("Respuesta headers:", Object.fromEntries(response.headers.entries()))

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
        // Intentar parsear como JSON
        const stores = JSON.parse(responseText)
        console.log("Tiendas obtenidas:", stores)

        // Verificar si es un array
        if (Array.isArray(stores)) {
          return stores
        }
        // Verificar si es un objeto con una propiedad que contiene el array
        else if (stores && typeof stores === "object") {
          // Buscar una propiedad que pueda contener un array
          for (const key in stores) {
            if (Array.isArray(stores[key])) {
              return stores[key]
            }
          }
        }

        // Si no se encontró un array, devolver array vacío
        console.warn("La respuesta no contiene un array de tiendas:", stores)
        return []
      } catch (parseError) {
        console.error("Error al parsear JSON de tiendas:", parseError)

        // Intentar extraer JSON válido de la respuesta
        try {
          const jsonMatch = responseText.match(/\{.*\}/s) || responseText.match(/\[.*\]/s)
          if (jsonMatch) {
            const extractedJson = jsonMatch[0]
            console.log("JSON extraído:", extractedJson)
            const stores = JSON.parse(extractedJson)

            if (Array.isArray(stores)) {
              return stores
            }
          }
        } catch (extractError) {
          console.error("Error al extraer JSON:", extractError)
        }

        return []
      }
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

      const response = await fetch(`${API_BASE_URL}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
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

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
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

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
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
      return false
    }
  },
}
