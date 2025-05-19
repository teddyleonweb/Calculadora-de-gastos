// services/product-service.ts

// This is a placeholder for the product service.
// It should handle fetching, creating, updating, and deleting products.
// Verificar que no haya dependencias de Supabase

import type { Product } from "../types"

export const ProductService = {
  // Obtener productos
  async getProducts(userId: string): Promise<Product[]> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/products?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.statusText}`)
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error("Error en el servicio de productos (getProducts):", error)
      return []
    }
  },

  // Añadir producto
  async addProduct(product: Omit<Product, "id">): Promise<Product | null> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      })

      if (!response.ok) {
        throw new Error(`Error al añadir producto: ${response.statusText}`)
      }

      const data = await response.json()
      return data.product || null
    } catch (error) {
      console.error("Error en el servicio de productos (addProduct):", error)
      return null
    }
  },

  // Actualizar producto
  async updateProduct(product: Product): Promise<Product | null> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/products/${product.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(product),
        },
      )

      if (!response.ok) {
        throw new Error(`Error al actualizar producto: ${response.statusText}`)
      }

      const data = await response.json()
      return data.product || null
    } catch (error) {
      console.error("Error en el servicio de productos (updateProduct):", error)
      return null
    }
  },

  // Eliminar producto
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Error al eliminar producto: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Error en el servicio de productos (deleteProduct):", error)
      return false
    }
  },
}
