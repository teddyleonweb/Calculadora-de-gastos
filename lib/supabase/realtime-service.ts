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
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnected = false

  // Patrón Singleton para asegurar una única instancia
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  constructor() {
    // Iniciar el heartbeat para mantener la conexión activa
    this.startHeartbeat()

    // Verificar la conexión inicial
    this.checkConnection()
  }

  // Verificar la conexión a Supabase
  private async checkConnection() {
    try {
      const { data, error } = await this.supabase.from("products").select("count").limit(1)

      if (error) {
        console.error("Error de conexión a Supabase:", error)
        this.isConnected = false
        this.scheduleReconnect()
      } else {
        console.log("Conexión a Supabase verificada correctamente")
        this.isConnected = true
      }
    } catch (error) {
      console.error("Error al verificar conexión:", error)
      this.isConnected = false
      this.scheduleReconnect()
    }
  }

  // Programar un intento de reconexión
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log("Intentando reconectar a Supabase...")
      this.checkConnection()
    }, 5000) // Intentar reconectar cada 5 segundos
  }

  // Iniciar el heartbeat para mantener la conexión activa
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (typeof window !== "undefined") {
        console.log("Enviando heartbeat a Supabase Realtime...")

        // Verificar la conexión
        this.checkConnection()

        // Enviar un ping a través de un canal temporal
        const pingChannel = this.supabase.channel(`ping-${Date.now()}`)
        pingChannel.subscribe((status) => {
          console.log(`Estado del ping: ${status}`)
          if (status === "SUBSCRIBED") {
            console.log("Ping exitoso")
            // Desuscribirse después de un ping exitoso
            setTimeout(() => pingChannel.unsubscribe(), 1000)
          }
        })
      }
    }, 30000) // Cada 30 segundos
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

                // Usar setTimeout para asegurar que el callback se ejecute fuera del ciclo actual
                setTimeout(() => {
                  try {
                    onAdd(newProduct)
                  } catch (error) {
                    console.error("Error en callback onAdd:", error)
                  }
                }, 0)
              } else {
                console.error("Payload de inserción inválido:", payload)
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Producto actualizado detectado:", payload.new)
              if (payload.new) {
                const updatedProduct = this.mapDatabaseProductToProduct(payload.new)

                // Usar setTimeout para asegurar que el callback se ejecute fuera del ciclo actual
                setTimeout(() => {
                  try {
                    onUpdate(updatedProduct)
                  } catch (error) {
                    console.error("Error en callback onUpdate:", error)
                  }
                }, 0)
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Producto eliminado detectado:", payload.old)
              if (payload.old && payload.old.id) {
                console.log("Llamando al callback de eliminación con ID:", payload.old.id)

                // Usar setTimeout para asegurar que el callback se ejecute fuera del ciclo actual
                setTimeout(() => {
                  try {
                    onDelete(payload.old.id)
                  } catch (error) {
                    console.error("Error en callback onDelete:", error)
                  }
                }, 0)
              } else {
                console.error("Payload de eliminación inválido:", payload)
              }
            }
          },
        )
        .subscribe((status) => {
          console.log(`Estado de suscripción a cambios de productos: ${status}`)

          // Si la suscripción falla, intentar reconectar
          if (status === "CHANNEL_ERROR") {
            console.error("Error en el canal de productos, intentando reconectar...")

            // Esperar un momento y reintentar
            setTimeout(() => {
              channel.unsubscribe()
              this.subscribeToProducts(userId, onAdd, onUpdate, onDelete)
            }, 5000)
          }
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

                // Usar setTimeout para asegurar que el callback se ejecute fuera del ciclo actual
                setTimeout(() => {
                  try {
                    onAdd(newStore)
                  } catch (error) {
                    console.error("Error en callback onAdd para tiendas:", error)
                  }
                }, 0)
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Tienda actualizada detectada:", payload.new)
              if (payload.new) {
                const updatedStore = this.mapDatabaseStoreToStore(payload.new)

                // Usar setTimeout para asegurar que el callback se ejecute fuera del ciclo actual
                setTimeout(() => {
                  try {
                    onUpdate(updatedStore)
                  } catch (error) {
                    console.error("Error en callback onUpdate para tiendas:", error)
                  }
                }, 0)
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Tienda eliminada detectada:", payload.old)
              if (payload.old && payload.old.id) {
                // Usar setTimeout para asegurar que el callback se ejecute fuera del ciclo actual
                setTimeout(() => {
                  try {
                    onDelete(payload.old.id)
                  } catch (error) {
                    console.error("Error en callback onDelete para tiendas:", error)
                  }
                }, 0)
              }
            }
          },
        )
        .subscribe((status) => {
          console.log(`Estado de suscripción a cambios de tiendas: ${status}`)

          // Si la suscripción falla, intentar reconectar
          if (status === "CHANNEL_ERROR") {
            console.error("Error en el canal de tiendas, intentando reconectar...")

            // Esperar un momento y reintentar
            setTimeout(() => {
              channel.unsubscribe()
              this.subscribeToStores(userId, onAdd, onUpdate, onDelete)
            }, 5000)
          }
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

    // Detener el heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Detener la reconexión programada
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
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
