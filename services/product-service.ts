import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Product } from "../types"

// Importar la función para extraer la ruta del archivo de una URL
import { extractFilePathFromUrl } from "../lib/supabase/storage-helper"

// Detectar si estamos en modo local (sin Supabase)
const isLocalMode = () => {
  return (
    typeof window !== "undefined" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

export const ProductService = {
  // Modificar la función getProducts para implementar paginación y manejo de errores mejorado
  getProducts: async (userId: string): Promise<Product[]> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para getProducts")
        const products = JSON.parse(localStorage.getItem("products") || "[]")
        const userProducts = products.filter((product: any) => product.userId === userId)

        return userProducts.map((product: any) => ({
          id: product.id,
          title: product.title,
          price: Number.parseFloat(product.price),
          quantity: product.quantity,
          image: product.image,
          storeId: product.storeId,
          isEditing: false,
          createdAt: product.createdAt || null, // Incluir la fecha si existe
        }))
      }

      // Modo Supabase con paginación y reintentos
      const supabase = createClientSupabaseClient()

      // Implementar paginación para evitar timeouts
      const PAGE_SIZE = 50
      let allProducts: any[] = []
      let hasMore = true
      let page = 0
      let retryCount = 0
      const MAX_RETRIES = 3

      while (hasMore && retryCount < MAX_RETRIES) {
        try {
          console.log(`Obteniendo productos - página ${page}, tamaño ${PAGE_SIZE}`)

          // Usar paginación para evitar timeouts
          const { data, error, count } = await supabase
            .from("products")
            .select("*", { count: "exact" })
            .eq("user_id", userId)
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .order("created_at", { ascending: false })

          if (error) {
            console.error(`Error al obtener productos (página ${page}):`, error)
            retryCount++

            // Esperar antes de reintentar (backoff exponencial)
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000)
            console.log(`Reintentando en ${backoffTime / 1000} segundos...`)
            await new Promise((resolve) => setTimeout(resolve, backoffTime))
            continue
          }

          // Resetear contador de reintentos al tener éxito
          retryCount = 0

          if (data && data.length > 0) {
            allProducts = [...allProducts, ...data]
            page++

            // Verificar si hay más datos
            hasMore = data.length === PAGE_SIZE
          } else {
            hasMore = false
          }
        } catch (fetchError) {
          console.error(`Error al obtener productos (página ${page}):`, fetchError)
          retryCount++

          if (retryCount >= MAX_RETRIES) {
            console.error("Se alcanzó el número máximo de reintentos")
            break
          }

          // Esperar antes de reintentar (backoff exponencial)
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000)
          console.log(`Reintentando en ${backoffTime / 1000} segundos...`)
          await new Promise((resolve) => setTimeout(resolve, backoffTime))
        }
      }

      // Si después de todos los reintentos no tenemos productos, lanzar error
      if (allProducts.length === 0 && retryCount >= MAX_RETRIES) {
        throw new Error("No se pudieron obtener los productos después de múltiples intentos")
      }

      return allProducts.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number.parseFloat(product.price),
        quantity: product.quantity,
        image: product.image,
        storeId: product.store_id,
        isEditing: false,
        createdAt: product.created_at || null, // Incluir la fecha de la BD
      }))
    } catch (error) {
      console.error("Error al obtener productos:", error)
      throw error
    }
  },

  // Añadir un nuevo producto
  addProduct: async (userId: string, product: Omit<Product, "id" | "isEditing">): Promise<Product> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para addProduct")
        const products = JSON.parse(localStorage.getItem("products") || "[]")
        const createdAt = new Date().toISOString() // Añadir fecha actual
        const newProduct = {
          id: Date.now().toString(),
          title: product.title,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          storeId: product.storeId,
          userId: userId,
          createdAt: createdAt, // Guardar la fecha
        }

        products.push(newProduct)
        localStorage.setItem("products", JSON.stringify(products))

        console.log("Producto añadido exitosamente en modo local:", newProduct)

        return {
          id: newProduct.id,
          title: newProduct.title,
          price: Number.parseFloat(newProduct.price),
          quantity: newProduct.quantity,
          image: newProduct.image,
          storeId: newProduct.storeId,
          isEditing: false,
          createdAt: createdAt, // Incluir la fecha en el retorno
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()
      const createdAt = new Date().toISOString() // Añadir fecha actual

      console.log("Añadiendo producto a Supabase:", {
        title: product.title,
        price: product.price,
        quantity: product.quantity,
        store_id: product.storeId,
        user_id: userId,
        created_at: createdAt, // Incluir la fecha en el log
      })

      const { data, error } = await supabase
        .from("products")
        .insert({
          title: product.title,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          store_id: product.storeId,
          user_id: userId,
          created_at: createdAt, // Añadir la fecha a la inserción
        })
        .select("*")
        .single()

      if (error) {
        console.error("Error al añadir producto en Supabase:", error)
        throw new Error("Error al añadir producto: " + error.message)
      }

      console.log("Producto añadido exitosamente en Supabase:", data)

      return {
        id: data.id,
        title: data.title,
        price: Number.parseFloat(data.price),
        quantity: data.quantity,
        image: data.image,
        storeId: data.store_id,
        isEditing: false,
        createdAt: data.created_at || createdAt, // Usar la fecha de la BD o la creada localmente
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
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para updateProduct")
        const products = JSON.parse(localStorage.getItem("products") || "[]")
        const productIndex = products.findIndex((p: any) => p.id === productId && p.userId === userId)

        if (productIndex === -1) {
          throw new Error("Producto no encontrado")
        }

        // Actualizar el producto
        const updatedProduct = { ...products[productIndex] }

        if (updates.title !== undefined) updatedProduct.title = updates.title
        if (updates.price !== undefined) updatedProduct.price = updates.price
        if (updates.quantity !== undefined) updatedProduct.quantity = updates.quantity
        if (updates.storeId !== undefined) updatedProduct.storeId = updates.storeId
        if (updates.image !== undefined) updatedProduct.image = updates.image

        products[productIndex] = updatedProduct
        localStorage.setItem("products", JSON.stringify(products))

        return {
          id: updatedProduct.id,
          title: updatedProduct.title,
          price: Number.parseFloat(updatedProduct.price),
          quantity: updatedProduct.quantity,
          image: updatedProduct.image,
          storeId: updatedProduct.storeId,
          isEditing: false,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Verificar que el producto pertenece al usuario
      const { data: existingProduct, error: verifyError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", userId)
        .single()

      if (verifyError) {
        throw new Error("Error al verificar el producto: " + verifyError.message)
      }

      // Preparar los datos a actualizar
      const updateData: any = {}

      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.price !== undefined) updateData.price = updates.price
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity
      if (updates.storeId !== undefined) updateData.store_id = updates.storeId
      if (updates.image !== undefined) updateData.image = updates.image

      // Actualizar el producto
      const { data, error } = await supabase.from("products").update(updateData).eq("id", productId).select().single()

      if (error) {
        throw new Error("Error al actualizar producto: " + error.message)
      }

      return {
        id: data.id,
        title: data.title,
        price: Number.parseFloat(data.price),
        quantity: data.quantity,
        image: data.image,
        storeId: data.store_id,
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
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para deleteProduct")
        const products = JSON.parse(localStorage.getItem("products") || "[]")
        const productIndex = products.findIndex((p: any) => p.id === productId && p.userId === userId)

        if (productIndex === -1) {
          throw new Error("Producto no encontrado")
        }

        // Eliminar el producto
        products.splice(productIndex, 1)
        localStorage.setItem("products", JSON.stringify(products))

        return true
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Verificar que el producto pertenece al usuario y obtener su imagen
      const { data: existingProduct, error: verifyError } = await supabase
        .from("products")
        .select("id, image")
        .eq("id", productId)
        .eq("user_id", userId)
        .single()

      if (verifyError) {
        console.error("Error al verificar el producto:", verifyError)
        throw new Error("Error al verificar el producto: " + verifyError.message)
      }

      console.log("Eliminando producto con ID:", productId)

      // Si el producto tiene una imagen, eliminarla del storage
      if (existingProduct.image) {
        try {
          console.log("El producto tiene una imagen asociada, intentando eliminarla:", existingProduct.image)

          // Extraer la ruta del archivo de la URL
          const filePath = extractFilePathFromUrl(existingProduct.image)

          if (filePath) {
            console.log("Ruta del archivo a eliminar:", filePath)

            // Eliminar la imagen del bucket 'product-images'
            const { error: deleteImageError } = await supabase.storage.from("product-images").remove([filePath])

            if (deleteImageError) {
              console.error("Error al eliminar la imagen del producto:", deleteImageError)
              // No lanzamos error para continuar con la eliminación del producto
            } else {
              console.log("Imagen del producto eliminada correctamente")
            }
          }
        } catch (imageError) {
          console.error("Error al procesar la eliminación de la imagen:", imageError)
          // No lanzamos error para continuar con la eliminación del producto
        }
      }

      // Eliminar el producto con reintentos
      let retries = 3
      let success = false
      let lastError = null

      while (retries > 0 && !success) {
        try {
          const { error } = await supabase.from("products").delete().eq("id", productId)

          if (error) {
            console.error(`Intento ${4 - retries}: Error al eliminar producto en Supabase:`, error)
            lastError = error
            retries--
            // Esperar antes de reintentar
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            success = true
            console.log("Producto eliminado correctamente en Supabase")
          }
        } catch (error) {
          console.error(`Intento ${4 - retries}: Error al eliminar producto:`, error)
          lastError = error
          retries--
          // Esperar antes de reintentar
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      if (!success) {
        throw new Error(
          "Error al eliminar producto después de varios intentos: " +
            (lastError instanceof Error ? lastError.message : String(lastError)),
        )
      }

      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      throw error
    }
  },
}
