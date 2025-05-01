import { createClientSupabaseClient } from "./client"
import { ProductService } from "../../services/product-service"
import { StoreService } from "../../services/store-service"

// Clase para gestionar la sincronización periódica
export class SyncService {
  private static instance: SyncService
  private syncInterval: NodeJS.Timeout | null = null
  private lastSyncTime = 0
  private isSyncing = false
  private userId: string | null = null
  private syncCallbacks: {
    onProductsSync?: (products: any[]) => void
    onStoresSync?: (stores: any[]) => void
    onSyncError?: (error: Error) => void
  } = {}

  // Patrón Singleton para asegurar una única instancia
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  // Iniciar la sincronización periódica
  public startSync(
    userId: string,
    options: {
      interval?: number
      onProductsSync?: (products: any[]) => void
      onStoresSync?: (stores: any[]) => void
      onSyncError?: (error: Error) => void
    } = {},
  ): void {
    if (this.syncInterval) {
      this.stopSync()
    }

    this.userId = userId
    this.syncCallbacks = {
      onProductsSync: options.onProductsSync,
      onStoresSync: options.onStoresSync,
      onSyncError: options.onSyncError,
    }

    // Realizar una sincronización inicial
    this.performSync()

    // Configurar la sincronización periódica
    const interval = options.interval || 30000 // Por defecto, cada 30 segundos
    this.syncInterval = setInterval(() => {
      this.performSync()
    }, interval)

    console.log(`Sincronización periódica iniciada para el usuario ${userId} cada ${interval / 1000} segundos`)
  }

  // Detener la sincronización periódica
  public stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      console.log("Sincronización periódica detenida")
    }
  }

  // Forzar una sincronización inmediata
  public async forceSync(): Promise<boolean> {
    return this.performSync()
  }

  // Realizar la sincronización
  private async performSync(): Promise<boolean> {
    if (!this.userId || this.isSyncing) {
      return false
    }

    this.isSyncing = true
    let success = false

    try {
      console.log("Iniciando sincronización periódica...")
      const supabase = createClientSupabaseClient()

      // Verificar si hay cambios en productos desde la última sincronización
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", this.userId)
        .gt("updated_at", new Date(this.lastSyncTime).toISOString())

      if (productsError) {
        console.error("Error al sincronizar productos:", productsError)
        if (this.syncCallbacks.onSyncError) {
          this.syncCallbacks.onSyncError(new Error(`Error al sincronizar productos: ${productsError.message}`))
        }
      } else if (productsData && productsData.length > 0) {
        console.log(`Se encontraron ${productsData.length} productos actualizados`)

        // Obtener todos los productos para asegurar una sincronización completa
        const allProducts = await ProductService.getProducts(this.userId)

        if (this.syncCallbacks.onProductsSync) {
          this.syncCallbacks.onProductsSync(allProducts)
        }
      }

      // Verificar si hay cambios en tiendas desde la última sincronización
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", this.userId)
        .gt("updated_at", new Date(this.lastSyncTime).toISOString())

      if (storesError) {
        console.error("Error al sincronizar tiendas:", storesError)
        if (this.syncCallbacks.onSyncError) {
          this.syncCallbacks.onSyncError(new Error(`Error al sincronizar tiendas: ${storesError.message}`))
        }
      } else if (storesData && storesData.length > 0) {
        console.log(`Se encontraron ${storesData.length} tiendas actualizadas`)

        // Obtener todas las tiendas para asegurar una sincronización completa
        const allStores = await StoreService.getStores(this.userId)

        if (this.syncCallbacks.onStoresSync) {
          this.syncCallbacks.onStoresSync(allStores)
        }
      }

      // Actualizar el tiempo de la última sincronización
      this.lastSyncTime = Date.now()
      success = true
      console.log("Sincronización periódica completada con éxito")
    } catch (error) {
      console.error("Error durante la sincronización periódica:", error)
      if (this.syncCallbacks.onSyncError) {
        this.syncCallbacks.onSyncError(error instanceof Error ? error : new Error(String(error)))
      }
    } finally {
      this.isSyncing = false
    }

    return success
  }

  // Verificar si la sincronización está activa
  public isSyncActive(): boolean {
    return this.syncInterval !== null
  }

  // Obtener el tiempo transcurrido desde la última sincronización
  public getTimeSinceLastSync(): number {
    return Date.now() - this.lastSyncTime
  }
}

// Exportar una instancia única del servicio
export const syncService = SyncService.getInstance()
