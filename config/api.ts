// Configuración centralizada para la API de WordPress
export const API_CONFIG = {
  // URL base de la API de WordPress
  // produccion
  BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php",

  //Desarrollo
  // BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://devcalcuapp.teddyhosting.com/api.php",

  // Función para obtener la URL completa de un endpoint específico
  getEndpointUrl: (endpoint: string) => {
    // Limpiar el endpoint (quitar la barra inicial si existe)
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint

    // Construir la URL completa
    // Si la URL base ya contiene api.php, añadir el endpoint como parámetro de consulta
    if (API_CONFIG.BASE_URL.includes("api.php")) {
      const separator = API_CONFIG.BASE_URL.includes("?") ? "&" : "?"
      return `${API_CONFIG.BASE_URL}${separator}action=${cleanEndpoint}`
    } else {
      // Si no, añadir el endpoint como parte de la ruta
      const baseUrl = API_CONFIG.BASE_URL.endsWith("/") ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL
      return `${baseUrl}/${cleanEndpoint}`
    }
  },

  // Función para añadir un timestamp a una URL para evitar caché
  getUrlWithTimestamp: (url: string) => {
    const timestamp = new Date().getTime()
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}_t=${timestamp}`
  },
}

// Mostrar la configuración actual para depuración
console.log("Configuración de API cargada:", {
  BASE_URL: API_CONFIG.BASE_URL,
  ejemploURL: API_CONFIG.getEndpointUrl("auth/login"),
})
