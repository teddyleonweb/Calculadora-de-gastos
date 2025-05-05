import type { Product } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

// Función privada para guardar productos en localStorage
const _saveProductsToLocalStorage = (products: Product[], userId: string) => {
  try {
    localStorage.setItem(`products_${userId}`, JSON.stringify(products))
    console.log("Productos guardados en localStorage:", products.length)
  } catch (error) {
    console.error("Error al guardar productos en localStorage:", error)
  }
}

// Función privada para cargar productos desde localStorage
const _loadProductsFromLocalStorage = (userId: string): Product[] => {
  try {
    const storedProducts = localStorage.getItem(`products_${userId}`)
    if (storedProducts) {
      const products = JSON.parse(storedProducts)
      console.log("Productos cargados desde localStorage:", products.length)
      return products
    }
  } catch (error) {
    console.error("Error al cargar productos desde localStorage:", error)
  }
  return []
}

export const ProductService = {
  // Obtener todos los productos del usuario
  getProducts: async (userId: string): Promise<Product[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo productos desde:", `${API_BASE_URL}/products`)

      // Primero intentar cargar desde localStorage para respuesta inmediata
      const cachedProducts = _loadProductsFromLocalStorage(userId)

      // Intentar obtener productos del servidor en segundo plano
      fetch(`${API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error al obtener productos: ${response.status} ${response.statusText}`)
          }
          return response.json()
        })
        .then((serverProducts) => {
          console.log("Productos obtenidos del servidor:", serverProducts.length)
          // Actualizar localStorage con los datos más recientes
          _saveProductsToLocalStorage(serverProducts, userId)
          // Si tenemos un componente montado, actualizar el estado
          if (typeof window !== "undefined") {
            // Emitir un evento personalizado para notificar a los componentes
            window.dispatchEvent(
              new CustomEvent("products-updated", {
                detail: { products: serverProducts },
              }),
            )
          }
        })
        .catch((error) => {
          console.error("Error al obtener productos del servidor:", error)
        })

      // Devolver los productos en caché mientras se actualiza en segundo plano
      return cachedProducts.map((product: any) => ({
        ...product,
        isEditing: false,
      }))
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

      const newProduct = await response.json()
      console.log("Producto añadido:", newProduct)

      // Actualizar localStorage
      const cachedProducts = _loadProductsFromLocalStorage(userId)
      cachedProducts.push({ ...newProduct, isEditing: false })
      _saveProductsToLocalStorage(cachedProducts, userId)

      return {
        ...newProduct,
        isEditing: false,
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

      const updatedProduct = await response.json()
      console.log("Producto actualizado:", updatedProduct)

      // Actualizar localStorage
      const cachedProducts = _loadProductsFromLocalStorage(userId)
      const updatedProducts = cachedProducts.map((product) =>
        product.id === productId ? { ...product, ...updates, isEditing: false } : product,
      )
      _saveProductsToLocalStorage(updatedProducts, userId)

      return {
        ...updatedProduct,
        isEditing: false,
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

      // Actualizar localStorage inmediatamente para respuesta rápida
      const cachedProducts = _loadProductsFromLocalStorage(userId)
      const filteredProducts = cachedProducts.filter((product) => product.id !== productId)
      _saveProductsToLocalStorage(filteredProducts, userId)

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)

        // Si hay error, restaurar el estado anterior
        _saveProductsToLocalStorage(cachedProducts, userId)

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
