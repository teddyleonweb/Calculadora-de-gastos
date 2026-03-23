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
  clientId?: string // Opcional, mantenido por compatibilidad
  onRefreshData?: () => void
  onNotification?: (message: string, type: RealtimeEventType) => void
}

// Hook simplificado que sincroniza datos cuando la ventana obtiene el foco
// y cuando hay cambios de visibilidad (el usuario vuelve a la pestaña)
export function useRealtimeSync({
  userId,
  projectId,
  onRefreshData,
  onNotification,
}: UseRealtimeSyncOptions) {
  const lastRefreshRef = useRef<number>(Date.now())
  const callbacksRef = useRef({ onRefreshData, onNotification })
  
  // Actualizar refs cuando cambien los callbacks
  useEffect(() => {
    callbacksRef.current = { onRefreshData, onNotification }
  })

  // Sincronizar cuando la ventana obtiene el foco o se vuelve visible
  useEffect(() => {
    if (!userId || !projectId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now()
        // Solo refrescar si pasaron más de 5 segundos desde el último refresh
        if (now - lastRefreshRef.current > 5000) {
          lastRefreshRef.current = now
          callbacksRef.current.onRefreshData?.()
        }
      }
    }

    const handleFocus = () => {
      const now = Date.now()
      // Solo refrescar si pasaron más de 5 segundos desde el último refresh
      if (now - lastRefreshRef.current > 5000) {
        lastRefreshRef.current = now
        callbacksRef.current.onRefreshData?.()
      }
    }

    // Escuchar cambios de visibilidad y foco
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [userId, projectId])

  // Funciones de broadcast que ahora solo sirven como placeholders
  // ya que la sincronización real ocurre al enfocar la ventana
  const broadcastProductAdded = useCallback(() => {
    // La sincronización ocurre automáticamente cuando el otro dispositivo
    // vuelve a enfocar su ventana
  }, [])

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
