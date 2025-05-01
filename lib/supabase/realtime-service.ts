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
  public async subscribeToProducts(
    userId: string,
    onAdd: ProductCallback,
    onUpdate: ProductCallback,
    onDelete: DeleteCallback,
  ): Promise<() => void> {
    console.log("Iniciando suscripción a productos para el usuario:", userId)

    // Crear una clave única para esta suscripción
    const subscriptionKey = `products_${userId}_${Date.now()}`

    try {
      // Verificar la conexión antes de suscribirse
      await this.ensureConnection()

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

                // Usar Promise.resolve para manejar asincrónicamente
                Promise.resolve().then(() => {
                  try {
                    onAdd(newProduct)
                  } catch (error) {
                    console.error("Error en callback onAdd:", error)
                  }
                })
              } else {
                console.error("Payload de inserción inválido:", payload)
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Producto actualizado detectado:", payload.new)
              if (payload.new) {
                const updatedProduct = this.mapDatabaseProductToProduct(payload.new)

                // Usar Promise.resolve para manejar asincrónicamente
                Promise.resolve().then(() => {
                  try {
                    onUpdate(updatedProduct)
                  } catch (error) {
                    console.error("Error en callback onUpdate:", error)
                  }
                })
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Producto eliminado detectado:", payload.old)
              if (payload.old && payload.old.id) {
                console.log("Llamando al callback de eliminación con ID:", payload.old.id)

                // Usar Promise.resolve para manejar asincrónicamente
                Promise.resolve().then(() => {
                  try {
                    onDelete(payload.old.id)
                  } catch (error) {
                    console.error("Error en callback onDelete:", error)
                  }
                })
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
            setTimeout(async () => {
              try {
                channel.unsubscribe()

                // Crear un nuevo canal con un nombre único
                const retryChannel = this.supabase
                  .channel(`products_retry_${Date.now()}`)
                  .on(
                    "postgres_changes",
                    {
                      event: "*",
                      schema: "public",
                      table: "products",
                      filter: `user_id=eq.${userId}`,
                    },
                    // Mismo manejador de eventos que antes
                    (payload) => {
                      // Código del manejador (igual que arriba)
                      console.log("Evento de productos detectado (reconexión):", payload.eventType)

                      // Manejar los diferentes tipos de eventos igual que antes
                      if (payload.eventType === "INSERT" && payload.new) {
                        const newProduct = this.mapDatabaseProductToProduct(payload.new)
                        Promise.resolve().then(() => {
                          try {
                            onAdd(newProduct)
                          } catch (e) {
                            console.error(e)
                          }
                        })
                      } else if (payload.eventType === "UPDATE" && payload.new) {
                        const updatedProduct = this.mapDatabaseProductToProduct(payload.new)
                        Promise.resolve().then(() => {
                          try {
                            onUpdate(updatedProduct)
                          } catch (e) {
                            console.error(e)
                          }
                        })
                      } else if (payload.eventType === "DELETE" && payload.old && payload.old.id) {
                        Promise.resolve().then(() => {
                          try {
                            onDelete(payload.old.id)
                          } catch (e) {
                            console.error(e)
                          }
                        })
                      }
                    },
                  )
                  .subscribe()

                // Actualizar la referencia al canal en las funciones de cancelación
                this.productSubscriptions[subscriptionKey] = () => {
                  console.log("Cancelando suscripción de reconexión a productos")
                  retryChannel.unsubscribe()
                  delete this.productSubscriptions[subscriptionKey]
                }
              } catch (error) {
                console.error("Error al intentar reconectar:", error)
              }
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
      // Programar un reintento automático
      return new Promise((resolve) => {
        setTimeout(async () => {
          console.log("Reintentando suscripción a productos...")
          const unsubscribe = await this.subscribeToProducts(userId, onAdd, onUpdate, onDelete)
          resolve(unsubscribe)
        }, 5000)
      })
    }
  }

  // Suscribirse a cambios en tiendas para un usuario específico
  public async subscribeToStores(
    userId: string,
    onAdd: StoreCallback,
    onUpdate: StoreCallback,
    onDelete: DeleteCallback,
  ): Promise<() => void> {
    console.log("Iniciando suscripción a tiendas para el usuario:", userId)

    // Crear una clave única para esta suscripción
    const subscriptionKey = `stores_${userId}_${Date.now()}`

    try {
      // Verificar la conexión antes de suscribirse
      await this.ensureConnection()

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

                // Usar Promise.resolve para manejar asincrónicamente
                Promise.resolve().then(() => {
                  try {
                    onAdd(newStore)
                  } catch (error) {
                    console.error("Error en callback onAdd para tiendas:", error)
                  }
                })
              }
            } else if (payload.eventType === "UPDATE") {
              console.log("Tienda actualizada detectada:", payload.new)
              if (payload.new) {
                const updatedStore = this.mapDatabaseStoreToStore(payload.new)

                // Usar Promise.resolve para manejar asincrónicamente
                Promise.resolve().then(() => {
                  try {
                    onUpdate(updatedStore)
                  } catch (error) {
                    console.error("Error en callback onUpdate para tiendas:", error)
                  }
                })
              }
            } else if (payload.eventType === "DELETE") {
              console.log("Tienda eliminada detectada:", payload.old)
              if (payload.old && payload.old.id) {
                // Usar Promise.resolve para manejar asincrónicamente
                Promise.resolve().then(() => {
                  try {
                    onDelete(payload.old.id)
                  } catch (error) {
                    console.error("Error en callback onDelete para tiendas:", error)
                  }
                })
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
            setTimeout(async () => {
              channel.unsubscribe()
              const newUnsubscribe = await this.subscribeToStores(userId, onAdd, onUpdate, onDelete)
              this.storeSubscriptions[subscriptionKey] = newUnsubscribe
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
      // Programar un reintento automático
      return new Promise((resolve) => {
        setTimeout(async () => {
          console.log("Reintentando suscripción a tiendas...")
          const unsubscribe = await this.subscribeToStores(userId, onAdd, onUpdate, onDelete)
          resolve(unsubscribe)
        }, 5000)
      })
    }
  }

  // Asegurar que hay una conexión activa antes de suscribirse
  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected) {
      return true
    }

    try {
      console.log("Verificando conexión antes de suscribirse...")
      const { data, error } = await this.supabase.from("products").select("count").limit(1)

      if (error) {
        console.error("Error de conexión a Supabase:", error)
        this.isConnected = false
        throw new Error("No se pudo establecer conexión con Supabase")
      }

      console.log("Conexión a Supabase verificada correctamente")
      this.isConnected = true
      return true
    } catch (error) {
      console.error("Error al verificar conexión:", error)
      this.isConnected = false

      // Intentar reconectar
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            const result = await this.ensureConnection()
            resolve(result)
          } catch (e) {
            reject(e)
          }
        }, 5000)
      })
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
