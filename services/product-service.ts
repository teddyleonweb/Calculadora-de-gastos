import { API_URL } from "@/config/api"
import type { Product } from "@/types"

export const ProductService = {
  // Obtener todos los productos de un usuario, opcionalmente filtrados por tienda y proyecto
  getProducts: async (userId: string, projectId?: string, storeId?: string): Promise<Product[]> => {
    try {
      let url = `${API_URL}?route=products&user_id=${userId}`
      if (projectId) {
        url += `&project_id=${projectId}`
      }
      if (storeId) {
        url += `&store_id=${storeId}`
      }
      console.log("Fetching products from:", url)
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al obtener productos")
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error("Error in getProducts:", error)
      throw error
    }
  },

  // Añadir un nuevo producto
  addProduct: async (userId: string, productData: Omit<Product, "id" | "isEditing">): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}?route=products&action=add_product`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, ...productData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al añadir producto")
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error("Error in addProduct:", error)
      throw error
    }
  },

  // Actualizar un producto existente
  updateProduct: async (
    userId: string,
    productId: string,
    productData: Partial<Omit<Product, "id" | "isEditing">>,
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}?route=products&action=update_product`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, productId, ...productData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar producto")
      }

      return true
    } catch (error) {
      console.error("Error in updateProduct:", error)
      throw error
    }
  },

  // Eliminar un producto
  deleteProduct: async (userId: string, productId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}?route=products&action=delete_product`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, productId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar producto")
      }

      return true
    } catch (error) {
      console.error("Error in deleteProduct:", error)
      throw error
    }
  },

  // Obtener productos para el resumen de gastos (ahora acepta projectId opcional)
  getProductsForExpenses: async (userId: string, projectId?: string): Promise<Product[]> => {
    try {
      let url = `${API_URL}?route=products&user_id=${userId}&action=get_products_for_expenses`
      if (projectId) {
        url += `&project_id=${projectId}` // Añadir el filtro por projectId
      }
      console.log("Fetching products for expenses from:", url)
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al obtener productos para gastos")
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error("Error in getProductsForExpenses:", error)
      throw error
    }
  },
}
