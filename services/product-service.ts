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

      // Añadir un timestamp para evitar la caché del navegador
      const timestamp = new Date().getTime()

      // Usar fetch con parámetro de timestamp para asegurar datos frescos
      // pero sin cabeceras que puedan causar problemas CORS
      const response = await fetch(`${API_BASE_URL}/products?_t=${timestamp}`, {
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
      console.log(`Productos obtenidos (timestamp: ${timestamp}): ${products.length}`)
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

      const response = await fetch(`${API_BASE_URL}/products`, {
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
      console.log("Producto añadido con éxito, respuesta del servidor:", newProduct)
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

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
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

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
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
}
