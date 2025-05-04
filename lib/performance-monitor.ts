// Utilidad para monitorear el rendimiento de la aplicación
export const measurePerformance = (componentName: string) => {
  const startTime = performance.now()

  return () => {
    const endTime = performance.now()
    const timeElapsed = endTime - startTime
    console.log(`[Rendimiento] ${componentName} tardó ${timeElapsed.toFixed(2)}ms en renderizarse`)
  }
}

// Función para optimizar imágenes
export const getOptimizedImageUrl = (url: string, width = 300) => {
  if (!url) return ""

  // Si ya es una URL de Supabase Storage, podemos añadir parámetros de transformación
  if (url.includes("storage.googleapis.com") || url.includes("supabase.co/storage")) {
    // Añadir parámetros para redimensionar la imagen
    return `${url}?width=${width}&quality=75`
  }

  return url
}

// Función para cargar recursos de forma diferida
export const lazyLoadResource = async (resourceLoader: () => Promise<any>) => {
  try {
    return await resourceLoader()
  } catch (error) {
    console.error("Error al cargar recurso:", error)
    throw error
  }
}

// Función para detectar problemas de rendimiento
export const detectPerformanceIssues = () => {
  if (typeof window !== "undefined") {
    // Monitorear tiempo de carga de la página
    window.addEventListener("load", () => {
      const loadTime = performance.now()
      console.log(`[Rendimiento] Tiempo total de carga: ${loadTime.toFixed(2)}ms`)

      // Analizar recursos lentos
      const resources = performance.getEntriesByType("resource")
      const slowResources = resources.filter((resource) => resource.duration > 1000)

      if (slowResources.length > 0) {
        console.warn(
          "[Rendimiento] Recursos lentos detectados:",
          slowResources.map((r) => ({
            name: r.name.split("/").pop(),
            duration: `${r.duration.toFixed(2)}ms`,
          })),
        )
      }
    })
  }
}
