import type { ShoppingList } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const ShoppingListService = {
  // Obtener todas las listas de compras del usuario
  getShoppingLists: async (userId: string): Promise<ShoppingList[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/shopping-lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener listas de compras")
      }

      const shoppingLists = await response.json()

      return shoppingLists
    } catch (error) {
      console.error("Error al obtener listas de compras:", error)
      throw error
    }
  },

  // Obtener una lista de compras específica
  getShoppingList: async (userId: string, listId: string): Promise<ShoppingList> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/shopping-lists/${listId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener lista de compras")
      }

      const shoppingList = await response.json()

      return shoppingList
    } catch (error) {
      console.error("Error al obtener lista de compras:", error)
      throw error
    }
  },

  // Crear una nueva lista de compras
  createShoppingList: async (userId: string, name: string, stores: any[], products: any[]): Promise<ShoppingList> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/shopping-lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          stores,
          products,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear lista de compras")
      }

      const newShoppingList = await response.json()

      return newShoppingList
    } catch (error) {
      console.error("Error al crear lista de compras:", error)
      throw error
    }
  },

  // Eliminar una lista de compras
  deleteShoppingList: async (userId: string, listId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/shopping-lists/${listId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar lista de compras")
      }

      return true
    } catch (error) {
      console.error("Error al eliminar lista de compras:", error)
      throw error
    }
  },
}
