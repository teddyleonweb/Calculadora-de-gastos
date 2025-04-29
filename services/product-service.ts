import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Product } from "../types"

export const ProductService = {
  // Obtener todos los productos del usuario
  getProducts: async (userId: string): Promise<Product[]> => {
    try {
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
      const supabase = createClientSupabaseClient()

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
        throw new Error("Error al añadir producto: " + error.message)
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
