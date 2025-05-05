import type { Product } from "@/types"

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

      // Usar el proxy para evitar problemas de CORS
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(`${API_BASE_URL}/products`)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Respuesta status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log("Respuesta de productos:", responseData)

      // Manejar respuesta vacía o no válida
      if (!responseData) {
        console.log("Respuesta vacía, devolviendo array vacío")
        return []
      }

      // Verificar si es un array
      if (Array.isArray(responseData)) {
        return responseData.map((product: any) => ({
          ...product,
          isEditing: false,
        }))
      }
      // Verificar si es un objeto con una propiedad que contiene el array
      else if (responseData && typeof responseData === "object") {
        // Buscar una propiedad que pueda contener un array
        for (const key in responseData) {
          if (Array.isArray(responseData[key])) {
            return responseData[key].map((product: any) => ({
              ...product,
              isEditing: false,
            }))
          }
        }
      }

      // Si hay texto en la respuesta pero no es un array ni un objeto con array
      if (responseData.text) {
        console.warn("La respuesta contiene texto pero no JSON válido:", responseData.text)
      }

      // Si no se encontró un array, devolver array vacío
      console.warn("La respuesta no contiene un array de productos:", responseData)
      return []
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

      // Usar el proxy-post para métodos POST
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}/products`,
          method: "POST",
          data: product,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al añadir producto: ${response.status} ${response.statusText}`)
      }

      const newProduct = await response.json()
      console.log("Producto añadido:", newProduct)

      return {
        ...newProduct,
        isEditing: false,
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

      // Usar el proxy-post para métodos PUT
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}/products/${productId}`,
          method: "PUT",
          data: updates,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al actualizar producto: ${response.status} ${response.statusText}`)
      }

      const updatedProduct = await response.json()
      console.log("Producto actualizado:", updatedProduct)

      return {
        ...updatedProduct,
        isEditing: false,
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

      // Usar el proxy-post para métodos DELETE
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}/products/${productId}`,
          method: "DELETE",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
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
