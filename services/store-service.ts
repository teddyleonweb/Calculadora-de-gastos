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

        // Si no hay tiendas, crear la tienda por defecto
        if (userStores.length === 0) {
          const defaultStore = {
            id: "default",
            name: "Total",
            userId: userId,
            isDefault: true,
          }
          stores.push(defaultStore)
          localStorage.setItem("stores", JSON.stringify(stores))
          userStores.push(defaultStore)
        }

        return userStores.map((store: any) => ({
          id: store.id,
          name: store.name,
          isDefault: store.isDefault,
          image: store.image || undefined,
        }))
      }

      // Modo Supabase
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
        image: store.image || undefined,
      }))
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
          userId,
          isDefault: false,
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
        image: data.image || undefined,
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
        console.log(
          "Actualizando tienda con imagen:",
          image ? "Imagen presente (longitud: " + image.length + ")" : "Sin imagen",
        )

        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const storeIndex = stores.findIndex((store: any) => store.id === storeId && store.userId === userId)

        if (storeIndex === -1) {
          throw new Error("Tienda no encontrada")
        }

        // Actualizar la tienda
        const updatedStore = { ...stores[storeIndex] }
        updatedStore.name = name

        // Asegurarse de que la imagen se guarde correctamente
        if (image !== undefined) {
          console.log("Guardando imagen en la tienda:", storeId)
          updatedStore.image = image
        }

        stores[storeIndex] = updatedStore
        localStorage.setItem("stores", JSON.stringify(stores))

        console.log(
          "Tienda actualizada:",
          updatedStore.id,
          updatedStore.name,
          updatedStore.image ? "Con imagen (longitud: " + updatedStore.image.length + ")" : "Sin imagen",
        )

        // Verificar que la imagen se guardó correctamente
        const storesAfterUpdate = JSON.parse(localStorage.getItem("stores") || "[]")
        const updatedStoreFromStorage = storesAfterUpdate.find((s: any) => s.id === storeId && s.userId === userId)
        console.log(
          "Verificación después de guardar:",
          updatedStoreFromStorage.image ? "Imagen guardada correctamente" : "No se guardó la imagen",
        )

        return {
          id: updatedStore.id,
          name: updatedStore.name,
          isDefault: updatedStore.isDefault,
          image: updatedStore.image,
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
      const updateData: any = { name }
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
        image: data.image || undefined,
      }
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      throw error
    }
  },

  // Eliminar una tienda
  deleteStore: async (userId: string, storeId: string): Promise<boolean> => {
    try {
      // Modo local (sin Supabase)
      if (isLocalMode()) {
        console.log("Usando modo local para deleteStore")
        const stores = JSON.parse(localStorage.getItem("stores") || "[]")
        const storeIndex = stores.findIndex((store: any) => store.id === storeId && store.userId === userId)

        if (storeIndex === -1) {
          throw new Error("Tienda no encontrada")
        }

        const store = stores[storeIndex]

        // No permitir eliminar la tienda por defecto
        if (store.isDefault) {
          throw new Error("No se puede eliminar la tienda por defecto")
        }

        // Buscar una tienda alternativa
        const alternativeStore = stores.find((s: any) => s.userId === userId && s.id !== storeId)

        // Actualizar productos
        if (alternativeStore) {
          const products = JSON.parse(localStorage.getItem("products") || "[]")
          products.forEach((product: any) => {
            if (product.storeId === storeId && product.userId === userId) {
              product.storeId = alternativeStore.id
            }
          })
          localStorage.setItem("products", JSON.stringify(products))
        }

        // Eliminar la tienda
        stores.splice(storeIndex, 1)
        localStorage.setItem("stores", JSON.stringify(stores))

        return true
      }

      // Modo Supabase
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
