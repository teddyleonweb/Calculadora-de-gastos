import { createClient } from "@supabase/supabase-js"
import type { Product } from "../types"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const ProductService = {
  getProducts: async (userId: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Asegurarse de que todos los productos tengan una fecha de creación
      return (data || []).map((product) => ({
        ...product,
        createdAt: product.createdAt || product.created_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error("Error al obtener productos:", error)
      return []
    }
  },

  addProduct: async (userId: string, product: Omit<Product, "id" | "isEditing">): Promise<Product> => {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([{ ...product, user_id: userId }])
        .select()

      if (error) {
        throw error
      }

      return data[0]
    } catch (error) {
      console.error("Error al añadir producto:", error)
      throw error
    }
  },

  updateProduct: async (userId: string, productId: string, updates: Partial<Product>): Promise<Product> => {
    try {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId)
        .eq("user_id", userId)
        .select()

      if (error) {
        throw error
      }

      return data[0]
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      throw error
    }
  },

  deleteProduct: async (userId: string, productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId).eq("user_id", userId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      return false
    }
  },
}
