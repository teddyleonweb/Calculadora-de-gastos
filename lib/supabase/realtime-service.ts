import { createClientSupabaseClient } from "./client"
import type { Product, Store } from "../types"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Tipo para las funciones de callback
type ProductCallback = (product: Product) => void
type StoreCallback = (store: Store) => void
type DeleteCallback = (id: string) => void

// Clase para gestionar las suscripciones en tiempo real
export class RealtimeService {
  private static instance: RealtimeService
  private supabase = createClientSupabaseClient()
  private channels: { [key: string]: RealtimeChannel } = {}
  private broadcastChannel: RealtimeChannel | null = null
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
        this.checkConnection()
      }
    }, 30000) // Cada 30 segundos
  }

  // Configurar el canal de broadcast para sincronización entre ventanas
  public setupBroadcastChannel(userId: string) {
    if (this.broadcastChannel) {
      this.broadcastChannel.unsubscribe()
    }

    const channelName = `sync_channel_${userId}`
    console.log(`Configurando canal de broadcast: ${channelName}`)

    this.broadcastChannel = this.supabase
      .channel(channelName)
      .on("broadcast", { event: "sync_products" }, (payload) => {
        console.log("Recibido evento de sincronización de productos en el servicio:", payload)
        // Este evento se maneja en el componente Home
      })
      .on("broadcast", { event: "sync_stores" }, (payload) => {
        console.log("Recibido evento de sincronización de tiendas en el servicio:", payload)
        // Este evento se maneja en el componente Home
      })
      .subscribe((status) => {
        console.log(`Estado del canal de broadcast: ${status}`)
        if (status === "SUBSCRIBED") {
          console.log("Canal de broadcast configurado correctamente")
        } else if (status === "CHANNEL_ERROR") {
          console.error("Error en el canal de broadcast, intentando reconectar...")
          setTimeout(() => this.setupBroadcastChannel(userId), 5000)
        }
      })

    return this.broadcastChannel
  }

  // Enviar evento de sincronización de productos
  public broadcastProductSync(action: "add" | "update" | "delete", productData: any) {
    if (!this.broadcastChannel) {
      console.error("Canal de broadcast no configurado")
      return
    }

    console.log(`Enviando evento de sincronización de productos (${action}):`, productData)

    // Asegurarse de que los datos tienen el formato correcto
    const payload = {
      action,
      data: productData,
      timestamp: Date.now(), // Añadir timestamp para ayudar con el debugging
    }

    this.broadcastChannel.send({
      type: "broadcast",
      event: "sync_products",
      payload,
    })
  }

  // Enviar evento de sincronización de tiendas
  public broadcastStoreSync(action: "add" | "update" | "delete", storeData: any) {
    if (!this.broadcastChannel) {
      console.error("Canal de broadcast no configurado")
      return
    }

    console.log(`Enviando evento de sincronización de tiendas (${action}):`, storeData)
    this.broadcastChannel.send({
      type: "broadcast",
      event: "sync_stores",
      payload: {
        action,
        data: storeData,
      },
    })
  }

  // Suscribirse a cambios en productos para un usuario específico
  public subscribeToProducts(
    userId: string,
    onAdd: ProductCallback,
    onUpdate: ProductCallback,
    onDelete: DeleteCallback,
  ): () => void {
    console.log("Iniciando suscripción a productos para el usuario:", userId)

    // Crear una clave única para este canal
    const channelKey = `products_${userId}_${Date.now()}`

    try {
      // Crear un canal para los cambios en productos
      const channel = this.supabase
        .channel(channelKey)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "products",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Nuevo producto detectado:", payload)
            if (payload.new) {
              const newProduct = this.mapDatabaseProductToProduct(payload.new)
              onAdd(newProduct)

              // Enviar evento de broadcast para sincronizar otras ventanas
              this.broadcastProductSync("add", newProduct)
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "products",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Producto actualizado detectado:", payload)
            if (payload.new) {
              const updatedProduct = this.mapDatabaseProductToProduct(payload.new)
              onUpdate(updatedProduct)

              // Enviar evento de broadcast para sincronizar otras ventanas
              this.broadcastProductSync("update", updatedProduct)
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "products",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Producto eliminado detectado:", payload)
            if (payload.old && payload.old.id) {
              onDelete(payload.old.id)

              // Enviar evento de broadcast para sincronizar otras ventanas
              this.broadcastProductSync("delete", { id: payload.old.id })
            }
          },
        )
        .subscribe((status) => {
          console.log(`Estado de suscripción a productos: ${status}`)

          if (status === "SUBSCRIBED") {
            console.log("Suscripción a productos establecida correctamente")
          } else if (status === "CHANNEL_ERROR") {
            console.error("Error en el canal de productos, intentando reconectar...")

            // Esperar un momento y reintentar
            setTimeout(() => {
              channel.unsubscribe()
              this.subscribeToProducts(userId, onAdd, onUpdate, onDelete)
            }, 5000)
          }
        })

      // Guardar el canal para poder cancelar la suscripción más tarde
      this.channels[channelKey] = channel

      // Función para cancelar la suscripción
      return () => {
        console.log("Cancelando suscripción a productos para el usuario:", userId)
        if (this.channels[channelKey]) {
          this.channels[channelKey].unsubscribe()
          delete this.channels[channelKey]
        }
      }
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

    // Crear una clave única para este canal
    const channelKey = `stores_${userId}_${Date.now()}`

    try {
      // Crear un canal para los cambios en tiendas
      const channel = this.supabase
        .channel(channelKey)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "stores",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Nueva tienda detectada:", payload)
            if (payload.new) {
              const newStore = this.mapDatabaseStoreToStore(payload.new)
              onAdd(newStore)

              // Enviar evento de broadcast para sincronizar otras ventanas
              this.broadcastStoreSync("add", newStore)
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "stores",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Tienda actualizada detectada:", payload)
            if (payload.new) {
              const updatedStore = this.mapDatabaseStoreToStore(payload.new)
              onUpdate(updatedStore)

              // Enviar evento de broadcast para sincronizar otras ventanas
              this.broadcastStoreSync("update", updatedStore)
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "stores",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Tienda eliminada detectada:", payload)
            if (payload.old && payload.old.id) {
              onDelete(payload.old.id)

              // Enviar evento de broadcast para sincronizar otras ventanas
              this.broadcastStoreSync("delete", { id: payload.old.id })
            }
          },
        )
        .subscribe((status) => {
          console.log(`Estado de suscripción a tiendas: ${status}`)

          if (status === "SUBSCRIBED") {
            console.log("Suscripción a tiendas establecida correctamente")
          } else if (status === "CHANNEL_ERROR") {
            console.error("Error en el canal de tiendas, intentando reconectar...")

            // Esperar un momento y reintentar
            setTimeout(() => {
              channel.unsubscribe()
              this.subscribeToStores(userId, onAdd, onUpdate, onDelete)
            }, 5000)
          }
        })

      // Guardar el canal para poder cancelar la suscripción más tarde
      this.channels[channelKey] = channel

      // Función para cancelar la suscripción
      return () => {
        console.log("Cancelando suscripción a tiendas para el usuario:", userId)
        if (this.channels[channelKey]) {
          this.channels[channelKey].unsubscribe()
          delete this.channels[channelKey]
        }
      }
    } catch (error) {
      console.error("Error al suscribirse a cambios de tiendas:", error)
      return () => {} // Devolver una función vacía en caso de error
    }
  }

  // Cancelar todas las suscripciones
  public unsubscribeAll(): void {
    console.log("Cancelando todas las suscripciones")

    // Cancelar todos los canales
    Object.values(this.channels).forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels = {}

    // Cancelar el canal de broadcast
    if (this.broadcastChannel) {
      this.broadcastChannel.unsubscribe()
      this.broadcastChannel = null
    }

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
