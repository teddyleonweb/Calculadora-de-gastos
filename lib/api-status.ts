// Función para verificar si la API está disponible
export const checkApiStatus = async (apiUrl: string): Promise<boolean> => {
  try {
    // Intentar hacer una solicitud simple a la API
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout de 5 segundos

    const response = await fetch(`${apiUrl}/ping`, {
      method: "GET",
      mode: "no-cors",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return true
  } catch (error) {
    console.warn("API no disponible:", error)
    return false
  }
}

// Función para verificar periódicamente el estado de la API
export const startApiStatusMonitor = (
  apiUrl: string,
  onStatusChange: (isOnline: boolean) => void,
  interval = 30000, // 30 segundos por defecto
): (() => void) => {
  let isApiOnline = false

  const checkStatus = async () => {
    const status = await checkApiStatus(apiUrl)
    if (status !== isApiOnline) {
      isApiOnline = status
      onStatusChange(status)
    }
  }

  // Verificar inmediatamente
  checkStatus()

  // Configurar verificación periódica
  const intervalId = setInterval(checkStatus, interval)

  // Devolver función para detener el monitoreo
  return () => clearInterval(intervalId)
}
