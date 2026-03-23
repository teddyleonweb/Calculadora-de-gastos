import type { Product } from "../types"
import { API_CONFIG } from "../config/api"

export const ProductService = {
  // Obtener todos los productos del usuario
  getProducts: async (userId: string, projectId?: string): Promise<Product[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Añadir el timestamp para evitar caché
      let url = API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/products"))

      // Si hay un projectId, añadirlo como parámetro de consulta
      if (projectId) {
        url += `&projectId=${encodeURIComponent(projectId)}`
        console.log(`Solicitando productos filtrados por proyecto: ${projectId}`)
      } else {
        console.log("Solicitando todos los productos (sin filtro de proyecto)")
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`)
        throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
      }

      const products = await response.json()
      console.log(`Productos obtenidos (timestamp: ${new Date().getTime()}): ${products.length}`)

      // Asignar projectId a los productos si se proporcionó uno
      return products.map((product: any) => ({
        ...product,
        isEditing: false,
        projectId: projectId || product.projectId || "1", // Usar el projectId proporcionado o el del producto
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

      // Asegurar que el projectId esté presente
      const projectId = product.projectId || "1"

      // Extraer projectId para enviarlo como parámetro separado
      const { projectId: extractedProjectId, ...productData } = product

      // Crear el objeto de datos a enviar
      const dataToSend = {
        ...productData,
        // Incluir projectId como un campo separado que la API puede usar
        // para crear la relación en la tabla wp_price_extractor_project_products
        projectId: projectId,
      }

      console.log("Datos finales a enviar a la API:", dataToSend)

      console.log("[v0] URL de la API:", API_CONFIG.getEndpointUrl("/products"))
      const response = await fetch(API_CONFIG.getEndpointUrl("/products"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      })

      console.log("[v0] Respuesta del servidor - status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error en la respuesta del servidor:", errorText)
        throw new Error(`Error al añadir producto: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("[v0] Respuesta cruda del servidor:", responseText)
      
      let newProduct
      try {
        newProduct = JSON.parse(responseText)
      } catch (e) {
        console.error("[v0] Error al parsear respuesta JSON:", e)
        throw new Error("La respuesta del servidor no es JSON válido")
      }
      
      console.log("[v0] Producto creado exitosamente:", newProduct)
      console.log("[v0] ID del producto creado:", newProduct?.id)

      // Añadir el projectId al producto devuelto
      return {
        ...newProduct,
        projectId: projectId,
        isEditing: false,
      }
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

      // Extraer projectId para enviarlo como parámetro separado
      const { projectId, ...productData } = data

      // Crear el objeto de datos a enviar
      const dataToSend = {
        ...productData,
        // Incluir projectId como un campo separado que la API puede usar
        // para actualizar la relación en la tabla wp_price_extractor_project_products
        projectId: projectId || "1",
      }

      // Asegurarse de que la imagen null se envíe explícitamente al backend
      if (data.image === null) {
        console.log("Eliminando imagen del producto")
        dataToSend.image = null
      }

      const response = await fetch(API_CONFIG.getEndpointUrl(`/products/${productId}`), {
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
      // Añadir el projectId al producto devuelto
      return { ...updatedProduct, projectId: projectId || "1" }
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

      const response = await fetch(API_CONFIG.getEndpointUrl(`/products/${productId}`), {
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

  // Obtener productos para mostrar en la lista de gastos (ahora acepta projectId opcional)
  getProductsForExpenses: async (userId: string, projectId?: string): Promise<any[]> => {
    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token")

      if (!token) {
        console.error("No se encontró token de autenticación")
        return []
      }

      let url = API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/products"))
      if (projectId) {
        url += `&projectId=${encodeURIComponent(projectId)}` // Añadir el filtro por projectId
      }
      console.log(`Solicitando productos para gastos (timestamp: ${new Date().getTime()}) con URL: ${url}`)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      // Parsear la respuesta como JSON
      const products = await response.json()
      console.log(`Productos obtenidos para gastos: ${products.length || 0}`)

      return products
    } catch (error) {
      console.error("Error al obtener productos para gastos:", error)
      return []
    }
  },
}
