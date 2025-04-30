import { createClientSupabaseClient } from "./client"

// Función para probar manualmente las suscripciones en tiempo real
export async function testRealtimeSubscriptions(userId: string): Promise<void> {
  try {
    const supabase = createClientSupabaseClient()

    console.log("Iniciando prueba de suscripciones en tiempo real para el usuario:", userId)

    // Crear un canal de prueba
    const channel = supabase.channel("test-channel")

    // Suscribirse al canal
    channel.subscribe((status) => {
      console.log("Estado del canal de prueba:", status)
    })

    // Esperar un momento para que la suscripción se establezca
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Intentar insertar un producto de prueba
    const { data: insertData, error: insertError } = await supabase
      .from("products")
      .insert({
        title: "Producto de prueba - " + Date.now(),
        price: 1.99,
        quantity: 1,
        user_id: userId,
        store_id: "test",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error al insertar producto de prueba:", insertError)
    } else {
      console.log("Producto de prueba insertado:", insertData)

      // Esperar un momento para que la suscripción detecte el cambio
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Eliminar el producto de prueba
      const { error: deleteError } = await supabase.from("products").delete().eq("id", insertData.id)

      if (deleteError) {
        console.error("Error al eliminar producto de prueba:", deleteError)
      } else {
        console.log("Producto de prueba eliminado correctamente")
      }
    }

    // Limpiar
    channel.unsubscribe()
  } catch (error) {
    console.error("Error en la prueba de suscripciones:", error)
  }
}
