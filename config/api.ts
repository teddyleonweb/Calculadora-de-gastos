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

    // Si la URL base ya termina con api.php, no añadir nada más
    if (baseUrl.endsWith("api.php")) {
      // Para endpoints que comienzan con /, eliminar la barra inicial
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint
      // Añadir ? o & según corresponda
      const separator = baseUrl.includes("?") ? "&" : "?"
      return `${baseUrl}${separator}endpoint=${cleanEndpoint}`
    } else {
      // Comportamiento anterior para URLs que no terminan en api.php
      const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      return `${baseUrl}${formattedEndpoint}`
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
  ejemploURL: API_CONFIG.getEndpointUrl("/auth/login"),
})
