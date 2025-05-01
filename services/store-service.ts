import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Store } from "../types"

// Detectar si estamos en modo local (sin Supabase)
const isLocalMode = () => {
  return (
    typeof window !== "undefined" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

export const StoreService = {
  // Obtener todas las tiendas del usuario
  getStores: async (userId: string): Promise<Store[]> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para getStores")
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const userStores = stores.filter((store: any) => store.userId === userId)

        // Asegurarse de que existe la tienda "Total"
        const hasTotal = userStores.some((store: any) => store.name === "Total")
        if (!hasTotal) {
          const totalStore = {
            id: "total",
            name: "Total",
            isDefault: true,
            userId: userId,
          }
          userStores.push(totalStore)
          stores.push(totalStore)
          localStorage.setItem("stores", JSON.stringify(stores))
        }

        return userStores.map((store: any) => ({
          id: store.id,
          name: store.name,
          isDefault: store.isDefault,
          image: store.image,
        }))
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase.from("stores").select("*").eq("user_id", userId)

      if (error) {
        throw new Error("Error al obtener tiendas: " + error.message)
      }

      // Asegurarse de que existe la tienda "Total"
      const stores = data.map((store) => ({
        id: store.id,
        name: store.name,
        isDefault: store.is_default,
        image: store.image,
      }))

      const hasTotal = stores.some((store) => store.name === "Total")
      if (!hasTotal) {
        // Crear la tienda "Total" si no existe
        const { data: totalStore, error: createError } = await supabase
          .from("stores")
          .insert({
            name: "Total",
            is_default: true,
            user_id: userId,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error("Error al crear tienda Total:", createError)
        } else if (totalStore) {
          stores.push({
            id: totalStore.id,
            name: totalStore.name,
            isDefault: totalStore.is_default,
            image: totalStore.image,
          })
        }
      }

      return stores
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      throw error
    }
  },

  // Añadir una nueva tienda
  addStore: async (userId: string, name: string): Promise<Store> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para addStore")
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const newStore = {
          id: Date.now().toString(),
          name,
          isDefault: false,
          userId: userId,
        }

        stores.push(newStore)
        localStorage.setItem("stores", JSON.stringify(stores))

        return {
          id: newStore.id,
          name: newStore.name,
          isDefault: newStore.isDefault,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase
        .from("stores")
        .insert({
          name,
          is_default: false,
          user_id: userId,
          updated_at: new Date().toISOString(), // Asegurar que updated_at se establece
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
        image: data.image,
      }
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      throw error
    }
  },

  // Actualizar una tienda
  updateStore: async (userId: string, storeId: string, name: string, image?: string): Promise<Store> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para updateStore")
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const storeIndex = stores.findIndex((s: any) => s.id === storeId && s.userId === userId)

        if (storeIndex === -1) {
          throw new Error("Tienda no encontrada")
        }

        // Actualizar la tienda
        stores[storeIndex].name = name
        if (image) {
          stores[storeIndex].image = image
        }

        localStorage.setItem("stores", JSON.stringify(stores))

        return {
          id: stores[storeIndex].id,
          name: stores[storeIndex].name,
          isDefault: stores[storeIndex].isDefault,
          image: stores[storeIndex].image,
        }
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Verificar que la tienda pertenece al usuario
      const { data: existingStore, error: verifyError } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .eq("user_id", userId)
        .single()

      if (verifyError) {
        throw new Error("Error al verificar la tienda: " + verifyError.message)
      }

      // Preparar los datos a actualizar
      const updateData: any = {
        name,
        updated_at: new Date().toISOString(), // Asegurar que updated_at se actualiza
      }

      if (image !== undefined) {
        updateData.image = image
      }

      // Actualizar la tienda
      const { data, error } = await supabase.from("stores").update(updateData).eq("id", storeId).select().single()

      if (error) {
        throw new Error("Error al actualizar tienda: " + error.message)
      }

      return {
        id: data.id,
        name: data.name,
        isDefault: data.is_default,
        image: data.image,
      }
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      throw error
    }
  },

  // Eliminar una tienda
  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      // No permitir eliminar la tienda "Total"
      const stores = await StoreService.getStores(userId)
      const totalStore = stores.find((store) => store.name === "Total")
      if (storeId === totalStore?.id) {
        throw new Error("No se puede eliminar la tienda Total")
      }

      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para deleteStore")
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const storeIndex = stores.findIndex((s: any) => s.id === storeId && s.userId === userId)

        if (storeIndex === -1) {
          throw new Error("Tienda no encontrada")
        }

        // Eliminar la tienda
        stores.splice(storeIndex, 1)
        localStorage.setItem("stores", JSON.stringify(stores))

        return true
      }

      // Modo Supabase
      const supabase = createClientSupabaseClient()

      // Verificar que la tienda pertenece al usuario
      const { data: existingStore, error: verifyError } = await supabase
        .from("stores")
        .select("id")
        .eq("id", storeId)
        .eq("user_id", userId)
        .single()

      if (verifyError) {
        throw new Error("Error al verificar la tienda: " + verifyError.message)
      }

      // Eliminar la tienda
      const { error } = await supabase.from("stores").delete().eq("id", storeId)

      if (error) {
        throw new Error("Error al eliminar tienda: " + error.message)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      throw error
    }
  },
}
