// Configuración para optimización de rendimiento

export const OPTIMIZATION_CONFIG = {
  // Límites para paginación
  PAGINATION: {
    PRODUCTS_PER_PAGE: 10,
    STORES_PER_PAGE: 20,
  },

  // Tiempos de caché (en segundos)
  CACHE: {
    PRODUCTS: 60 * 5, // 5 minutos
    STORES: 60 * 15, // 15 minutos
    IMAGES: 60 * 60 * 24, // 24 horas
  },

  // Configuración de imágenes
  IMAGES: {
    THUMBNAIL_WIDTH: 100,
    MEDIUM_WIDTH: 300,
    LARGE_WIDTH: 600,
    QUALITY: 75,
  },

  // Límites de tamaño
  SIZE_LIMITS: {
    MAX_IMAGE_SIZE_MB: 5,
    MAX_BATCH_OPERATIONS: 50,
  },

  // Configuración de Supabase Realtime
  REALTIME: {
    RECONNECT_TIMEOUT: 3000,
    MAX_RECONNECT_ATTEMPTS: 5,
  },

  // Configuración de rendimiento
  PERFORMANCE: {
    DEBOUNCE_TIME: 300, // ms
    THROTTLE_TIME: 500, // ms
    LAZY_LOAD_THRESHOLD: 200, // px
  },
}

// Función para aplicar debounce a funciones
export function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Función para aplicar throttle a funciones
export function throttle<F extends (...args: any[]) => any>(func: F, limit: number): (...args: Parameters<F>) => void {
  let inThrottle = false

  return (...args: Parameters<F>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Caché simple en memoria
export class SimpleCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map()

  set(key: string, value: any, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiry })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  clear(): void {
    this.cache.clear()
  }
}

// Instancia global de caché
export const globalCache = new SimpleCache()
