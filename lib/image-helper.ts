// Función simple para convertir una imagen a base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Función para comprimir una imagen
export const compressImage = (base64Image: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64Image
    img.onload = () => {
      const canvas = document.createElement("canvas")
      let width = img.width
      let height = img.height

      // Redimensionar si es necesario
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("No se pudo crear el contexto del canvas"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a formato JPEG con calidad reducida
      const compressedImage = canvas.toDataURL("image/jpeg", quality)
      resolve(compressedImage)
    }
    img.onerror = () => reject(new Error("Error al cargar la imagen"))
  })
}

// Función para subir una imagen a través de la API
export const uploadImage = async (userId: string, imageData: string): Promise<string> => {
  try {
    // Aquí iría la lógica para subir la imagen a la API
    // Por ahora, simplemente devolvemos la imagen en base64
    return imageData
  } catch (error) {
    console.error("Error al subir la imagen:", error)
    throw error
  }
}

// Función para obtener una URL pública de una imagen
export const getPublicUrl = (path: string): string => {
  // En un entorno real, aquí construiríamos la URL pública
  // Por ahora, simplemente devolvemos el path
  return path
}
