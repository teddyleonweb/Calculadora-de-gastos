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

// Modificar la constante de caché para reducir el tamaño y evitar exceder la cuota
const CACHE_KEY_PREFIX = "calcuapp_products_"
const CACHE_EXPIRY = 30 * 60 * 1000 // 30 minutos en milisegundos
const MAX_CACHE_ITEMS = 100 // Limitar el número de productos en caché

// Modificar la función cacheProducts para limitar el tamaño de la caché
const cacheProducts = (userId: string, products: Product[]) => {
  if (typeof window === "undefined") return

  try {
    // Limitar el número de productos para evitar exceder la cuota
    const productsToCache = products.slice(0, MAX_CACHE_ITEMS)

    const cacheData = {
      timestamp: Date.now(),
      products: productsToCache,
    }

    // Intentar guardar en caché con manejo de errores
    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(cacheData))
      console.log(`Guardados ${productsToCache.length} productos en caché local`)
    } catch (storageError) {
      console.warn("Error al guardar en localStorage, limpiando caché antigua:", storageError)

      // Intentar limpiar caché antigua
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      }

      // Intentar guardar de nuevo con menos productos
      try {
        const reducedProducts = productsToCache.slice(0, 50)
        localStorage.setItem(
          `${CACHE_KEY_PREFIX}${userId}`,
          JSON.stringify({
            timestamp: Date.now(),
            products: reducedProducts,
          }),
        )
        console.log(`Guardados ${reducedProducts.length} productos en caché reducida`)
      } catch (retryError) {
        console.error("No se pudo guardar en caché incluso después de limpiar:", retryError)
      }
    }
  } catch (error) {
    console.error("Error al guardar productos en caché:", error)
  }
}

// Función para obtener productos de caché
const getCachedProducts = (userId: string): Product[] | null => {
  if (typeof window === "undefined") return null

  try {
    const cachedData = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`)
    if (!cachedData) return null

    const { timestamp, products } = JSON.parse(cachedData)

    // Verificar si la caché ha expirado
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      console.log("Caché de productos expirada")
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`)
      return null
    }

    console.log(`Recuperados ${products.length} productos de caché local`)
    return products
  } catch (error) {
    console.error("Error al recuperar productos de caché:", error)
    return null
  }
}

