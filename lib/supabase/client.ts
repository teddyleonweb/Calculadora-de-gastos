import { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase para el cliente (singleton)
let supabaseClient: ReturnType<typeof createClient> | null = null
let lastResetTime = 0

// Optimizar la creación del cliente Supabase
export const createClientSupabaseClient = () => {
  // Verificar si estamos en modo local (sin variables de entorno)
  const isLocalMode =
    typeof window !== "undefined" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (isLocalMode) {
    console.log("Modo local: No se puede crear cliente Supabase sin variables de entorno")
    throw new Error("No se pueden encontrar las variables de entorno de Supabase")
  }

  // OPTIMIZACIÓN: Reiniciar el cliente si ha pasado más de 5 minutos desde el último reinicio
  // Esto ayuda a evitar problemas de conexión persistentes
  const now = Date.now()
  if (now - lastResetTime > 5 * 60 * 1000) {
    // 5 minutos
    if (supabaseClient) {
      console.log("Reiniciando cliente Supabase por tiempo de vida")
      supabaseClient = null
      lastResetTime = now
    }
  }

  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  // Configuración optimizada para el cliente de Supabase
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Desactivar para evitar procesamiento innecesario
    },
    realtime: {
      params: {
        eventsPerSecond: 1, // OPTIMIZACIÓN: Reducir a 1 para minimizar la carga
      },
    },
    global: {
      fetch: (...args) => {
        // Añadir timeout a las peticiones para evitar bloqueos
        const controller = new AbortController()
        const { signal } = controller

        const timeoutId = setTimeout(() => controller.abort(), 3000) // OPTIMIZACIÓN: Reducir a 3 segundos timeout

        return fetch(...args, {
          signal,
          // OPTIMIZACIÓN: Añadir cache: 'no-store' para evitar problemas de caché
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }).finally(() => clearTimeout(timeoutId))
      },
    },
    db: {
      schema: "public",
    },
  })

  // Verificar que el cliente se ha creado correctamente
  if (supabaseClient) {
    console.log("Cliente Supabase creado correctamente")
    lastResetTime = now
  }

  return supabaseClient
}

// Función para reiniciar el cliente de Supabase (útil para solucionar problemas)
export const resetSupabaseClient = () => {
  if (supabaseClient) {
    console.log("Reiniciando cliente de Supabase...")
    supabaseClient = null
    lastResetTime = Date.now()
  }
}

// OPTIMIZACIÓN: Añadir función para verificar la conexión
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const supabase = createClientSupabaseClient()

    // Crear un timeout manual
    const timeoutPromise = new Promise<{ data: any; error: Error }>((_, reject) => {
      setTimeout(() => {
        reject(new Error("La verificación de conexión ha excedido el tiempo límite"))
      }, 3000) // 3 segundos de timeout
    })

    // Hacer una consulta simple para verificar la conexión
    const checkPromise = supabase.from("products").select("count").limit(1)

    const { error } = await Promise.race([checkPromise, timeoutPromise])

    if (error) {
      console.error("Error de conexión a Supabase:", error)
      resetSupabaseClient() // Reiniciar el cliente si hay error
      return false
    }

    return true
  } catch (error) {
    console.error("Error al verificar conexión a Supabase:", error)
    resetSupabaseClient() // Reiniciar el cliente si hay error
    return false
  }
}
