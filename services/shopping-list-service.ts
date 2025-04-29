import type { Product, Store, ShoppingList } from "../types"
import { createClientSupabaseClient } from "../lib/supabase/client"

export const ShoppingListService = {
  // Guardar una lista de compras
  saveShoppingList: async (
    userId: string,
    name: string,
    stores: Store[],
    products: Product[],
  ): Promise<ShoppingList> => {
    try {
      const supabase = createClientSupabaseClient()

      // Calcular el total
      const total = products.reduce((sum, product) => sum + product.price * product.quantity, 0)

      // 1. Insertar la lista de compras
      const { data: shoppingList, error: shoppingListError } = await supabase
        .from("shopping_lists")
        .insert({
          name,
          user_id: userId,
          total,
        })
        .select()
        .single()

      if (shoppingListError) {
        throw new Error("Error al guardar la lista: " + shoppingListError.message)
      }

      // 2. Insertar las tiendas de la lista
      const storesData = stores.map((store) => ({
        shopping_list_id: shoppingList.id,
        store_id: store.id,
        name: store.name,
      }))

      const { error: storesError } = await supabase.from("shopping_list_stores").insert(storesData)

      if (storesError) {
        throw new Error("Error al guardar las tiendas: " + storesError.message)
      }

      // 3. Insertar los productos de la lista
      const productsData = products.map((product) => ({
        shopping_list_id: shoppingList.id,
        title: product.title,
        price: product.price,
        quantity: product.quantity,
        image: product.image,
        store_id: product.storeId,
      }))

      const { error: productsError } = await supabase.from("shopping_list_products").insert(productsData)

      if (productsError) {
        throw new Error("Error al guardar los productos: " + productsError.message)
      }

      return {
        id: shoppingList.id,
        name: shoppingList.name,
        date: shoppingList.created_at,
        total,
        stores,
        products,
      }
    } catch (error) {
      console.error("Error al guardar lista de compras:", error)
      throw error
    }
  },

  // Obtener todas las listas de compras
  getShoppingLists: async (userId: string): Promise<ShoppingList[]> => {
    try {
      const supabase = createClientSupabaseClient()

      const { data: lists, error } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error("Error al obtener listas: " + error.message)
      }

      // Para cada lista, obtener el número de productos y tiendas
      const listsWithDetails = await Promise.all(
        lists.map(async (list) => {
          // Contar productos
          const { count: productCount, error: productError } = await supabase
            .from("shopping_list_products")
            .select("*", { count: "exact", head: true })
            .eq("shopping_list_id", list.id)

          if (productError) {
            throw new Error("Error al contar productos: " + productError.message)
          }

          // Contar tiendas únicas
          const { data: stores, error: storeError } = await supabase
            .from("shopping_list_stores")
            .select("store_id")
            .eq("shopping_list_id", list.id)

          if (storeError) {
            throw new Error("Error al obtener tiendas: " + storeError.message)
          }

          // Contar tiendas únicas
          const uniqueStores = new Set(stores.map((s) => s.store_id))

          return {
            id: list.id,
            name: list.name,
            date: list.created_at,
            total: Number.parseFloat(list.total),
            productCount: productCount || 0,
            storeCount: uniqueStores.size,
          }
        }),
      )

      return listsWithDetails
    } catch (error) {
      console.error("Error al obtener listas de compras:", error)
      throw error
    }
  },

  // Obtener una lista específica
  getShoppingList: async (userId: string, listId: string): Promise<ShoppingList | null> => {
    try {
      const supabase = createClientSupabaseClient()

      // Obtener la lista
      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("id", listId)
        .eq("user_id", userId)
        .single()

      if (listError) {
        if (listError.code === "PGRST116") {
          return null // No se encontró la lista
        }
        throw new Error("Error al obtener la lista: " + listError.message)
      }

      // Obtener las tiendas de la lista
      const { data: storesData, error: storesError } = await supabase
        .from("shopping_list_stores")
        .select("*")
        .eq("shopping_list_id", listId)

      if (storesError) {
        throw new Error("Error al obtener tiendas: " + storesError.message)
      }

      // Obtener los productos de la lista
      const { data: productsData, error: productsError } = await supabase
        .from("shopping_list_products")
        .select("*")
        .eq("shopping_list_id", listId)

      if (productsError) {
        throw new Error("Error al obtener productos: " + productsError.message)
      }

      // Transformar los datos
      const stores = storesData.map((store) => ({
        id: store.store_id,
        name: store.name,
      }))

      const products = productsData.map((product) => ({
        id: product.id,
        title: product.title,
        price: Number.parseFloat(product.price),
        quantity: product.quantity,
        image: product.image,
        storeId: product.store_id,
        isEditing: false,
      }))

      return {
        id: list.id,
        name: list.name,
        date: list.created_at,
        total: Number.parseFloat(list.total),
        stores,
        products,
      }
    } catch (error) {
      console.error("Error al obtener lista de compras:", error)
      throw error
    }
  },

  // Eliminar una lista
  deleteShoppingList: async (userId: string, listId: string): Promise<boolean> => {
    try {
      const supabase = createClientSupabaseClient()

      // Verificar que la lista pertenece al usuario
      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .select("id")
        .eq("id", listId)
        .eq("user_id", userId)
        .single()

      if (listError) {
        throw new Error("Error al verificar la lista: " + listError.message)
      }

      // Eliminar la lista (las tablas relacionadas se eliminarán por las restricciones ON DELETE CASCADE)
      const { error: deleteError } = await supabase.from("shopping_lists").delete().eq("id", listId)

      if (deleteError) {
        throw new Error("Error al eliminar la lista: " + deleteError.message)
      }

      return true
    } catch (error) {
      console.error("Error al eliminar lista de compras:", error)
      throw error
    }
  },

  // Cargar una lista como la lista actual
  loadShoppingList: async (userId: string, listId: string): Promise<boolean> => {
    try {
      const supabase = createClientSupabaseClient()

      // Obtener la lista completa
      const list = await ShoppingListService.getShoppingList(userId, listId)

      if (!list) {
        return false
      }

      // Obtener las tiendas actuales del usuario
      const { data: currentStores, error: storesError } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", userId)

      if (storesError) {
        throw new Error("Error al obtener tiendas: " + storesError.message)
      }

      // Mapeo de IDs de tiendas de la lista a tiendas actuales
      const storeIdMap = new Map()

      // Para cada tienda en la lista, buscar o crear la tienda correspondiente
      for (const listStore of list.stores) {
        // Buscar si ya existe una tienda con el mismo nombre
        const existingStore = currentStores.find((s) => s.name === listStore.name)

        if (existingStore) {
          storeIdMap.set(listStore.id, existingStore.id)
        } else {
          // Crear una nueva tienda
          const { data: newStore, error: createError } = await supabase
            .from("stores")
            .insert({
              name: listStore.name,
              user_id: userId,
              is_default: false,
            })
            .select()
            .single()

          if (createError) {
            throw new Error("Error al crear tienda: " + createError.message)
          }

          storeIdMap.set(listStore.id, newStore.id)
        }
      }

      // Añadir los productos de la lista a la lista actual
      for (const product of list.products) {
        // Obtener el ID de tienda mapeado
        const mappedStoreId = storeIdMap.get(product.storeId) || currentStores[0]?.id

        // Insertar el producto
        const { error: insertError } = await supabase.from("products").insert({
          title: product.title,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          store_id: mappedStoreId,
          user_id: userId,
        })

        if (insertError) {
          throw new Error("Error al insertar producto: " + insertError.message)
        }
      }

      return true
    } catch (error) {
      console.error("Error al cargar lista de compras:", error)
      throw error
    }
  },
}
