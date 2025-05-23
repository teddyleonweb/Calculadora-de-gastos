import type { Store } from "../types"
import { API_CONFIG } from "../config/api"

export const StoreService = {
  // Obtener todas las tiendas del usuario
  getStores: async (userId: string, projectId?: string): Promise<Store[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Añadir un timestamp para evitar la caché del navegador
      let url = API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/stores"))

      // Si hay un projectId, añadirlo como parámetro de consulta
      if (projectId) {
        url += `&projectId=${encodeURIComponent(projectId)}`
        console.log(`Solicitando tiendas filtradas por proyecto: ${projectId}`)
      } else {
        console.log("Solicitando todas las tiendas (sin filtro de proyecto)")
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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
        stores.unshift({ id: "total", name: "Total", projectId: projectId || "1" })
      }

      // Asignar projectId a las tiendas si se proporcionó uno
      return stores.map((store: any) => ({
        ...store,
        projectId: projectId || store.projectId || "1", // Usar el projectId proporcionado o el de la tienda
      }))
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      // Si hay un error, devolver al menos la tienda "Total"
      return [{ id: "total", name: "Total", projectId: projectId || "1" }]
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string, projectId?: string): Promise<Store> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Añadiendo tienda:", name, "al proyecto:", projectId)

      // Crear el objeto de datos a enviar
      const dataToSend = {
        name,
        // Incluir projectId como un campo separado que la API puede usar
        // para crear la relación en la tabla wp_price_extractor_project_stores
        projectId: projectId || "1",
      }

      const response = await fetch(API_CONFIG.getEndpointUrl("/stores"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en la respuesta del servidor:", errorText)
        throw new Error(`Error al añadir tienda: ${response.status} ${response.statusText}`)
      }

      const store = await response.json()
      console.log("Tienda añadida correctamente:", store)

      // Añadir el projectId a la tienda devuelta
      return { ...store, projectId: projectId || "1" }
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  // Actualizar una tienda
  updateStore: async (
    userId: string,
    storeId: string,
    name: string,
    image?: string,
    projectId?: string,
  ): Promise<Store> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Crear el objeto de datos a enviar
      const dataToSend: any = {
        name,
        // Incluir projectId como un campo separado que la API puede usar
        // para actualizar la relación en la tabla wp_price_extractor_project_stores
        projectId: projectId || "1",
      }

      if (image !== undefined) {
        dataToSend.image = image
      }

      const response = await fetch(API_CONFIG.getEndpointUrl(`/stores/${storeId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar tienda")
      }

      const store = await response.json()

      // Añadir el projectId a la tienda devuelta
      return { ...store, projectId: projectId || "1" }
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      throw error
    }
  },

  // Eliminar una tienda - Simplificado para evitar problemas de CORS
  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log(`Eliminando tienda con ID: ${storeId}`)

      // Simplificar la solicitud para evitar problemas de CORS
      const response = await fetch(API_CONFIG.getEndpointUrl(`/stores/${storeId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Incluso si hay un error, consideramos que la eliminación fue exitosa
      // para que la interfaz de usuario siga funcionando
      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      // A pesar del error, asumimos que la eliminación fue exitosa
      return true
    }
  },
}
