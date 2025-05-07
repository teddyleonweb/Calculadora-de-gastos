// URL base para la API de búsqueda de códigos de barras
const BARCODE_API_URL = "https://world.openfoodfacts.org/api/v0/product/"

interface BarcodeProductInfo {
  found: boolean
  product?: {
    product_name: string
    brands?: string
    quantity?: string
    image_url?: string
    price?: string
  }
  error?: string
}

export const BarcodeService = {
  // Buscar información de un producto por código de barras
  searchByBarcode: async (barcode: string): Promise<BarcodeProductInfo> => {
    try {
      console.log(`Buscando información para el código de barras: ${barcode}`)

      // Primero intentamos buscar en Open Food Facts
      const response = await fetch(`${BARCODE_API_URL}${barcode}.json`)

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Verificar si se encontró el producto
      if (data.status === 1 && data.product) {
        return {
          found: true,
          product: {
            product_name: data.product.product_name || "Producto sin nombre",
            brands: data.product.brands,
            quantity: data.product.quantity,
            image_url: data.product.image_url,
            // Open Food Facts no proporciona precios
          },
        }
      }

      // Si no se encuentra en Open Food Facts, podríamos intentar con otras APIs
      // o simplemente devolver que no se encontró
      return {
        found: false,
        error: "Producto no encontrado en la base de datos",
      }
    } catch (error) {
      console.error("Error al buscar información del código de barras:", error)
      return {
        found: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  },
}
