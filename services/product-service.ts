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
        const newProduct = {
          id: Date.now().toString(),
          title: product.title,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          storeId: product.storeId,
          userId: userId,
        }

        products.push(newProduct)
        localStorage.setItem("products", JSON.stringify(products))

        return {
          id: newProduct.id,
          title: newProduct.title,
          price: Number.parseFloat(newProduct.price),
          quantity: newProduct.quantity,
          image: newProduct.image,
          storeId: newProduct.storeId,
          isEditing: false,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      console.log("Añadiendo producto a Supabase:", {
        title: product.title,
        price: product.price,
        quantity: product.quantity,
        store_id: product.storeId,
        user_id: userId,
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
        })
        .select()
        .single()

      if (error) {
        console.error("Error al añadir producto:", error)
        throw new Error("Error al añadir producto: " + error.message)
      }

      console.log("Producto añadido exitosamente:", data)

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

      // Verificar que el producto pertenece al usuario
      const { data: existingProduct, error: verifyError } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("user_id", userId)
        .single()

      if (verifyError) {
        throw new Error("Error al verificar el producto: " + verifyError.message)
      }

      // Eliminar el producto
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) {
        throw new Error("Error al eliminar producto: " + error.message)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      throw error
    }
  },
}
