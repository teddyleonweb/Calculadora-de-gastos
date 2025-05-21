import type { Product } from "../types"
import { API_CONFIG } from "../config/api"

export const ProductService = {
  // Obtener todos los productos del usuario
  getProducts: async (userId: string): Promise<Product[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/products")), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          // Eliminamos la cabecera Pragma que causa problemas CORS
        },
      })

      if (!response.ok) {
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`)
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
      }

      const products = await response.json()
      console.log(`Productos obtenidos (timestamp: ${new Date().getTime()}): ${products.length}`)
      return products.map((product: any) => ({
        ...product,
        isEditing: false,
      }))
    } catch (error) {
      console.error("Error al obtener productos:", error)
      return []
    }
  },

  // Añadir un nuevo producto
  addProduct: async (userId: string, product: Omit<Product, "id" | "isEditing">): Promise<Product> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Enviando producto a la API:", product)

      const response = await fetch(API_CONFIG.getEndpointUrl("/products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en la respuesta del servidor:", errorText)
        throw new Error(`Error al añadir producto: ${response.status} ${response.statusText}`)
      }

      const newProduct = await response.json()
      return newProduct
    } catch (error) {
      console.error("Error al añadir producto:", error)
      throw error
    }
  },

  // Actualizar un producto
  updateProduct: async (userId: string, productId: string, data: Partial<Product>): Promise<Product> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Actualizando producto con ID:", productId, "Datos:", data)

      // Asegurarse de que la imagen null se envíe explícitamente al backend
      const dataToSend = { ...data }
      if (data.image === null) {
        console.log("Eliminando imagen del producto")
        // Asegurarse de que se envía explícitamente null para eliminar la imagen
        dataToSend.image = null
      }

      const response = await fetch(API_CONFIG.getEndpointUrl(`/products/${productId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en la respuesta del servidor:", errorText)
        throw new Error(`Error al actualizar producto: ${response.status} ${response.statusText}`)
      }

      const updatedProduct = await response.json()
      return updatedProduct
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      throw error
    }
  },

  // Eliminar un producto
  deleteProduct: async (userId: string, productId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log(`Eliminando producto con ID: ${productId}`)

      const response = await fetch(API_CONFIG.getEndpointUrl(`/products/${productId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error(`Error al eliminar producto: ${response.status} ${response.statusText}`)
        return false
      }

      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      return false
    }
  },

  // Obtener productos para mostrar en la lista de gastos
  getProductsForExpenses: async (userId: string): Promise<any[]> => {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return []
      }

      const response = await fetch(API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/products")), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const products = await response.json()
      console.log(`Productos obtenidos para gastos: ${products.length || 0}`)

      return products
    } catch (error) {
      console.error("Error al obtener productos para gastos:", error)
      return []
    }
  },
}
