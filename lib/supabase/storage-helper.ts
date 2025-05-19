import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase usando variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Sube un archivo al bucket de Supabase Storage
 * @param file Archivo a subir
 * @param bucket Nombre del bucket
 * @param path Ruta dentro del bucket (opcional)
 * @returns URL pública del archivo o null si hay error
 */
export async function uploadFile(file: File, bucket: string, path?: string): Promise<string | null> {
  try {
    // Crear nombre de archivo único
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
    const filePath = path ? `${path}/${fileName}` : fileName

    // Subir archivo
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error al subir archivo:", error)
      return null
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error("Error en uploadFile:", error)
    return null
  }
}

/**
 * Elimina un archivo del bucket de Supabase Storage
 * @param path Ruta completa del archivo
 * @param bucket Nombre del bucket
 * @returns true si se eliminó correctamente, false si hubo error
 */
export async function deleteFile(path: string, bucket: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error al eliminar archivo:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error en deleteFile:", error)
    return false
  }
}

/**
 * Obtiene la URL pública de un archivo
 * @param path Ruta del archivo
 * @param bucket Nombre del bucket
 * @returns URL pública del archivo
 */
export function getPublicUrl(path: string, bucket: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return data.publicUrl
}

/**
 * Lista archivos en un bucket
 * @param bucket Nombre del bucket
 * @param path Ruta dentro del bucket (opcional)
 * @returns Lista de archivos o null si hay error
 */
export async function listFiles(bucket: string, path?: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path || "")

    if (error) {
      console.error("Error al listar archivos:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error en listFiles:", error)
    return null
  }
}

/**
 * Crea un cliente de Supabase para usar en componentes del cliente
 * @returns Cliente de Supabase
 */
export function getSupabaseClient() {
  return supabase
}
