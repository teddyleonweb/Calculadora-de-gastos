// Configuración centralizada para la API de WordPress
export const API_CONFIG = {
  // URL base de la API de WordPress
 // produccion BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php",

//Desarrollo
 BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://devcalcuapp.teddyhosting.com/",

  // Función para obtener la URL completa de un endpoint específico
  getEndpointUrl: (endpoint: string) => {
    return `${API_CONFIG.BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
  },

  // Función para añadir un timestamp a una URL para evitar caché
  getUrlWithTimestamp: (url: string) => {
    const timestamp = new Date().getTime()
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}_t=${timestamp}`
  },
}
