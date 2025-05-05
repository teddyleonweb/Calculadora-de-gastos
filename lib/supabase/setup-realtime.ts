import { createServerSupabaseClient } from "./server"

/**
 * Función para configurar las políticas de seguridad de Supabase Realtime
 * Esta función debe ejecutarse en el servidor
 */
export async function setupRealtimePolicies(): Promise<boolean> {
  try {
    console.log("Configurando políticas de seguridad para Supabase Realtime...")
    const supabase = createServerSupabaseClient()

    // 1. Habilitar la publicación para la tabla products
    try {
      const { error: productsError } = await supabase.rpc("supabase_realtime.enable_publication", {
        publication: "supabase_realtime",
        table_name: "products",
        include_new_events: true,
        include_update_events: true,
        include_delete_events: true,
      })

      if (productsError) {
        console.error("Error al habilitar publicación para products:", productsError)
        return false
      }
    } catch (error) {
      console.error("Error al configurar publicación para products:", error)
      return false
    }

    // 2. Habilitar la publicación para la tabla stores
    try {
      const { error: storesError } = await supabase.rpc("supabase_realtime.enable_publication", {
        publication: "supabase_realtime",
        table_name: "stores",
        include_new_events: true,
        include_update_events: true,
        include_delete_events: true,
      })

      if (storesError) {
        console.error("Error al habilitar publicación para stores:", storesError)
        return false
      }
    } catch (error) {
      console.error("Error al configurar publicación para stores:", error)
      return false
    }

    console.log("Políticas de seguridad configuradas correctamente")
    return true
  } catch (error) {
    console.error("Error al configurar políticas de seguridad:", error)
    return false
  }
}

/**
 * Función para verificar que las políticas de seguridad están correctamente configuradas
 */
export async function checkRealtimePolicies(): Promise<boolean> {
  try {
    console.log("Verificando políticas de seguridad para Supabase Realtime...")
    const supabase = createServerSupabaseClient()

    // Verificar que la publicación está habilitada para la tabla products
    const { data: productsData, error: productsError } = await supabase
      .from("supabase_realtime.publication")
      .select("*")
      .eq("table_name", "products")
      .single()

    if (productsError) {
      console.error("Error al verificar publicación para products:", productsError)
      return false
    }

    // Verificar que la publicación está habilitada para la tabla stores
    const { data: storesData, error: storesError } = await supabase
      .from("supabase_realtime.publication")
      .select("*")
      .eq("table_name", "stores")
      .single()

    if (storesError) {
      console.error("Error al verificar publicación para stores:", storesError)
      return false
    }

    console.log("Políticas de seguridad verificadas correctamente")
    return true
  } catch (error) {
    console.error("Error al verificar políticas de seguridad:", error)
    return false
  }
}
