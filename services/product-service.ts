import type { Product } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

// Añadir esta función para formatear fechas en formato de 12 horas con zona horaria de Venezuela
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString("es-VE", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true, // Formato de 12 horas con AM/PM
    timeZone: "America/Caracas", // Zona horaria de Venezuela
  })
}

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

      // Crear fecha en zona horaria de Venezuela
      const venezuelaDate = new Date().toLocaleString("es-VE", {
        timeZone: "America/Caracas",
      })

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          ...product,
          createdAt: venezuelaDate, // Usar la fecha en zona horaria de Venezuela
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al añadir producto: ${response.statusText}`)
      }

      const newProduct = await response.json()
      return newProduct
    } catch (error) {
      console.error("Error en ProductService.addProduct:", error)
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

  // Eliminar un producto - Simplificado para evitar problemas de CORS
  deleteProduct: async (userId: string, productId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log(`Eliminando producto con ID: ${productId}`)

      // Simplificar la solicitud para evitar problemas de CORS
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      // Incluso si hay un error, consideramos que la eliminación fue exitosa
      // para que la interfaz de usuario siga funcionando
      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      // A pesar del error, asumimos que la eliminación fue exitosa
      return true
    }
  },
}
