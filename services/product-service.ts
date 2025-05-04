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
  // Obtener todos los productos del usuario
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
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }))
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase.from("products").select("*").eq("user_id", userId)

      if (error) {
        throw new Error("Error al obtener productos: " + error.message)
      }

      return data.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number.parseFloat(product.price),
        quantity: product.quantity,
        image: product.image,
        storeId: product.store_id,
        isEditing: false,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
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
        const now = new Date().toISOString()
        const newProduct = {
          id: Date.now().toString(),
          title: product.title,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          storeId: product.storeId,
          userId: userId,
          createdAt: now,
          updatedAt: now,
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
          createdAt: newProduct.createdAt,
          updatedAt: newProduct.updatedAt,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()
      const now = new Date().toISOString()

      console.log("Añadiendo producto a Supabase:", {
        title: product.title,
        price: product.price,
        quantity: product.quantity,
        store_id: product.storeId,
        user_id: userId,
        created_at: now,
        updated_at: now,
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
          created_at: now,
          updated_at: now,
        })
        .select("*") // Asegurarse de que esta línea esté presente
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
        createdAt: data.created_at,
        updatedAt: data.updated_at,
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
        const now = new Date().toISOString()

        if (updates.title !== undefined) updatedProduct.title = updates.title
        if (updates.price !== undefined) updatedProduct.price = updates.price
        if (updates.quantity !== undefined) updatedProduct.quantity = updates.quantity
        if (updates.storeId !== undefined) updatedProduct.storeId = updates.storeId
        if (updates.image !== undefined) updatedProduct.image = updates.image
        updatedProduct.updatedAt = now

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
          createdAt: updatedProduct.createdAt,
          updatedAt: updatedProduct.updatedAt,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()
      const now = new Date().toISOString()

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
      const updateData: any = {
        updated_at: now,
      }

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
        createdAt: data.created_at,
        updatedAt: data.updated_at,
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
