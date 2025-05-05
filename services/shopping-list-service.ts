import type { ShoppingList } from "../types"
import { AuthService } from "./auth-service"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const ShoppingListService = {
  // Obtener todas las listas de compra del usuario
  getShoppingLists: async (userId: string): Promise<ShoppingList[]> => {
    try {
      const token = await AuthService.getToken()

      const response = await fetch(`${API_BASE_URL}/shopping-lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener listas de compra: ${response.status}`)
      }

      const shoppingLists = await response.json()
      return shoppingLists
    } catch (error) {
      console.error("Error en getShoppingLists:", error)
      // Fallback a localStorage si la API falla
      const localLists = localStorage.getItem(`shopping_lists_${userId}`)
      return localLists ? JSON.parse(localLists) : []
    }
  },

  // Obtener una lista de compra específica
  getShoppingList: async (userId: string, listId: string): Promise<ShoppingList> => {
    try {
      const token = await AuthService.getToken()

      const response = await fetch(`${API_BASE_URL}/shopping-lists/${listId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener lista de compra: ${response.status}`)
      }

      const shoppingList = await response.json()
      return shoppingList
    } catch (error) {
      console.error("Error en getShoppingList:", error)
      throw error
    }
  },

  // Crear una nueva lista de compra
  createShoppingList: async (userId: string, name: string): Promise<ShoppingList> => {
    try {
      const token = await AuthService.getToken()

      const response = await fetch(`${API_BASE_URL}/shopping-lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, userId }),
      })

      if (!response.ok) {
        throw new Error(`Error al crear lista de compra: ${response.status}`)
      }

      const newList = await response.json()

      // Actualizar localStorage como fallback
      const localLists = localStorage.getItem(`shopping_lists_${userId}`)
      const lists = localLists ? JSON.parse(localLists) : []
      lists.push(newList)
      localStorage.setItem(`shopping_lists_${userId}`, JSON.stringify(lists))

      return newList
    } catch (error) {
      console.error("Error en createShoppingList:", error)
      throw error
    }
  },

  // Actualizar una lista de compra
  updateShoppingList: async (userId: string, listId: string, data: Partial<ShoppingList>): Promise<ShoppingList> => {
    try {
      const token = await AuthService.getToken()

      const response = await fetch(`${API_BASE_URL}/shopping-lists/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, userId }),
      })

      if (!response.ok) {
        throw new Error(`Error al actualizar lista de compra: ${response.status}`)
      }

      const updatedList = await response.json()

      // Actualizar localStorage como fallback
      const localLists = localStorage.getItem(`shopping_lists_${userId}`)
      if (localLists) {
        const lists = JSON.parse(localLists)
        const updatedLists = lists.map((list: ShoppingList) => (list.id === listId ? updatedList : list))
        localStorage.setItem(`shopping_lists_${userId}`, JSON.stringify(updatedLists))
      }

      return updatedList
    } catch (error) {
      console.error("Error en updateShoppingList:", error)
      throw error
    }
  },

  // Eliminar una lista de compra
  deleteShoppingList: async (userId: string, listId: string): Promise<void> => {
    try {
      const token = await AuthService.getToken()

      const response = await fetch(`${API_BASE_URL}/shopping-lists/${listId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al eliminar lista de compra: ${response.status}`)
      }

      // Actualizar localStorage como fallback
      const localLists = localStorage.getItem(`shopping_lists_${userId}`)
      if (localLists) {
        const lists = JSON.parse(localLists)
        const filteredLists = lists.filter((list: ShoppingList) => list.id !== listId)
        localStorage.setItem(`shopping_lists_${userId}`, JSON.stringify(filteredLists))
      }
    } catch (error) {
      console.error("Error en deleteShoppingList:", error)
      throw error
    }
  },
}
