"use client"

import { useEffect, useRef, useCallback } from "react"

export type RealtimeEventType = 
  | "product_added" 
  | "product_updated" 
  | "product_deleted"
  | "store_added"
  | "store_updated"
  | "store_deleted"

interface UseRealtimeSyncOptions {
  userId: string | undefined
  projectId: string
  clientId?: string
  onRefreshData?: () => void
  onNotification?: (message: string, type: RealtimeEventType) => void
  // Intervalo de polling en milisegundos (default: 10 segundos)
  pollingInterval?: number
}

// Hook que sincroniza datos usando polling periódico
// Funciona con cualquier backend (PHP, WordPress, SQL externo, etc.)
export function useRealtimeSync({
  userId,
  projectId,
  onRefreshData,
  onNotification,
  pollingInterval = 10000, // 10 segundos por defecto
}: UseRealtimeSyncOptions) {
  const callbacksRef = useRef({ onRefreshData, onNotification })
  const isPollingRef = useRef(false)
  
  // Actualizar refs cuando cambien los callbacks
  useEffect(() => {
    callbacksRef.current = { onRefreshData, onNotification }
  })

  // Polling periódico para detectar cambios
  useEffect(() => {
    if (!userId || !projectId) return

    // Función para hacer polling
    const pollForChanges = async () => {
      // Evitar polling múltiple simultáneo
      if (isPollingRef.current) return
      isPollingRef.current = true
      
      try {
        // Llamar al callback de refresh que recargará los datos
        callbacksRef.current.onRefreshData?.()
      } catch (error) {
        console.error("Error en polling:", error)
      } finally {
        isPollingRef.current = false
      }
    }

    // Iniciar polling periódico
    const intervalId = setInterval(pollForChanges, pollingInterval)

    // También escuchar cambios de visibilidad para refresh inmediato al volver
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pollForChanges()
      }
    }

    // Focus también trigger un refresh
    const handleFocus = () => {
      pollForChanges()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [userId, projectId, pollingInterval])

  // Funciones placeholder para mantener compatibilidad con código existente
  const broadcastProductAdded = useCallback(() => {}, [])
  const broadcastProductUpdated = useCallback(() => {}, [])
  const broadcastProductDeleted = useCallback(() => {}, [])
  const broadcastStoreAdded = useCallback(() => {}, [])
  const broadcastStoreUpdated = useCallback(() => {}, [])
  const broadcastStoreDeleted = useCallback(() => {}, [])

  return {
    broadcastProductAdded,
    broadcastProductUpdated,
    broadcastProductDeleted,
    broadcastStoreAdded,
    broadcastStoreUpdated,
    broadcastStoreDeleted,
  }
}
