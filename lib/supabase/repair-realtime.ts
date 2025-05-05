import { createClientSupabaseClient } from "./client"

/**
 * Función para verificar y reparar las suscripciones en tiempo real
 * Esta función intenta resolver problemas comunes con las suscripciones
 */
export async function repairRealtimeSubscriptions(userId: string): Promise<boolean> {
  try {
    console.log("Iniciando reparación de suscripciones en tiempo real para el usuario:", userId)
    const supabase = createClientSupabaseClient()

    // 1. Verificar la conexión a Supabase
    const { data: connectionData, error: connectionError } = await supabase.from("products").select("count").limit(1)

    if (connectionError) {
      console.error("Error de conexión a Supabase:", connectionError)
      return false
    }

    console.log("Conexión a Supabase verificada correctamente")

    // 2. Verificar que el canal de tiempo real está disponible
    const testChannel = supabase.channel("repair-test-channel")

    return new Promise((resolve) => {
      testChannel.subscribe((status) => {
        console.log("Estado del canal de prueba para reparación:", status)

        if (status === "SUBSCRIBED") {
          console.log("Canal de tiempo real funcionando correctamente")

          // 3. Probar un evento de inserción
          setTimeout(async () => {
            try {
              // Crear un producto de prueba temporal
              const { data: testProduct, error: insertError } = await supabase
                .from("products")
                .insert({
                  title: `Test Realtime ${Date.now()}`,
                  price: 0.01,
                  quantity: 1,
                  user_id: userId,
                  store_id: "test",
                })
                .select()
                .single()

              if (insertError) {
                console.error("Error al insertar producto de prueba:", insertError)
                testChannel.unsubscribe()
                resolve(false)
                return
              }

              console.log("Producto de prueba insertado:", testProduct)

              // Eliminar el producto de prueba después de un breve retraso
              setTimeout(async () => {
                if (testProduct) {
                  await supabase.from("products").delete().eq("id", testProduct.id)
                  console.log("Producto de prueba eliminado")
                }

                testChannel.unsubscribe()
                resolve(true)
              }, 1000)
            } catch (error) {
              console.error("Error en la prueba de inserción:", error)
              testChannel.unsubscribe()
              resolve(false)
            }
          }, 1000)
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.error("Error en el canal de tiempo real:", status)
          resolve(false)
        }
      })

      // Timeout para resolver si no hay respuesta
      setTimeout(() => {
        console.warn("Timeout al verificar canal de tiempo real")
        testChannel.unsubscribe()
        resolve(false)
      }, 5000)
    })
  } catch (error) {
    console.error("Error al reparar suscripciones en tiempo real:", error)
    return false
  }
}
