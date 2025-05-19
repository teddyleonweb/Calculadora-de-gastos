// Este archivo reemplaza la funcionalidad de Supabase con WordPress

/**
 * Sube una imagen a WordPress
 * @param imageBase64 Imagen en formato base64
 * @param fileName Nombre del archivo
 * @returns URL de la imagen subida
 */
export async function uploadImage(imageBase64: string, fileName = "image.jpg"): Promise<string> {
  try {
    // Obtener el token de autenticación
    const token = localStorage.getItem("auth_token")
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }

    // Preparar los datos para la API de WordPress
    const formData = new FormData()

    // Convertir base64 a blob
    const blob = await fetch(imageBase64).then((res) => res.blob())
    formData.append("file", blob, fileName)

    // Realizar la petición a la API de WordPress
    const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Error al subir la imagen: ${response.statusText}`)
    }

    const data = await response.json()
    return data.source_url // URL de la imagen subida
  } catch (error) {
    console.error("Error al subir la imagen:", error)
    // En caso de error, devolver una URL de imagen por defecto
    return "/sin-imagen-disponible.jpg"
  }
}

/**
 * Obtiene la URL pública de una imagen
 * @param path Ruta de la imagen
 * @returns URL pública de la imagen
 */
export function getPublicUrl(path: string): string {
  // Si ya es una URL completa, devolverla
  if (path.startsWith("http")) {
    return path
  }

  // Si es una ruta relativa, construir la URL completa
  return `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}${path}`
}
