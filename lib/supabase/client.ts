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
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Aumentar la tasa de eventos por segundo
      },
    },
    db: {
      schema: "public",
    },
  })

  // Verificar que el cliente se ha creado correctamente
  if (supabaseClient) {
    console.log("Cliente Supabase creado correctamente")
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
