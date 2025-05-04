import type { Product, Store, ShoppingList } from "../types"

// Modificar la URL base para incluir la ruta completa
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const ShoppingListService = {
  // Guardar una lista de compras
  saveShoppingList: async (
    userId: string,
    name: string,
    stores: Store[],
    products: Product[],
  ): Promise<ShoppingList> => {
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
        throw new Error("Error al guardar lista de compras")
      }

      const shoppingList = await response.json()

      return shoppingList
    } catch (error) {
      console.error("Error al guardar lista de compras:", error)
      throw error
    }
  },

  // Obtener todas las listas de compras
  getShoppingLists: async (userId: string): Promise<ShoppingList[]> => {
    try {
      console.log("Obteniendo listas de compras para el usuario:", userId)

      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.warn("No hay token de autenticación, usando modo local")
        // Modo local como respaldo
        const shoppingLists = JSON.parse(localStorage.getItem("shoppingLists") || "[]")
        const userLists = shoppingLists.filter((list: any) => list.userId === userId)

        return userLists.map((list: any) => ({
          id: list.id,
          name: list.name,
          date: list.date,
          total: list.total,
          productCount: list.products.length,
          storeCount: new Set(list.products.map((p: any) => p.storeId)).size,
        }))
      }

      const response = await fetch(`${API_BASE_URL}/shopping-lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Respuesta del servidor:", response.status)

      // Si la API falla, usar modo local como respaldo
      if (!response.ok) {
        console.warn("Error en la API de WordPress, usando modo local como respaldo")

        // Modo local como respaldo
        const shoppingLists = JSON.parse(localStorage.getItem("shoppingLists") || "[]")
        const userLists = shoppingLists.filter((list: any) => list.userId === userId)

        return userLists.map((list: any) => ({
          id: list.id,
          name: list.name,
          date: list.date,
          total: list.total,
          productCount: list.products.length,
          storeCount: new Set(list.products.map((p: any) => p.storeId)).size,
        }))
      }

      const lists = await response.json()

      return lists
    } catch (error) {
      console.error("Error al obtener listas de compras:", error)

      // En caso de error, intentar usar modo local
      console.warn("Error en la API, usando modo local como respaldo")
      const shoppingLists = JSON.parse(localStorage.getItem("shoppingLists") || "[]")
      const userLists = shoppingLists.filter((list: any) => list.userId === userId)

      return userLists.map((list: any) => ({
        id: list.id,
        name: list.name,
        date: list.date,
        total: list.total,
        productCount: list.products.length,
        storeCount: new Set(list.products.map((p: any) => p.storeId)).size,
      }))
    }
  },

  // Obtener una lista específica
  getShoppingList: async (userId: string, listId: string): Promise<ShoppingList | null> => {
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
        if (response.status === 404) {
          return null
        }
        throw new Error("Error al obtener lista de compras")
      }

      const shoppingList = await response.json()

      return shoppingList
    } catch (error) {
      console.error("Error al obtener lista de compras:", error)
      throw error
    }
  },

  // Eliminar una lista
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

  // Cargar una lista como la lista actual
  loadShoppingList: async (userId: string, listId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Obtener la lista completa
      const list = await ShoppingListService.getShoppingList(userId, listId)

      if (!list) {
        return false
      }

      // Obtener las tiendas actuales del usuario
      const storesResponse = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!storesResponse.ok) {
        throw new Error("Error al obtener tiendas")
      }

      const currentStores = await storesResponse.json()

      // Mapeo de IDs de tiendas de la lista a tiendas actuales
      const storeIdMap = new Map()

      // Para cada tienda en la lista, buscar o crear la tienda correspondiente
      for (const listStore of list.stores) {
        // Buscar si ya existe una tienda con el mismo nombre
        const existingStore = currentStores.find((s: Store) => s.name === listStore.name)

        if (existingStore) {
          storeIdMap.set(listStore.id, existingStore.id)
        } else {
          // Crear una nueva tienda
          const newStoreResponse = await fetch(`${API_BASE_URL}/stores`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: listStore.name,
            }),
          })

          if (!newStoreResponse.ok) {
            throw new Error("Error al crear tienda")
          }

          const newStore = await newStoreResponse.json()
          storeIdMap.set(listStore.id, newStore.id)
        }
      }

      // Añadir los productos de la lista a la lista actual
      for (const product of list.products) {
        // Obtener el ID de tienda mapeado
        const mappedStoreId = storeIdMap.get(product.storeId) || currentStores[0]?.id

        // Insertar el producto
        await fetch(`${API_BASE_URL}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: product.title,
            price: product.price,
            quantity: product.quantity,
            image: product.image,
            storeId: mappedStoreId,
          }),
        })
      }

      return true
    } catch (error) {
      console.error("Error al cargar lista de compras:", error)
      throw error
    }
  },
}
