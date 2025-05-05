import { AuthService } from "./auth-service"

export class StoreService {
  static async getStores(userId: string): Promise<any[]> {
    try {
      const token = await AuthService.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener tiendas: ${response.status}`)
      }

      const stores = await response.json()
      return stores
    } catch (error) {
      console.error("Error en getStores:", error)
      // Fallback a localStorage si la API falla
      const localStores = localStorage.getItem(`stores_${userId}`)
      return localStores ? JSON.parse(localStores) : []
    }
  }

  static async addStore(userId: string, name: string): Promise<any> {
    try {
      const token = await AuthService.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, userId }),
      })

      if (!response.ok) {
        throw new Error(`Error al añadir tienda: ${response.status}`)
      }

      const newStore = await response.json()

      // Actualizar localStorage como fallback
      const localStores = localStorage.getItem(`stores_${userId}`)
      const stores = localStores ? JSON.parse(localStores) : []
      stores.push(newStore)
      localStorage.setItem(`stores_${userId}`, JSON.stringify(stores))

      return newStore
    } catch (error) {
      console.error("Error en addStore:", error)
      throw error
    }
  }

  static async updateStore(userId: string, storeId: string, name: string, image?: string): Promise<any> {
    try {
      const token = await AuthService.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, image, userId }),
      })

      if (!response.ok) {
        throw new Error(`Error al actualizar tienda: ${response.status}`)
      }

      const updatedStore = await response.json()

      // Actualizar localStorage como fallback
      const localStores = localStorage.getItem(`stores_${userId}`)
      if (localStores) {
        const stores = JSON.parse(localStores)
        const updatedStores = stores.map((store: any) => (store.id === storeId ? { ...store, name, image } : store))
        localStorage.setItem(`stores_${userId}`, JSON.stringify(updatedStores))
      }

      return updatedStore
    } catch (error) {
      console.error("Error en updateStore:", error)
      throw error
    }
  }

  static async deleteStore(userId: string, storeId: string): Promise<void> {
    try {
      const token = await AuthService.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al eliminar tienda: ${response.status}`)
      }

      // Actualizar localStorage como fallback
      const localStores = localStorage.getItem(`stores_${userId}`)
      if (localStores) {
        const stores = JSON.parse(localStores)
        const filteredStores = stores.filter((store: any) => store.id !== storeId)
        localStorage.setItem(`stores_${userId}`, JSON.stringify(filteredStores))
      }
    } catch (error) {
      console.error("Error en deleteStore:", error)
      throw error
    }
  }
}
