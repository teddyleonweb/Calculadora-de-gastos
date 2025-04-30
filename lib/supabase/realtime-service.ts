import { createClientSupabaseClient } from "./client"
import type { Product, Store } from "../types"

// Tipo para las funciones de callback
type ProductCallback = (product: Product) => void
type StoreCallback = (store: Store) => void
type DeleteCallback = (id: string) => void

// Clase para gestionar las suscripciones en tiempo real
export class RealtimeService {
  private static instance: RealtimeService
  private supabase = createClientSupabaseClient()
  private productSubscriptions: { [key: string]: () => void } = {}
  private storeSubscriptions: { [key: string]: () => void } = {}

  // Patrón Singleton para asegurar una única instancia
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  // Suscribirse a cambios en productos para un usuario específico
  public subscribeToProducts(
    userId: string,
    onAdd: ProductCallback,
    onUpdate: ProductCallback,
    onDelete: DeleteCallback,
  ): () => void {
    console.log("Iniciando suscripción a productos para el usuario:", userId)

    // Crear una clave única para esta suscripción
    const subscriptionKey = `products_${userId}_${Date.now()}`

    // Suscribirse a inserciones de productos
    const insertSubscription = this.supabase
      .channel(`products_insert_${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Nuevo producto detectado:", payload.new)
          const newProduct = this.mapDatabaseProductToProduct(payload.new)
          onAdd(newProduct)
        },
      )
      .subscribe((status) => {
        console.log(`Estado de suscripción a inserciones de productos: ${status}`)
      })

    // Suscribirse a actualizaciones de productos
    const updateSubscription = this.supabase
      .channel(`products_update_${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Producto actualizado detectado:", payload.new)
          const updatedProduct = this.mapDatabaseProductToProduct(payload.new)
          onUpdate(updatedProduct)
        },
      )
      .subscribe()

    // Suscribirse a eliminaciones de productos
    const deleteSubscription = this.supabase
      .channel(`products_delete_${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Producto eliminado detectado:", payload.old)
          if (payload.old && payload.old.id) {
            console.log("Llamando al callback de eliminación con ID:", payload.old.id)
            onDelete(payload.old.id)
          } else {
            console.error("Payload de eliminación inválido:", payload)
          }
        },
      )
      .subscribe((status) => {
        console.log(`Estado de suscripción a eliminaciones de productos: ${status}`)
      })

    // Función para cancelar todas las suscripciones
    const unsubscribe = () => {
      console.log("Cancelando suscripción a productos para el usuario:", userId)
      this.supabase.channel(`products_insert_${subscriptionKey}`).unsubscribe()
      this.supabase.channel(`products_update_${subscriptionKey}`).unsubscribe()
      this.supabase.channel(`products_delete_${subscriptionKey}`).unsubscribe()
      delete this.productSubscriptions[subscriptionKey]
    }

    // Guardar la función de cancelación
    this.productSubscriptions[subscriptionKey] = unsubscribe

    return unsubscribe
  }

  // Suscribirse a cambios en tiendas para un usuario específico
  public subscribeToStores(
    userId: string,
    onAdd: StoreCallback,
    onUpdate: StoreCallback,
    onDelete: DeleteCallback,
  ): () => void {
    console.log("Iniciando suscripción a tiendas para el usuario:", userId)

    // Crear una clave única para esta suscripción
    const subscriptionKey = `stores_${userId}_${Date.now()}`

    // Suscribirse a inserciones de tiendas
    const insertSubscription = this.supabase
      .channel(`stores_insert_${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Nueva tienda detectada:", payload.new)
          const newStore = this.mapDatabaseStoreToStore(payload.new)
          onAdd(newStore)
        },
      )
      .subscribe()

    // Suscribirse a actualizaciones de tiendas
    const updateSubscription = this.supabase
      .channel(`stores_update_${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Tienda actualizada detectada:", payload.new)
          const updatedStore = this.mapDatabaseStoreToStore(payload.new)
          onUpdate(updatedStore)
        },
      )
      .subscribe()

    // Suscribirse a eliminaciones de tiendas
    const deleteSubscription = this.supabase
      .channel(`stores_delete_${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Tienda eliminada detectada:", payload.old.id)
          onDelete(payload.old.id)
        },
      )
      .subscribe()

    // Función para cancelar todas las suscripciones
    const unsubscribe = () => {
      console.log("Cancelando suscripción a tiendas para el usuario:", userId)
      this.supabase.channel(`stores_insert_${subscriptionKey}`).unsubscribe()
      this.supabase.channel(`stores_update_${subscriptionKey}`).unsubscribe()
      this.supabase.channel(`stores_delete_${subscriptionKey}`).unsubscribe()
      delete this.storeSubscriptions[subscriptionKey]
    }

    // Guardar la función de cancelación
    this.storeSubscriptions[subscriptionKey] = unsubscribe

    return unsubscribe
  }

  // Cancelar todas las suscripciones
  public unsubscribeAll(): void {
    console.log("Cancelando todas las suscripciones")

    // Cancelar suscripciones de productos
    Object.values(this.productSubscriptions).forEach((unsubscribe) => unsubscribe())
    this.productSubscriptions = {}

    // Cancelar suscripciones de tiendas
    Object.values(this.storeSubscriptions).forEach((unsubscribe) => unsubscribe())
    this.storeSubscriptions = {}
  }

  // Mapear un producto de la base de datos al formato de la aplicación
  private mapDatabaseProductToProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      title: dbProduct.title,
      price: Number.parseFloat(dbProduct.price),
      quantity: dbProduct.quantity,
      image: dbProduct.image,
      storeId: dbProduct.store_id,
      isEditing: false,
    }
  }

  // Mapear una tienda de la base de datos al formato de la aplicación
  private mapDatabaseStoreToStore(dbStore: any): Store {
    return {
      id: dbStore.id,
      name: dbStore.name,
      isDefault: dbStore.is_default,
      image: dbStore.image || undefined,
    }
  }
}

// Exportar una instancia única del servicio
export const realtimeService = RealtimeService.getInstance()
