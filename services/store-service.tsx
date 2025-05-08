import { createClient } from "@supabase/supabase-js"
import type { Store } from "../types"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const StoreService = {
  getStores: async (userId: string): Promise<Store[]> => {
    try {
      const { data, error } = await supabase.from("stores").select("*").eq("user_id", userId).order("name")

      if (error) {
        throw error
      }

      // Asegurarse de que siempre exista la tienda "Total"
      let stores = data || []
      const hasTotal = stores.some((store) => store.name === "Total")

      if (!hasTotal) {
        // Crear la tienda "Total" si no existe
        const { data: totalStore, error: totalError } = await supabase
          .from("stores")
          .insert([{ name: "Total", user_id: userId }])
          .select()

        if (!totalError && totalStore) {
          stores = [...totalStore, ...stores]
        }
      }

      return stores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      return []
    }
  },

  addStore: async (userId: string, name: string): Promise<Store> => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .insert([{ name, user_id: userId }])
        .select()

      if (error) {
        throw error
      }

      return data[0]
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  updateStore: async (userId: string, storeId: string, name: string, image?: string): Promise<Store> => {
    try {
      const updateData: any = { name }
      if (image !== undefined) {
        updateData.image = image
      }

      const { data, error } = await supabase
        .from("stores")
        .update(updateData)
        .eq("id", storeId)
        .eq("user_id", userId)
        .select()

      if (error) {
        throw error
      }

      return data[0]
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      throw error
    }
  },

  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("stores").delete().eq("id", storeId).eq("user_id", userId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      return false
    }
  },
}
