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

      // Verificar que la URL sea correcta
      const url = `${API_BASE_URL}/products`
      console.log("URL completa:", url)

      // Añadir parámetros de depuración
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      console.log("Respuesta status:", response.status)
      console.log("Respuesta headers:", Object.fromEntries(response.headers.entries()))

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
        // Intentar parsear como JSON
        const products = JSON.parse(responseText)
        console.log("Productos obtenidos:", products)

        // Verificar si es un array
        if (Array.isArray(products)) {
          return products.map((product: any) => ({
            ...product,
            isEditing: false,
          }))
        }
        // Verificar si es un objeto con una propiedad que contiene el array
        else if (products && typeof products === "object") {
          // Buscar una propiedad que pueda contener un array
          for (const key in products) {
            if (Array.isArray(products[key])) {
              return products[key].map((product: any) => ({
                ...product,
                isEditing: false,
              }))
            }
          }
        }

        // Si no se encontró un array, devolver array vacío
        console.warn("La respuesta no contiene un array de productos:", products)
        return []
      } catch (parseError) {
        console.error("Error al parsear JSON de productos:", parseError)

        // Intentar extraer JSON válido de la respuesta
        try {
          const jsonMatch = responseText.match(/\{.*\}/s) || responseText.match(/\[.*\]/s)
          if (jsonMatch) {
            const extractedJson = jsonMatch[0]
            console.log("JSON extraído:", extractedJson)
            const products = JSON.parse(extractedJson)

            if (Array.isArray(products)) {
              return products.map((product: any) => ({
                ...product,
                isEditing: false,
              }))
            }
          }
        } catch (extractError) {
          console.error("Error al extraer JSON:", extractError)
        }

        return []
      }
    } catch (error) {
      console.error("Error al obtener productos:", error)
      return [] // Devolver array vacío en caso de error
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
          Accept: "application/json",
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
      // Crear un producto temporal con ID generado localmente
      return {
        id: `temp-${Date.now()}`,
        ...product,
        isEditing: false,
      }
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
          Accept: "application/json",
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
      // Devolver un objeto con los datos actualizados
      return {
        id: productId,
        ...updates,
        isEditing: false,
      } as Product
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
          Accept: "application/json",
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
      return false
    }
  },
}
