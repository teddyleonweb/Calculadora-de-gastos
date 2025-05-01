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
  private broadcastChannel: BroadcastChannel | null = null

  // Patrón Singleton para asegurar una única instancia
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  constructor() {
    // Inicializar el canal de broadcast para comunicación entre pestañas
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel("supabase_sync")
        console.log("Canal de broadcast inicializado correctamente")
      } catch (error) {
        console.error("Error al inicializar canal de broadcast:", error)
      }
    }
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

    try {
      // Suscribirse a inserciones de productos
      const channel = this.supabase
        .channel(`products_changes_${subscriptionKey}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "products",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Evento de productos detectado:", payload.eventType, payload)

            if (payload.eventType === "INSERT") {
              console.log("Nuevo producto detectado en tiempo real:", payload.new)
              if (payload.new) {
                const newProduct = this.mapDatabaseProductToProduct(payload.new)
                console.log("Producto mapeado para la interfaz:", newProduct)
                onAdd(newProduct)
              } else {
                console.error("Payload de inserción inválido:", payload)
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Producto actualizado detectado:", payload.new)
              if (payload.new) {
                const updatedProduct = this.mapDatabaseProductToProduct(payload.new)
                onUpdate(updatedProduct)
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Producto eliminado detectado:", payload.old)
              if (payload.old && payload.old.id) {
                console.log("Llamando al callback de eliminación con ID:", payload.old.id)
                onDelete(payload.old.id)
              } else {
                console.error("Payload de eliminación inválido:", payload)
              }
            }
          },
        )
        .subscribe((status) => {
          console.log(`Estado de suscripción a cambios de productos: ${status}`)
        })

      // Función para cancelar todas las suscripciones
      const unsubscribe = () => {
        console.log("Cancelando suscripción a productos para el usuario:", userId)
        channel.unsubscribe()
        delete this.productSubscriptions[subscriptionKey]
      }

      // Guardar la función de cancelación
      this.productSubscriptions[subscriptionKey] = unsubscribe

      return unsubscribe
    } catch (error) {
      console.error("Error al suscribirse a cambios de productos:", error)
      return () => {} // Devolver una función vacía en caso de error
    }
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

    try {
      // Suscribirse a todos los cambios de tiendas en un solo canal
      const channel = this.supabase
        .channel(`stores_changes_${subscriptionKey}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "stores",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Evento de tiendas detectado:", payload.eventType, payload)

            if (payload.eventType === "INSERT") {
              console.log("Nueva tienda detectada:", payload.new)
              if (payload.new) {
                const newStore = this.mapDatabaseStoreToStore(payload.new)
                onAdd(newStore)
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Tienda actualizada detectada:", payload.new)
              if (payload.new) {
                const updatedStore = this.mapDatabaseStoreToStore(payload.new)
                onUpdate(updatedStore)
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Tienda eliminada detectada:", payload.old)
              if (payload.old && payload.old.id) {
                onDelete(payload.old.id)
              }
            }
          },
        )
        .subscribe((status) => {
          console.log(`Estado de suscripción a cambios de tiendas: ${status}`)
        })

      // Función para cancelar todas las suscripciones
      const unsubscribe = () => {
        console.log("Cancelando suscripción a tiendas para el usuario:", userId)
        channel.unsubscribe()
        delete this.storeSubscriptions[subscriptionKey]
      }

      // Guardar la función de cancelación
      this.storeSubscriptions[subscriptionKey] = unsubscribe

      return unsubscribe
    } catch (error) {
      console.error("Error al suscribirse a cambios de tiendas:", error)
      return () => {} // Devolver una función vacía en caso de error
    }
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
