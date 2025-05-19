/**
 * Servicio para manejar el almacenamiento de imágenes en WordPress
 */

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const StorageService = {
  /**
   * Sube una imagen a WordPress
   * @param file Archivo de imagen a subir
   * @returns URL de la imagen subida o null si hay error
   */
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      // Convertir el archivo a base64
      const base64 = await fileToBase64(file)

      // Obtener el token de autenticación
      const token = localStorage.getItem("auth_token")

      if (!token) {
        console.error("No hay token de autenticación")
        return null
      }

      // Enviar la imagen al servidor
      const response = await fetch(`${API_BASE_URL}/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: base64,
          filename: file.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al subir la imagen")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error al subir imagen:", error)
      return null
    }
  },

  /**
   * Convierte una URL de imagen a base64
   * @param url URL de la imagen
   * @returns Imagen en formato base64 o null si hay error
   */
  imageUrlToBase64: async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return await fileToBase64(blob)
    } catch (error) {
      console.error("Error al convertir imagen a base64:", error)
      return null
    }
  },
}

/**
 * Convierte un archivo o blob a base64
 * @param file Archivo o blob a convertir
 * @returns Cadena en formato base64
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
