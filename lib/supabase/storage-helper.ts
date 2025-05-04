import { createClientSupabaseClient } from "./client"

/**
 * Función para obtener una URL de imagen con token de acceso
 * Esta función resuelve problemas de acceso a imágenes cuando las políticas
 * de acceso público no están correctamente configuradas
 */
export async function getAccessibleImageUrl(imagePath: string): Promise<string> {
  // Si ya es una URL completa o una imagen en base64, devolverla directamente
  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath
  }

  try {
    const supabase = createClientSupabaseClient()

    // Extraer el bucket y la ruta del archivo
    let bucket = "products"
    let path = imagePath

    // Si la ruta incluye el bucket, extraerlo
    if (imagePath.includes("/")) {
      const parts = imagePath.split("/")
      bucket = parts[0]
      path = parts.slice(1).join("/")
    }

    // Obtener una URL firmada que expire en 1 hora
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)

    if (error) {
      console.error("Error al obtener URL firmada:", error)
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error("Error en getAccessibleImageUrl:", error)
    // Si hay un error, devolver la ruta original
    return imagePath
  }
}

/**
 * Función para verificar si una imagen es accesible
 */
export async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", mode: "no-cors" })
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * Función para extraer la ruta del archivo de una URL de Supabase Storage
 * @param url URL completa de la imagen en Supabase Storage
 * @returns Ruta del archivo dentro del bucket o null si no se puede extraer
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    if (!url) return null

    // Si es una URL de datos o una URL relativa, no es una URL de Supabase Storage
    if (url.startsWith("data:") || url.startsWith("/")) return null

    // Extraer la ruta del archivo de la URL
    const urlParts = url.split("/storage/v1/object/public/")
    if (urlParts.length < 2) return null

    // Obtener la parte después de "/storage/v1/object/public/"
    const [bucketAndPath] = urlParts[1].split("?")

    // Separar el bucket y la ruta
    const [bucket, ...pathParts] = bucketAndPath.split("/")

    // La ruta del archivo es todo lo que viene después del bucket
    const filePath = pathParts.join("/")

    if (!filePath) return null

    console.log(`Extraída ruta de archivo: ${filePath} del bucket: ${bucket}`)
    return filePath
  } catch (error) {
    console.error("Error al extraer ruta de archivo de URL:", error)
    return null
  }
}
