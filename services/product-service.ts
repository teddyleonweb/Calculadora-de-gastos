import type { Product } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const ProductService = {
  // Obtener todos los productos del usuario
  getProducts: async (userId: string): Promise<Product[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Añadir un parámetro de timestamp para evitar la caché
      const timestamp = new Date().getTime()
      const response = await fetch(`${API_BASE_URL}/products?_t=${timestamp}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          // Añadir cabeceras para evitar caché
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`)
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
      }

      const products = await response.json()
      console.log(`Productos obtenidos: ${products.length}`)
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

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      })

      if (!response.ok) {
        throw new Error("Error al añadir producto")
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

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar producto")
      }

      const updatedProduct = await response.json()
      return updatedProduct
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      throw error
    }
  },

  // Eliminar un producto - Corregido para usar la URL correcta
  deleteProduct: async (userId: string, productId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log(`Eliminando producto con ID: ${productId}`)

      // Añadir un parámetro de timestamp para evitar la caché
      const timestamp = new Date().getTime()
      const response = await fetch(`${API_BASE_URL}/products/${productId}?_t=${timestamp}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          // Añadir cabeceras para evitar caché
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      // Verificar si la respuesta es 404 (no encontrado)
      if (response.status === 404) {
        console.warn(`El producto con ID ${productId} no fue encontrado en el servidor`)
        return true
      }

      // Si la respuesta no es ok pero no es 404, registrar el error
      if (!response.ok) {
        console.warn(`Respuesta no OK al eliminar producto: ${response.status} ${response.statusText}`)
        try {
          const errorBody = await response.text()
          console.error(`Error del servidor: ${errorBody}`)
        } catch (readError) {
          console.error("No se pudo leer el cuerpo de la respuesta de error")
        }
        return false
      }

      console.log(`Producto con ID ${productId} eliminado correctamente`)
      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      return false
    }
  },
}
