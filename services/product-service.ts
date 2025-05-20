// services/product-service.ts

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gestoreconomico.somediave.com/api.php"

// Clase ProductService
class ProductService {
  // Obtener todos los productos
  static async getProducts(userId: string): Promise<any[]> {
    try {
      console.log("ProductService: Obteniendo productos para el usuario:", userId)
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado: Token no encontrado")
      }

      const response = await fetch(`${API_URL}/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ProductService: Error al obtener productos. Status:", response.status, "Respuesta:", errorText)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log("ProductService: Productos obtenidos:", data.length)
      return data
    } catch (error) {
      console.error("ProductService: Error al obtener productos:", error)
      throw error
    }
  }

  // Añadir un nuevo producto
  static async addProduct(userId: string, product: any): Promise<any> {
    try {
      console.log("ProductService: Enviando solicitud para añadir producto:", product)
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado: Token no encontrado")
      }

      // Verificar que los campos requeridos estén presentes
      if (!product.title || product.price === undefined || product.quantity === undefined) {
        console.error("ProductService: Faltan campos requeridos en el producto", product)
        throw new Error("Faltan campos requeridos: título, precio o cantidad")
      }

      // Asegurarse de que el precio y la cantidad sean números
      const productToSend = {
        ...product,
        price: Number(product.price),
        quantity: Number(product.quantity),
      }

      console.log("ProductService: Datos normalizados a enviar:", productToSend)

      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productToSend),
      })

      console.log("ProductService: Respuesta del servidor:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ProductService: Error al añadir producto. Status:", response.status, "Respuesta:", errorText)

        let errorMessage = `Error HTTP: ${response.status}`
        try {
          // Intentar parsear el error como JSON
          const errorData = JSON.parse(errorText)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // Si no es JSON, usar el texto tal cual
          if (errorText) {
            errorMessage = errorText
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("ProductService: Producto añadido exitosamente:", data)
      return data
    } catch (error) {
      console.error("ProductService: Error en addProduct:", error)
      throw error
    }
  }

  // Actualizar un producto existente
  static async updateProduct(userId: string, productId: string, updateData: any): Promise<any> {
    try {
      console.log("ProductService: Actualizando producto:", productId, updateData)
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado: Token no encontrado")
      }

      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ProductService: Error al actualizar producto. Status:", response.status, "Respuesta:", errorText)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log("ProductService: Producto actualizado exitosamente:", data)
      return data
    } catch (error) {
      console.error("ProductService: Error al actualizar producto:", error)
      throw error
    }
  }

  // Eliminar un producto
  static async deleteProduct(userId: string, productId: string): Promise<boolean> {
    try {
      console.log("ProductService: Eliminando producto:", productId)
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado: Token no encontrado")
      }

      // Asegurarse de que la URL sea correcta
      const url = `${API_URL}/products/${productId}`
      console.log("ProductService: URL de eliminación:", url)

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Registrar la respuesta completa para depuración
      console.log("ProductService: Respuesta del servidor:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("ProductService: Error al eliminar producto. Status:", response.status, "Respuesta:", errorText)
        throw new Error(`Error HTTP: ${response.status}`)
      }

      console.log("ProductService: Producto eliminado exitosamente")
      return true
    } catch (error) {
      console.error("ProductService: Error al eliminar producto:", error)
      throw error
    }
  }
}

// Exportar la clase ProductService como exportación por defecto
export default ProductService
