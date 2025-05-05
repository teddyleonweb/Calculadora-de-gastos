import type { Product } from "@/types"

export const ProductService = {
  async getProducts(userId: string): Promise<Product[]> {
    try {
      console.log("ProductService.getProducts - Iniciando solicitud")

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.error("No hay token de autenticación")
        return []
      }

      // URL base de la API de WordPress
      const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

      // Hacer la solicitud a través del proxy
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(`${apiUrl}/products`)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      console.log("ProductService.getProducts - Respuesta:", data)

      // Si la respuesta contiene rawResponse, intentar parsearla
      if (data.rawResponse) {
        try {
          // Intentar limpiar la respuesta y parsearla como JSON
          const cleanedResponse = data.rawResponse.trim()
          console.log("Respuesta limpia:", cleanedResponse)

          // Verificar si la respuesta es HTML o contiene etiquetas HTML
          if (cleanedResponse.startsWith("<") || cleanedResponse.includes("<!DOCTYPE")) {
            console.error("La respuesta parece ser HTML, no JSON")
            return []
          }

          // Intentar extraer JSON válido de la respuesta
          const jsonMatch = cleanedResponse.match(/\[\s*\{.*\}\s*\]/s) || cleanedResponse.match(/\{\s*".*"\s*:\s*.*\}/s)
          if (jsonMatch) {
            const extractedJson = jsonMatch[0]
            console.log("JSON extraído:", extractedJson)

            const parsedData = JSON.parse(extractedJson)
            if (Array.isArray(parsedData)) {
              return parsedData.map((product: any) => ({
                id: product.id.toString(),
                title: product.title || "Producto sin nombre",
                price: Number.parseFloat(product.price) || 0,
                store_id: product.store_id?.toString() || "",
                image: product.image || null,
                user_id: userId,
              }))
            }
          }
        } catch (parseError) {
          console.error("Error al parsear la respuesta:", parseError)
        }
      }

      // Si llegamos aquí, no pudimos obtener datos válidos
      console.error("No se pudieron obtener productos válidos")
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
