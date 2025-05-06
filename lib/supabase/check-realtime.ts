import { createClientSupabaseClient } from "./client"

// Función para verificar que las suscripciones en tiempo real estén funcionando
export async function checkRealtimeSubscriptions(userId: string | number): Promise<boolean> {
  try {
    const supabase = createClientSupabaseClient()

    console.log("Verificando configuración de tiempo real para el usuario:", userId)

    // Verificar que el usuario tiene acceso a la tabla products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("count")
      .eq("user_id", userId.toString())
      .limit(1)

    if (productsError) {
      console.error("Error al verificar acceso a productos:", productsError)
      return false
    }

    console.log("Acceso a productos verificado correctamente")

    // Verificar que el canal de tiempo real está disponible
    const channel = supabase.channel("test-channel")

    return new Promise((resolve) => {
      channel.subscribe((status) => {
        console.log("Estado del canal de prueba:", status)
        if (status === "SUBSCRIBED") {
          console.log("Canal de tiempo real funcionando correctamente")
          channel.unsubscribe()
          resolve(true)
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.error("Error en el canal de tiempo real:", status)
          resolve(false)
        }
      })

      // Timeout para resolver si no hay respuesta
      setTimeout(() => {
        console.warn("Timeout al verificar canal de tiempo real")
        channel.unsubscribe()
        resolve(false)
      }, 5000)
    })
  } catch (error) {
    console.error("Error al verificar suscripciones en tiempo real:", error)
    return false
  }
}
