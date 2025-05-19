// services/store-service.ts

// This file provides services related to data storage and retrieval.
// It should not have any direct dependencies on Supabase or any other specific database.
// Instead, it should rely on abstract interfaces or repositories for data access.

// Example:

import type { Store } from "../types"

export const StoreService = {
  // Obtener tiendas
  async getStores(userId: string): Promise<Store[]> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/stores?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Error al obtener tiendas: ${response.statusText}`)
      }

      const data = await response.json()
      return data.stores || []
    } catch (error) {
      console.error("Error en el servicio de tiendas (getStores):", error)
      return []
    }
  },

  // Añadir tienda
  async addStore(store: Omit<Store, "id">): Promise<Store | null> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(store),
      })

      if (!response.ok) {
        throw new Error(`Error al añadir tienda: ${response.statusText}`)
      }

      const data = await response.json()
      return data.store || null
    } catch (error) {
      console.error("Error en el servicio de tiendas (addStore):", error)
      return null
    }
  },

  // Actualizar tienda
  async updateStore(store: Store): Promise<Store | null> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/stores/${store.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(store),
        },
      )

      if (!response.ok) {
        throw new Error(`Error al actualizar tienda: ${response.statusText}`)
      }

      const data = await response.json()
      return data.store || null
    } catch (error) {
      console.error("Error en el servicio de tiendas (updateStore):", error)
      return null
    }
  },

  // Eliminar tienda
  async deleteStore(storeId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/stores/${storeId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Error al eliminar tienda: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Error en el servicio de tiendas (deleteStore):", error)
      return false
    }
  },
}
