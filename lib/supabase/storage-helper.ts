import { createClientSupabaseClient } from "./client"

/**
 * Función para obtener una URL de imagen con token de acceso
 * Esta función resuelve problemas de acceso a imágenes cuando las políticas
 * de acceso público no están correctamente configuradas
 */
export async function getAccessibleImageUrl(path: string): Promise<string> {
  try {
    if (!path) return "/placeholder.svg"

    // Si la URL ya incluye un token de acceso, devolverla tal cual
    if (path.includes("token=")) return path

    // Si es una URL de datos o una URL relativa, devolverla tal cual
    if (path.startsWith("data:") || path.startsWith("/")) return path

    const supabase = createClientSupabaseClient()

    // Extraer el bucket y la ruta del archivo de la URL
    const urlParts = path.split("/storage/v1/object/public/")
    if (urlParts.length < 2) return path

    const [bucketAndPath] = urlParts[1].split("?")
    const [bucket, ...pathParts] = bucketAndPath.split("/")
    const filePath = pathParts.join("/")

    console.log(`Obteniendo URL firmada para bucket: ${bucket}, path: ${filePath}`)

    // Obtener una URL firmada que incluye un token de acceso temporal
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60) // URL válida por 1 hora

    if (error || !data?.signedUrl) {
      console.error("Error al obtener URL firmada:", error)
      return path // Devolver la URL original en caso de error
    }

    console.log("URL firmada obtenida correctamente:", data.signedUrl)
    return data.signedUrl
  } catch (error) {
    console.error("Error al procesar URL de imagen:", error)
    return path // Devolver la URL original en caso de error
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
