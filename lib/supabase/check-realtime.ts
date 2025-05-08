import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const checkRealtimeSubscriptions = async (userId: string): Promise<boolean> => {
  try {
    // Crear un canal temporal para verificar la conexión en tiempo real
    const channel = supabase.channel(`check-realtime-${userId}-${Date.now()}`)

    // Intentar suscribirse al canal
    const subscription = channel.subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`)
    })

    // Esperar un momento para que la suscripción se establezca
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verificar si la suscripción está activa
    const isConnected = subscription.state === "SUBSCRIBED"

    // Limpiar la suscripción
    channel.unsubscribe()

    return isConnected
  } catch (error) {
    console.error("Error al verificar suscripciones en tiempo real:", error)
    return false
  }
}
