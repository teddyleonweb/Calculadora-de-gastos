import { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase para el cliente (singleton)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  // Verificar si estamos en modo local (sin variables de entorno)
  const isLocalMode =
    typeof window !== "undefined" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (isLocalMode) {
    console.log("Modo local: No se puede crear cliente Supabase sin variables de entorno")
    throw new Error("No se pueden encontrar las variables de entorno de Supabase")
  }

  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  // Configuración mejorada para el cliente de Supabase
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "calcuapp-auth", // Clave específica para evitar conflictos
    },
    global: {
      // Configuración global para todas las solicitudes
      headers: {
        "x-client-info": "calcuapp-web",
      },
      fetch: (url, options) => {
        // Configurar un timeout para todas las solicitudes
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId)
        })
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 5, // Reducir para evitar sobrecarga
      },
      // Configuración para reconexión automática
      reconnect: {
        retryAttempts: 5,
        retryBackoff: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Backoff exponencial con máximo de 10 segundos
      },
    },
    db: {
      schema: "public",
    },
  })

  // Verificar que el cliente se ha creado correctamente
  if (supabaseClient) {
    console.log("Cliente Supabase creado correctamente")

    // Configurar un manejador de errores global
    window.addEventListener("online", () => {
      console.log("Conexión a Internet restaurada, reconectando Supabase...")
      resetSupabaseClient() // Reiniciar el cliente cuando la conexión se restaura
    })
  }

  return supabaseClient
}

// Función para reiniciar el cliente de Supabase (útil para solucionar problemas)
export const resetSupabaseClient = () => {
  if (supabaseClient) {
    console.log("Reiniciando cliente de Supabase...")
    supabaseClient = null
  }
}
