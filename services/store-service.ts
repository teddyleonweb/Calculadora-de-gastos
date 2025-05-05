import type { Store } from "@/types"

export const StoreService = {
  async getStores(userId: string): Promise<Store[]> {
    try {
      console.log("StoreService.getStores - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.error("No hay token de autenticación")
        return []
      }

      console.log("Token encontrado:", token.substring(0, 15) + "...")

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Construir la URL completa con el parámetro path
      const fullUrl = `${apiUrl}?path=/stores`
      console.log("URL completa:", fullUrl)

      // Hacer la solicitud directamente sin usar el proxy
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      console.log("Código de estado:", response.status)

      if (!response.ok) {
        console.error("Error en la respuesta:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Texto de error:", errorText)
        return []
      }

      const stores = await response.json()
      console.log("Tiendas recibidas:", stores)

      if (Array.isArray(stores)) {
        return stores.map((store: any) => ({
          id: store.id.toString(),
          name: store.name || "Tienda sin nombre",
          image: store.image || null,
          user_id: userId,
        }))
      }

      console.error("La respuesta no es un array:", stores)
      return []
    } catch (error) {
      console.error("Error en StoreService.getStores:", error)
      return []
    }
  },

  async addStore(userId: string, name: string): Promise<Store> {
    try {
      console.log("StoreService.addStore - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${apiUrl}/stores`,
          method: "POST",
          data: {
            name,
            user_id: userId,
          },
        }),
      })

      const data = await response.json()
      console.log("StoreService.addStore - Respuesta:", data)

      // Crear un ID temporal si no se recibe uno
      const tempId = Math.random().toString(36).substring(2, 15)

      // Devolver un objeto de tienda con los datos disponibles
      return {
        id: data.id?.toString() || tempId,
        name,
        image: null,
        user_id: userId,
      }
    } catch (error) {
      console.error("Error en StoreService.addStore:", error)
      // Crear un ID temporal
      const tempId = Math.random().toString(36).substring(2, 15)
      // Devolver un objeto de tienda con los datos disponibles
      return {
        id: tempId,
        name,
        image: null,
        user_id: userId,
      }
    }
  },

  async updateStore(userId: string, storeId: string, name: string, image?: string): Promise<Store> {
    try {
      console.log("StoreService.updateStore - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${apiUrl}/stores/${storeId}`,
          method: "PUT",
          data: {
            name,
            image,
            user_id: userId,
          },
        }),
      })

      const data = await response.json()
      console.log("StoreService.updateStore - Respuesta:", data)

      // Devolver un objeto de tienda con los datos actualizados
      return {
        id: storeId,
        name,
        image: image || null,
        user_id: userId,
      }
    } catch (error) {
      console.error("Error en StoreService.updateStore:", error)
      // Devolver un objeto de tienda con los datos actualizados
      return {
        id: storeId,
        name,
        image: image || null,
        user_id: userId,
      }
    }
  },

  async deleteStore(userId: string, storeId: string): Promise<void> {
    try {
      console.log("StoreService.deleteStore - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${apiUrl}/stores/${storeId}`,
          method: "DELETE",
        }),
      })

      const data = await response.json()
      console.log("StoreService.deleteStore - Respuesta:", data)
    } catch (error) {
      console.error("Error en StoreService.deleteStore:", error)
    }
  },
}
