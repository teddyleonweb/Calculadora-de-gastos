// Configuración centralizada para la API de WordPress
export const API_CONFIG = {
  // URL base de la API de WordPress
  // produccion 
// BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php",

  //Desarrollo
  BASE_URL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://devcalcuapp.teddyhosting.com/api.php",

  // Función para obtener la URL completa de un endpoint específico
  getEndpointUrl: (endpoint: string) => {
    // Asegurarse de que la URL base no termine con / y el endpoint comience con /
    const baseUrl = API_CONFIG.BASE_URL.endsWith("/") ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL

    const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    return `${baseUrl}${formattedEndpoint}`
  },

  // Función para añadir un timestamp a una URL para evitar caché
  getUrlWithTimestamp: (url: string) => {
    const timestamp = new Date().getTime()
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}_t=${timestamp}`
  },
}
