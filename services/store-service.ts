import { createClientSupabaseClient } from "../lib/supabase/client"
import type { Store } from "../types"

// Modificar la función deleteStore para eliminar también la imagen asociada

// Importar la función para extraer la ruta del archivo de una URL
import { extractFilePathFromUrl } from "../lib/supabase/storage-helper"

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
        .timeout(30000) // Añadir timeout de 30 segundos

      if (error) {
        throw new Error("Error al obtener tiendas: " + error.message)
      }

      console.log(
        "Tiendas obtenidas de Supabase:",
        data.map((store) => ({
          id: store.id,
          name: store.name,
          hasImage: !!store.image,
          imageUrl: store.image,
        })),
      )

      return data.map((store) => ({
        id: store.id,
        name: store.name,
        isDefault: store.is_default,
        image: store.image || undefined,
      }))
    } catch (error) {
      console.error("Error al obtener tiendas:", error)
      // Devolver una tienda por defecto en caso de error
      return [
        {
          id: "default_" + Date.now(),
          name: "Total",
          isDefault: true,
        },
      ]
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
        .timeout(30000) // Añadir timeout de 30 segundos

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

      // Si hay una imagen, guardarla en el storage de Supabase y obtener la URL
      if (image !== undefined) {
        console.log("Guardando imagen en Supabase Storage...")

        // Extraer el tipo de contenido y los datos base64 de la imagen
        const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

        if (!matches || matches.length !== 3) {
          throw new Error("Formato de imagen inválido")
        }

        const contentType = matches[1]
        const base64Data = matches[2]
        const imageData = Buffer.from(base64Data, "base64")

        // Generar un nombre único para la imagen
        const fileName = `store_${storeId}_${Date.now()}.${contentType.split("/")[1] || "jpg"}`

        // Configurar opciones para la carga
        const uploadOptions = {
          contentType,
          upsert: true,
          cacheControl: "3600", // 1 hora de cache
        }

        // Subir la imagen al bucket 'store-images'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("store-images")
          .upload(fileName, imageData, uploadOptions)

        if (uploadError) {
          console.error("Error al subir imagen a Supabase Storage:", uploadError)
          throw new Error("Error al subir imagen: " + uploadError.message)
        }

        // Obtener la URL pública de la imagen
        const { data: urlData } = await supabase.storage.from("store-images").getPublicUrl(fileName)

        if (!urlData || !urlData.publicUrl) {
          throw new Error("No se pudo obtener la URL de la imagen")
        }

        console.log("Imagen subida exitosamente. URL:", urlData.publicUrl)

        // Guardar la URL de la imagen en la base de datos
        updateData.image = urlData.publicUrl
      }

      // Actualizar la tienda
      const { data, error } = await supabase.from("stores").update(updateData).eq("id", storeId).select().single()

      if (error) {
        throw new Error("Error al actualizar tienda: " + error.message)
      }

      console.log("Tienda actualizada en Supabase:", {
        id: data.id,
        name: data.name,
        isDefault: data.is_default,
        image: data.image || undefined,
      })

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

        // Simular un pequeño retraso para dar tiempo a que la UI se actualice
        await new Promise((resolve) => setTimeout(resolve, 300))

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

      // Si la tienda tiene una imagen, eliminarla del storage
      if (store.image) {
        try {
          console.log("La tienda tiene una imagen asociada, intentando eliminarla:", store.image)

          // Extraer la ruta del archivo de la URL
          const filePath = extractFilePathFromUrl(store.image)

          if (filePath) {
            console.log("Ruta del archivo a eliminar:", filePath)

            // Eliminar la imagen del bucket 'store-images'
            const { error: deleteImageError } = await supabase.storage.from("store-images").remove([filePath])

            if (deleteImageError) {
              console.error("Error al eliminar la imagen de la tienda:", deleteImageError)
              // No lanzamos error para continuar con la eliminación de la tienda
            } else {
              console.log("Imagen de la tienda eliminada correctamente")
            }
          }
        } catch (imageError) {
          console.error("Error al procesar la eliminación de la imagen:", imageError)
          // No lanzamos error para continuar con la eliminación de la tienda
        }
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
