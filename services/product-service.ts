import type { Product } from "@/types"

export const ProductService = {
  // Modificar la función getProducts para asegurar que el token se envía correctamente
  async getProducts(userId: string): Promise<Product[]> {
    try {
      console.log("ProductService.getProducts - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.error("No hay token de autenticación")
        return []
      }

      console.log("Token encontrado:", token.substring(0, 15) + "...")

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Construir la URL completa con el parámetro path
      const fullUrl = `${apiUrl}?path=/products`
      console.log("URL completa:", fullUrl)

      // Hacer la solicitud directamente sin usar el proxy
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      console.log("Código de estado:", response.status)

      if (!response.ok) {
        console.error("Error en la respuesta:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Texto de error:", errorText)
        return []
      }

      const products = await response.json()
      console.log("Productos recibidos:", products)

      if (Array.isArray(products)) {
        return products.map((product: any) => ({
          id: product.id.toString(),
          title: product.title || "Producto sin nombre",
          price: Number.parseFloat(product.price) || 0,
          quantity: Number.parseInt(product.quantity) || 1,
          image: product.image || null,
          storeId: product.storeId?.toString() || "",
          user_id: userId,
        }))
      }

      console.error("La respuesta no es un array:", products)
      return []
    } catch (error) {
      console.error("Error en ProductService.getProducts:", error)
      return []
    }
  },

  async addProduct(userId: string, productData: Partial<Product>): Promise<Product> {
    try {
      console.log("ProductService.addProduct - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${apiUrl}/products`,
          method: "POST",
          data: {
            title: productData.title,
            price: productData.price,
            store_id: productData.store_id,
            image: productData.image,
            user_id: userId,
          },
        }),
      })

      const data = await response.json()
      console.log("ProductService.addProduct - Respuesta:", data)

      // Crear un ID temporal si no se recibe uno
      const tempId = Math.random().toString(36).substring(2, 15)

      // Devolver un objeto de producto con los datos disponibles
      return {
        id: data.id?.toString() || tempId,
        title: productData.title || "",
        price: productData.price || 0,
        store_id: productData.store_id || "",
        image: productData.image || null,
        user_id: userId,
      }
    } catch (error) {
      console.error("Error en ProductService.addProduct:", error)
      // Crear un ID temporal
      const tempId = Math.random().toString(36).substring(2, 15)
      // Devolver un objeto de producto con los datos disponibles
      return {
        id: tempId,
        title: productData.title || "",
        price: productData.price || 0,
        store_id: productData.store_id || "",
        image: productData.image || null,
        user_id: userId,
      }
    }
  },

  async updateProduct(userId: string, productId: string, productData: Partial<Product>): Promise<Product> {
    try {
      console.log("ProductService.updateProduct - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${apiUrl}/products/${productId}`,
          method: "PUT",
          data: {
            title: productData.title,
            price: productData.price,
            store_id: productData.store_id,
            image: productData.image,
            user_id: userId,
          },
        }),
      })

      const data = await response.json()
      console.log("ProductService.updateProduct - Respuesta:", data)

      // Devolver un objeto de producto con los datos actualizados
      return {
        id: productId,
        title: productData.title || "",
        price: productData.price || 0,
        store_id: productData.store_id || "",
        image: productData.image || null,
        user_id: userId,
      }
    } catch (error) {
      console.error("Error en ProductService.updateProduct:", error)
      // Devolver un objeto de producto con los datos actualizados
      return {
        id: productId,
        title: productData.title || "",
        price: productData.price || 0,
        store_id: productData.store_id || "",
        image: productData.image || null,
        user_id: userId,
      }
    }
  },

  async deleteProduct(userId: string, productId: string): Promise<void> {
    try {
      console.log("ProductService.deleteProduct - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: `${apiUrl}/products/${productId}`,
          method: "DELETE",
        }),
      })

      const data = await response.json()
      console.log("ProductService.deleteProduct - Respuesta:", data)
    } catch (error) {
      console.error("Error en ProductService.deleteProduct:", error)
    }
  },
}