export const ProductService = {
  // Obtener todos los productos del usuario con optimizaciones
  getProducts: async (userId: string, storeId?: string): Promise<Product[]> => {
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

      // Primero intentar obtener productos de la caché
      const cachedProducts = getCachedProducts(userId)
      if (cachedProducts) {
        console.log("Usando productos de caché local")

        // Actualizar productos en segundo plano
        setTimeout(() => {
          ProductService.refreshProductsInBackground(userId)
        }, 100)

        return cachedProducts
      }

      // Modo Supabase con optimizaciones
      console.log("Obteniendo productos desde Supabase (sin caché disponible)")
      const supabase = createClientSupabaseClient()

      // Si se especifica una tienda y no es la tienda Total, filtrar por esa tienda
      let query = supabase.from("products").select("*").eq("user_id", userId)

      // Si se especifica una tienda específica (que no sea Total), filtrar por esa tienda
      const totalStore = await supabase.from("stores").select("id").eq("user_id", userId).eq("name", "Total").single()

      const isTotalStore = totalStore.data && storeId === totalStore.data.id

      // Solo filtrar por tienda si no es la tienda Total
      if (storeId && !isTotalStore) {
        console.log(`Filtrando productos por tienda: ${storeId}`)
        query = query.eq("store_id", storeId)
      }

      // Continuar con el resto de la consulta
      query = query.order("created_at", { ascending: false })

      // Primero, obtener solo el conteo para saber cuántos productos hay
      const { count, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      if (countError) {
        console.error("Error al contar productos:", countError)
        throw new Error("Error al obtener productos: " + countError.message)
      }

      console.log(`Total de productos a cargar: ${count || 0}`)

      // Si hay muchos productos, usar paginación
      const PAGE_SIZE = 50
      let allProducts: any[] = []

      if (!count || count === 0) {
        console.log("No hay productos para cargar")
        return []
      } else if (count <= PAGE_SIZE) {
        // Si hay pocos productos, cargarlos todos de una vez
        console.log("Cargando todos los productos en una sola consulta")
        const { data, error } = await query

        if (error) {
          console.error("Error al obtener productos:", error)
          throw new Error("Error al obtener productos: " + error.message)
        }

        allProducts = data || []
      } else {
        // Si hay muchos productos, usar paginación
        console.log(`Cargando productos con paginación (tamaño de página: ${PAGE_SIZE})`)
        const totalPages = Math.ceil(count / PAGE_SIZE)

        // Cargar solo las primeras 2 páginas inicialmente para mostrar algo rápido
        const initialPages = Math.min(2, totalPages)

        for (let page = 0; page < initialPages; page++) {
          const from = page * PAGE_SIZE
          const to = from + PAGE_SIZE - 1

          console.log(`Cargando página ${page + 1}/${totalPages} (productos ${from}-${to})`)

          const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(from, to)

          if (error) {
            console.error(`Error al cargar página ${page + 1}:`, error)
            continue
          }

          allProducts = [...allProducts, ...(data || [])]
        }

        // Si hay más páginas, cargarlas en segundo plano
        if (totalPages > initialPages) {
          console.log(`Cargando ${totalPages - initialPages} páginas restantes en segundo plano...`)

          setTimeout(() => {
            ProductService.loadRemainingPages(userId, initialPages, totalPages, PAGE_SIZE)
          }, 100)
        }
      }

      // Mapear productos y guardar en caché
      const mappedProducts = allProducts.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number.parseFloat(product.price),
        quantity: product.quantity,
        image: product.image,
        storeId: product.store_id,
        isEditing: false,
        createdAt: product.created_at || null,
      }))

      // Guardar en caché
      cacheProducts(userId, mappedProducts)

      return mappedProducts
    } catch (error) {
      console.error("Error al obtener productos:", error)

      // Si hay un error, intentar usar la caché aunque esté expirada
      const cachedProducts = getCachedProducts(userId)
      if (cachedProducts) {
        console.log("Usando productos de caché local (después de error)")
        return cachedProducts
      }

      throw error
    }
  },

  // Método para cargar páginas restantes en segundo plano
  loadRemainingPages: async (userId: string, startPage: number, totalPages: number, pageSize: number) => {
    try {
      const supabase = createClientSupabaseClient()
      let additionalProducts: any[] = []

      for (let page = startPage; page < totalPages; page++) {
        const from = page * pageSize
        const to = from + pageSize - 1

        console.log(`Cargando página adicional ${page + 1}/${totalPages} en segundo plano`)

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to)

        if (error) {
          console.error(`Error al cargar página adicional ${page + 1}:`, error)
          continue
        }

        additionalProducts = [...additionalProducts, ...(data || [])]
      }

      // Si se cargaron productos adicionales, actualizar la caché
      if (additionalProducts.length > 0) {
        const cachedProducts = getCachedProducts(userId) || []

        // Mapear nuevos productos
        const newProducts = additionalProducts.map((product) => ({
          id: product.id,
          title: product.title,
          price: Number.parseFloat(product.price),
          quantity: product.quantity,
          image: product.image,
          storeId: product.store_id,
          isEditing: false,
          createdAt: product.created_at || null,
        }))

        // Combinar con productos existentes, evitando duplicados
        const existingIds = new Set(cachedProducts.map((p) => p.id))
        const uniqueNewProducts = newProducts.filter((p) => !existingIds.has(p.id))

        const updatedProducts = [...cachedProducts, ...uniqueNewProducts]

        // Actualizar caché
        cacheProducts(userId, updatedProducts)

        console.log(`Caché actualizada con ${uniqueNewProducts.length} productos adicionales`)

        // Emitir evento para notificar que hay productos adicionales
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("productsUpdated", {
              detail: { products: updatedProducts },
            }),
          )
        }
      }
    } catch (error) {
      console.error("Error al cargar páginas adicionales:", error)
    }
  },

  // Método para actualizar productos en segundo plano
  refreshProductsInBackground: async (userId: string) => {
    try {
      console.log("Actualizando productos en segundo plano...")
      const supabase = createClientSupabaseClient()

      // Obtener productos más recientes primero (limitado a 100 para evitar timeouts)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error al actualizar productos en segundo plano:", error)
        return
      }

      if (!data || data.length === 0) {
        console.log("No hay productos nuevos para actualizar")
        return
      }

      // Mapear productos
      const refreshedProducts = data.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number.parseFloat(product.price),
        quantity: product.quantity,
        image: product.image,
        storeId: product.store_id,
        isEditing: false,
        createdAt: product.created_at || null,
      }))

      // Obtener productos en caché
      const cachedProducts = getCachedProducts(userId) || []

      // Crear un mapa de productos por ID para facilitar la actualización
      const productMap = new Map()
      cachedProducts.forEach((p) => productMap.set(p.id, p))

      // Actualizar productos existentes y añadir nuevos
      refreshedProducts.forEach((p) => {
        productMap.set(p.id, p)
      })

      // Convertir el mapa de vuelta a array
      const updatedProducts = Array.from(productMap.values())

      // Actualizar caché
      cacheProducts(userId, updatedProducts)

      console.log(`Caché actualizada con ${refreshedProducts.length} productos recientes`)

      // Emitir evento para notificar que hay productos actualizados
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("productsUpdated", {
            detail: { products: updatedProducts },
          }),
        )
      }
    } catch (error) {
      console.error("Error al actualizar productos en segundo plano:", error)
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
          createdAt: createdAt, // Añadir fecha actual
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

      // Actualizar la caché local
      const cachedProducts = getCachedProducts(userId) || []
      cacheProducts(userId, [newProduct, ...cachedProducts])

      return newProduct
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

      const updatedProduct = {
        id: data.id,
        title: data.title,
        price: Number.parseFloat(data.price),
        quantity: data.quantity,
        image: data.image,
        storeId: data.store_id,
        isEditing: false,
      }

      // Actualizar la caché local
      const cachedProducts = getCachedProducts(userId)
      if (cachedProducts) {
        const updatedCache = cachedProducts.map((p) => (p.id === productId ? updatedProduct : p))
        cacheProducts(userId, updatedCache)
      }

      return updatedProduct
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

            // Actualizar la caché local
            const cachedProducts = getCachedProducts(userId)
            if (cachedProducts) {
              const updatedCache = cachedProducts.filter((p) => p.id !== productId)
              cacheProducts(userId, updatedCache)
            }
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
