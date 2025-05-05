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

      console.log("Obteniendo productos desde:", `${API_BASE_URL}/products`)

      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Respuesta de productos (texto):", responseText)

      // Manejar respuesta vacía
      if (!responseText.trim()) {
        console.log("Respuesta vacía, devolviendo array vacío")
        return []
      }

      try {
        const products = JSON.parse(responseText)
        console.log("Productos obtenidos:", products)

        return Array.isArray(products)
          ? products.map((product: any) => ({
              ...product,
              isEditing: false,
            }))
          : []
      } catch (parseError) {
        console.error("Error al parsear JSON de productos:", parseError)
        return []
      }
    } catch (error) {
      console.error("Error al obtener productos:", error)
      throw error
    }
  },

  // Añadir un nuevo producto
  addProduct: async (userId: string, product: Omit<Product, "id" | "isEditing">): Promise<Product> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Añadiendo producto:", product)

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
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al añadir producto: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Respuesta de añadir producto (texto):", responseText)

      try {
        const newProduct = JSON.parse(responseText)
        console.log("Producto añadido:", newProduct)

        return {
          ...newProduct,
          isEditing: false,
        }
      } catch (parseError) {
        console.error("Error al parsear JSON del nuevo producto:", parseError)
        // Crear un producto temporal con ID generado localmente
        return {
          id: `temp-${Date.now()}`,
          ...product,
          isEditing: false,
        }
      }
    } catch (error) {
      console.error("Error al añadir producto:", error)
      throw error
    }
  },

  // Actualizar un producto
  updateProduct: async (
    userId: string,
    productId: string,
    updates: Partial<Omit<Product, "id" | "isEditing">>,
  ): Promise<Product> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Actualizando producto:", productId, updates)

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al actualizar producto: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Respuesta de actualizar producto (texto):", responseText)

      try {
        const updatedProduct = JSON.parse(responseText)
        console.log("Producto actualizado:", updatedProduct)

        return {
          ...updatedProduct,
          isEditing: false,
        }
      } catch (parseError) {
        console.error("Error al parsear JSON del producto actualizado:", parseError)
        // Devolver un objeto con los datos actualizados
        return {
          id: productId,
          ...updates,
          isEditing: false,
        } as Product
      }
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

      console.log("Eliminando producto:", productId)

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al eliminar producto: ${response.status} ${response.statusText}`)
      }

      console.log("Producto eliminado correctamente")
      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      throw error
    }
  },
}
