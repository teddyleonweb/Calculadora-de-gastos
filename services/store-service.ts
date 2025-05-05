import type { Store } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

// Función para obtener el token de autenticación
const getAuthToken = (): string | null => {
  try {
    return window.localStorage.getItem("auth_token")
  } catch (error) {
    console.error("Error al obtener token:", error)
    return null
  }
}

// Función privada para guardar tiendas en localStorage
const _saveStoresToLocalStorage = (stores: Store[], userId: string) => {
  try {
    const key = `stores_${userId}`
    window.localStorage.setItem(key, JSON.stringify(stores))
    console.log(`Tiendas guardadas en localStorage (${key}):`, stores.length)
  } catch (error) {
    console.error("Error al guardar tiendas en localStorage:", error)
  }
}

// Función privada para cargar tiendas desde localStorage
const _loadStoresFromLocalStorage = (userId: string): Store[] => {
  try {
    const key = `stores_${userId}`
    const storedStores = window.localStorage.getItem(key)
    if (storedStores) {
      const stores = JSON.parse(storedStores)
      console.log(`Tiendas cargadas desde localStorage (${key}):`, stores.length)
      return stores
    }
  } catch (error) {
    console.error("Error al cargar tiendas desde localStorage:", error)
  }
  return []
}

export const StoreService = {
  // Obtener todas las tiendas del usuario
  getStores: async (userId: string): Promise<Store[]> => {
    try {
      const token = getAuthToken()

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo tiendas desde:", `${API_BASE_URL}/stores`)

      // Primero intentar cargar desde localStorage para respuesta inmediata
      const cachedStores = _loadStoresFromLocalStorage(userId)

      // Asegurarse de que siempre exista la tienda "Total"
      let hasTotal = false
      for (const store of cachedStores) {
        if (store.name === "Total") {
          hasTotal = true
          break
        }
      }

      if (!hasTotal && cachedStores.length > 0) {
        cachedStores.unshift({ id: "total", name: "Total" })
      } else if (cachedStores.length === 0) {
        cachedStores.push({ id: "total", name: "Total" })
      }

      // Intentar obtener tiendas del servidor
      const response = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // Incluir cookies en la solicitud
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)

        // Si hay error pero tenemos tiendas en caché, usarlas
        if (cachedStores.length > 0) {
          console.log("Usando tiendas en caché debido a error en la API")
          return cachedStores
        }

        throw new Error(`Error al obtener tiendas: ${response.status} ${response.statusText}`)
      }

      const serverStores = await response.json()
      console.log("Tiendas obtenidas del servidor:", serverStores.length)

      // Asegurarse de que siempre exista la tienda "Total"
      hasTotal = false
      for (const store of serverStores) {
        if (store.name === "Total") {
          hasTotal = true
          break
        }
      }

      if (!hasTotal) {
        serverStores.unshift({ id: "total", name: "Total" })
      }

      // Actualizar localStorage con los datos más recientes
      _saveStoresToLocalStorage(serverStores, userId)

      return serverStores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)

      // Si hay error pero tenemos tiendas en caché, usarlas
      const cachedStores = _loadStoresFromLocalStorage(userId)
      if (cachedStores.length > 0) {
        console.log("Usando tiendas en caché debido a error en la API")
        return cachedStores
      }

      // Si no hay caché, devolver al menos la tienda Total
      return [{ id: "total", name: "Total" }]
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string, image?: string): Promise<Store> => {
    try {
      const token = getAuthToken()

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
        credentials: "include", // Incluir cookies en la solicitud
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al añadir tienda: ${response.status} ${response.statusText}`)
      }

      const newStore = await response.json()
      console.log("Tienda añadida:", newStore)

      // Actualizar localStorage
      const cachedStores = _loadStoresFromLocalStorage(userId)
      cachedStores.push(newStore)
      _saveStoresToLocalStorage(cachedStores, userId)

      return newStore
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  // Actualizar una tienda
  updateStore: async (userId: string, storeId: string, name: string, image?: string): Promise<Store> => {
    try {
      const token = getAuthToken()

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Actualizando tienda:", storeId, name)

      // Actualizar localStorage inmediatamente para respuesta rápida
      const cachedStores = _loadStoresFromLocalStorage(userId)
      const updatedStores = cachedStores.map((store) => (store.id === storeId ? { ...store, name, image } : store))
      _saveStoresToLocalStorage(updatedStores, userId)

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, image }),
        credentials: "include", // Incluir cookies en la solicitud
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
      const token = getAuthToken()

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Eliminando tienda:", storeId)

      // No permitir eliminar la tienda "Total"
      if (storeId === "total") {
        console.error("No se puede eliminar la tienda Total")
        throw new Error("No se puede eliminar la tienda Total")
      }

      // Actualizar localStorage inmediatamente para respuesta rápida
      const cachedStores = _loadStoresFromLocalStorage(userId)
      const filteredStores = cachedStores.filter((store) => store.id !== storeId)
      _saveStoresToLocalStorage(filteredStores, userId)

      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // Incluir cookies en la solicitud
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)

        // Si hay error, restaurar el estado anterior
        _saveStoresToLocalStorage(cachedStores, userId)

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
