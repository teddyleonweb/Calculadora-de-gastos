import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Product } from "../types"

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
          createdAt: product.createdAt || null, // Incluir la fecha si existe
        }))
      }

      // Modo Supabase con manejo de timeouts mejorado
      const supabase = createClientSupabaseClient()

      // OPTIMIZACIÓN: Limitar la cantidad de productos y seleccionar solo campos necesarios
      // También añadir un timeout más corto para evitar bloqueos
      const fetchPromise = supabase
        .from("products")
        .select("id, title, price, quantity, image, store_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50) // Limitar a 50 productos para mejorar rendimiento

      // Crear un timeout manual
      const timeoutPromise = new Promise<{ data: any[]; error: Error }>((_, reject) => {
        setTimeout(() => {
          reject(new Error("La consulta de productos ha excedido el tiempo límite"))
        }, 5000) // 5 segundos de timeout
      })

      // Usar Promise.race para implementar un timeout manual
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      if (error) {
        console.error("Error al obtener productos:", error)
        // Si hay error, intentar obtener desde localStorage como fallback
        const cachedProducts = localStorage.getItem(`products_${userId}`)
        if (cachedProducts) {
          console.log("Usando productos en caché debido a error en Supabase")
          return JSON.parse(cachedProducts)
        }
        throw new Error("Error al obtener productos: " + error.message)
      }

      // Mapear los productos y guardar en caché
      const mappedProducts = data.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number.parseFloat(product.price),
        quantity: product.quantity,
        image: product.image,
        storeId: product.store_id,
        isEditing: false,
        createdAt: product.created_at || null,
      }))

      // Guardar en localStorage como caché
      localStorage.setItem(`products_${userId}`, JSON.stringify(mappedProducts))

      return mappedProducts
    } catch (error) {
      console.error("Error al obtener productos:", error)

      // Intentar recuperar desde caché si hay error
      const cachedProducts = localStorage.getItem(`products_${userId}`)
      if (cachedProducts) {
        console.log("Usando productos en caché debido a error")
        return JSON.parse(cachedProducts)
      }

      // Si no hay caché, devolver array vacío para evitar errores en la UI
      return []
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

      // Modo Supabase con manejo de errores mejorado
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

      // Crear un timeout manual
      const timeoutPromise = new Promise<{ data: any; error: Error }>((_, reject) => {
        setTimeout(() => {
          reject(new Error("La inserción del producto ha excedido el tiempo límite"))
        }, 5000) // 5 segundos de timeout
      })

      // Usar Promise.race para implementar un timeout manual
      const insertPromise = supabase
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

      const { data, error } = await Promise.race([insertPromise, timeoutPromise])

      if (error) {
        console.error("Error al añadir producto en Supabase:", error)

        // Guardar en localStorage como respaldo
        const offlineProduct = {
          id: `offline_${Date.now()}`,
          title: product.title,
          price: Number.parseFloat(product.price.toString()),
          quantity: product.quantity,
          image: product.image,
          storeId: product.storeId,
          isEditing: false,
          createdAt: createdAt,
          pendingSync: true, // Marcar para sincronización posterior
        }

        // Guardar en localStorage para sincronizar después
        const pendingProducts = JSON.parse(localStorage.getItem(`pending_products_${userId}`) || "[]")
        pendingProducts.push(offlineProduct)
        localStorage.setItem(`pending_products_${userId}`, JSON.stringify(pendingProducts))

        // Actualizar caché de productos
        const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
        cachedProducts.push(offlineProduct)
        localStorage.setItem(`products_${userId}`, JSON.stringify(cachedProducts))

        return offlineProduct
      }

      console.log("Producto añadido exitosamente en Supabase:", data)

      const newProduct = {
        id: data.id,
        title: data.title,
        price: Number.parseFloat(data.price),
        quantity: data.quantity,
        image: data.image,
        storeId: data.store_id,
        isEditing: false,
        createdAt: data.created_at || createdAt, // Usar la fecha de la BD o la creada localmente
      }

      // Actualizar caché de productos
      const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
      cachedProducts.push(newProduct)
      localStorage.setItem(`products_${userId}`, JSON.stringify(cachedProducts))

      return newProduct
    } catch (error) {
      console.error("Error al añadir producto:", error)

      // Crear producto offline como fallback
      const offlineProduct = {
        id: `offline_${Date.now()}`,
        title: product.title,
        price: Number.parseFloat(product.price.toString()),
        quantity: product.quantity,
        image: product.image,
        storeId: product.storeId,
        isEditing: false,
        createdAt: new Date().toISOString(),
        pendingSync: true,
      }

      // Guardar en localStorage para sincronizar después
      const pendingProducts = JSON.parse(localStorage.getItem(`pending_products_${userId}`) || "[]")
      pendingProducts.push(offlineProduct)
      localStorage.setItem(`pending_products_${userId}`, JSON.stringify(pendingProducts))

      // Actualizar caché de productos
      const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
      cachedProducts.push(offlineProduct)
      localStorage.setItem(`products_${userId}`, JSON.stringify(cachedProducts))

      return offlineProduct
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

      // Modo Supabase con manejo de errores mejorado
      const supabase = createClientSupabaseClient()

      // Preparar los datos a actualizar
      const updateData: any = {}

      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.price !== undefined) updateData.price = updates.price
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity
      if (updates.storeId !== undefined) updateData.store_id = updates.storeId
      if (updates.image !== undefined) updateData.image = updates.image

      // Crear un timeout manual
      const timeoutPromise = new Promise<{ data: any; error: Error }>((_, reject) => {
        setTimeout(() => {
          reject(new Error("La actualización del producto ha excedido el tiempo límite"))
        }, 5000) // 5 segundos de timeout
      })

      // Actualizar el producto con timeout
      const updatePromise = supabase
        .from("products")
        .update(updateData)
        .eq("id", productId)
        .eq("user_id", userId)
        .select()
        .single()

      const { data, error } = await Promise.race([updatePromise, timeoutPromise])

      if (error) {
        console.error("Error al actualizar producto en Supabase:", error)

        // Actualizar en caché local
        const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
        const updatedCachedProducts = cachedProducts.map((product: any) => {
          if (product.id === productId) {
            return {
              ...product,
              ...updates,
              storeId: updates.storeId || product.storeId,
              pendingSync: true,
            }
          }
          return product
        })
        localStorage.setItem(`products_${userId}`, JSON.stringify(updatedCachedProducts))

        // Guardar para sincronización posterior
        const pendingUpdates = JSON.parse(localStorage.getItem(`pending_updates_${userId}`) || "[]")
        pendingUpdates.push({
          id: productId,
          updates,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(`pending_updates_${userId}`, JSON.stringify(pendingUpdates))

        // Devolver el producto actualizado desde caché
        const updatedProduct = updatedCachedProducts.find((p: any) => p.id === productId)
        if (updatedProduct) {
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

        throw new Error("Error al actualizar producto: " + error.message)
      }

      const updatedProduct = {
        id: data.id,
        title: data.title,
        price: Number.parseFloat(data.price),
        quantity: data.quantity,
        image: data.image,
        storeId: data.store_id,
        isEditing: false,
      }

      // Actualizar en caché local
      const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
      const updatedCachedProducts = cachedProducts.map((product: any) => {
        if (product.id === productId) {
          return updatedProduct
        }
        return product
      })
      localStorage.setItem(`products_${userId}`, JSON.stringify(updatedCachedProducts))

      return updatedProduct
    } catch (error) {
      console.error("Error al actualizar producto:", error)

      // Intentar actualizar solo en caché
      try {
        const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
        const updatedCachedProducts = cachedProducts.map((product: any) => {
          if (product.id === productId) {
            const updatedProduct = { ...product }
            if (updates.title !== undefined) updatedProduct.title = updates.title
            if (updates.price !== undefined) updatedProduct.price = updates.price
            if (updates.quantity !== undefined) updatedProduct.quantity = updates.quantity
            if (updates.storeId !== undefined) updatedProduct.storeId = updates.storeId
            if (updates.image !== undefined) updatedProduct.image = updates.image
            updatedProduct.pendingSync = true
            return updatedProduct
          }
          return product
        })
        localStorage.setItem(`products_${userId}`, JSON.stringify(updatedCachedProducts))

        // Guardar para sincronización posterior
        const pendingUpdates = JSON.parse(localStorage.getItem(`pending_updates_${userId}`) || "[]")
        pendingUpdates.push({
          id: productId,
          updates,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(`pending_updates_${userId}`, JSON.stringify(pendingUpdates))

        // Devolver el producto actualizado desde caché
        const updatedProduct = updatedCachedProducts.find((p: any) => p.id === productId)
        if (updatedProduct) {
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
      } catch (cacheError) {
        console.error("Error al actualizar producto en caché:", cacheError)
      }

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

      // Modo Supabase con manejo de errores mejorado
      const supabase = createClientSupabaseClient()

      // Eliminar primero de la caché local para mejorar la experiencia del usuario
      const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
      const filteredProducts = cachedProducts.filter((product: any) => product.id !== productId)
      localStorage.setItem(`products_${userId}`, JSON.stringify(filteredProducts))

      // Crear un timeout manual
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
        setTimeout(() => {
          reject(new Error("La eliminación del producto ha excedido el tiempo límite"))
        }, 5000) // 5 segundos de timeout
      })

      // Eliminar el producto con timeout
      const deletePromise = supabase.from("products").delete().eq("id", productId).eq("user_id", userId)

      const { error } = await Promise.race([deletePromise, timeoutPromise])

      if (error) {
        console.error("Error al eliminar producto en Supabase:", error)

        // Guardar para sincronización posterior
        const pendingDeletes = JSON.parse(localStorage.getItem(`pending_deletes_${userId}`) || "[]")
        pendingDeletes.push({
          id: productId,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(`pending_deletes_${userId}`, JSON.stringify(pendingDeletes))

        // Ya eliminamos de la caché, así que devolvemos true
        return true
      }

      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)

      // Intentar eliminar solo de la caché
      try {
        const cachedProducts = JSON.parse(localStorage.getItem(`products_${userId}`) || "[]")
        const filteredProducts = cachedProducts.filter((product: any) => product.id !== productId)
        localStorage.setItem(`products_${userId}`, JSON.stringify(filteredProducts))

        // Guardar para sincronización posterior
        const pendingDeletes = JSON.parse(localStorage.getItem(`pending_deletes_${userId}`) || "[]")
        pendingDeletes.push({
          id: productId,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(`pending_deletes_${userId}`, JSON.stringify(pendingDeletes))

        return true
      } catch (cacheError) {
        console.error("Error al eliminar producto de caché:", cacheError)
      }

      throw error
    }
  },

  // Sincronizar productos pendientes
  syncPendingProducts: async (userId: string): Promise<void> => {
    if (isLocalMode() || !navigator.onLine) return

    try {
      console.log("Sincronizando productos pendientes...")
      const supabase = createClientSupabaseClient()

      // Sincronizar productos nuevos
      const pendingProducts = JSON.parse(localStorage.getItem(`pending_products_${userId}`) || "[]")
      if (pendingProducts.length > 0) {
        for (const product of pendingProducts) {
          if (product.id.startsWith("offline_")) {
            try {
              const { data, error } = await supabase
                .from("products")
                .insert({
                  title: product.title,
                  price: product.price,
                  quantity: product.quantity,
                  image: product.image,
                  store_id: product.storeId,
                  user_id: userId,
                  created_at: product.createdAt,
                })
                .select("*")
                .single()

              if (!error && data) {
                console.log("Producto sincronizado correctamente:", data)
              }
            } catch (e) {
              console.error("Error al sincronizar producto:", e)
            }
          }
        }
        localStorage.removeItem(`pending_products_${userId}`)
      }

      // Sincronizar actualizaciones
      const pendingUpdates = JSON.parse(localStorage.getItem(`pending_updates_${userId}`) || "[]")
      if (pendingUpdates.length > 0) {
        for (const update of pendingUpdates) {
          try {
            const updateData: any = {}
            if (update.updates.title !== undefined) updateData.title = update.updates.title
            if (update.updates.price !== undefined) updateData.price = update.updates.price
            if (update.updates.quantity !== undefined) updateData.quantity = update.updates.quantity
            if (update.updates.storeId !== undefined) updateData.store_id = update.updates.storeId
            if (update.updates.image !== undefined) updateData.image = update.updates.image

            await supabase.from("products").update(updateData).eq("id", update.id).eq("user_id", userId)
          } catch (e) {
            console.error("Error al sincronizar actualización:", e)
          }
        }
        localStorage.removeItem(`pending_updates_${userId}`)
      }

      // Sincronizar eliminaciones
      const pendingDeletes = JSON.parse(localStorage.getItem(`pending_deletes_${userId}`) || "[]")
      if (pendingDeletes.length > 0) {
        for (const deleteItem of pendingDeletes) {
          try {
            await supabase.from("products").delete().eq("id", deleteItem.id).eq("user_id", userId)
          } catch (e) {
            console.error("Error al sincronizar eliminación:", e)
          }
        }
        localStorage.removeItem(`pending_deletes_${userId}`)
      }

      console.log("Sincronización completada")
    } catch (error) {
      console.error("Error al sincronizar productos pendientes:", error)
    }
  },
}
