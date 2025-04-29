import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Store } from "../types"

export const StoreService = {
  // Obtener todas las tiendas del usuario
  getStores: async (userId: string): Promise<Store[]> => {
    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true })

      if (error) {
        throw new Error("Error al obtener tiendas: " + error.message)
      }

      return data.map((store) => ({
        id: store.id,
        name: store.name,
        isDefault: store.is_default,
      }))
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      throw error
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string): Promise<Store> => {
    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase
        .from("stores")
        .insert({
          name,
          user_id: userId,
          is_default: false,
        })
        .select()
        .single()

      if (error) {
        throw new Error("Error al añadir tienda: " + error.message)
      }

      return {
        id: data.id,
        name: data.name,
        isDefault: data.is_default,
      }
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  // Eliminar una tienda
  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      const supabase = createClientSupabaseClient()

      // Verificar que la tienda pertenece al usuario y no es la tienda por defecto
      const { data: store, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .eq("user_id", userId)
        .single()

      if (storeError) {
        throw new Error("Error al verificar la tienda: " + storeError.message)
      }

      if (store.is_default) {
        throw new Error("No se puede eliminar la tienda por defecto")
      }

      // Buscar una tienda alternativa para mover los productos
      const { data: alternativeStores, error: altError } = await supabase
        .from("stores")
        .select("id")
        .eq("user_id", userId)
        .neq("id", storeId)
        .limit(1)

      if (altError) {
        throw new Error("Error al buscar tienda alternativa: " + altError.message)
      }

      const alternativeStoreId = alternativeStores[0]?.id

      if (alternativeStoreId) {
        // Mover los productos a la tienda alternativa
        const { error: updateError } = await supabase
          .from("products")
          .update({ store_id: alternativeStoreId })
          .eq("store_id", storeId)
          .eq("user_id", userId)

        if (updateError) {
          throw new Error("Error al mover productos: " + updateError.message)
        }
      }

      // Eliminar la tienda
      const { error: deleteError } = await supabase.from("stores").delete().eq("id", storeId)

      if (deleteError) {
        throw new Error("Error al eliminar tienda: " + deleteError.message)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      throw error
    }
  },
}
