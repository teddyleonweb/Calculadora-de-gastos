// Interfaz para la respuesta de la API de Open Food Facts
interface OpenFoodFactsProduct {
  product_name?: string
  image_url?: string
  price?: string
  brands?: string
  quantity?: string
  categories?: string
  nutriments?: any
  ingredients_text?: string
  [key: string]: any
}

interface BarcodeSearchResult {
  found: boolean
  product?: {
    product_name?: string
    image_url?: string
    price?: string
    brands?: string
    quantity?: string
    categories?: string
    [key: string]: any
  }
  error?: string
}

export class BarcodeService {
  // Método para buscar información de un producto por código de barras
  static async searchByBarcode(barcode: string): Promise<BarcodeSearchResult> {
    try {
      // Primero intentamos buscar en Open Food Facts (base de datos abierta de alimentos)
      const openFoodFactsResult = await this.searchOpenFoodFacts(barcode)

      if (openFoodFactsResult.found) {
        return openFoodFactsResult
      }

      // Si no se encuentra en Open Food Facts, podríamos intentar con otras APIs
      // Por ahora, devolvemos que no se encontró
      return { found: false }
    } catch (error) {
      console.error("Error al buscar información del código de barras:", error)
      return {
        found: false,
        error: error instanceof Error ? error.message : "Error desconocido al buscar el producto",
      }
    }
  }

  // Método para buscar en Open Food Facts
  private static async searchOpenFoodFacts(barcode: string): Promise<BarcodeSearchResult> {
    try {
      // URL de la API de Open Food Facts
      const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`

      const response = await fetch(url)
      const data = await response.json()

      // Verificar si se encontró el producto
      if (data.status === 1 && data.product) {
        const product: OpenFoodFactsProduct = data.product

        return {
          found: true,
          product: {
            product_name: product.product_name || product.product_name_es || "",
            image_url: product.image_url || product.image_front_url || "",
            brands: product.brands || "",
            quantity: product.quantity || "",
            categories: product.categories || "",
            // Podríamos añadir más información si es necesario
          },
        }
      }

      return { found: false }
    } catch (error) {
      console.error("Error al buscar en Open Food Facts:", error)
      return { found: false }
    }
  }

  // Aquí podrías añadir más métodos para buscar en otras APIs o bases de datos
  // Por ejemplo, una API interna, una base de datos propia, etc.
}
