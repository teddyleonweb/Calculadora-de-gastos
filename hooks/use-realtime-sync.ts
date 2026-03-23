"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

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
  onProductAdded?: (product: any) => void
  onProductUpdated?: (product: any) => void
  onProductDeleted?: (productId: string) => void
  onRefreshData?: () => void
  onNotification?: (message: string, type: RealtimeEventType) => void
}

// Hook que escucha cambios en la base de datos usando Supabase Realtime (Postgres Changes)
export function useRealtimeSync({
  userId,
  projectId,
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  onRefreshData,
  onNotification,
}: UseRealtimeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbacksRef = useRef({ 
    onProductAdded, 
    onProductUpdated, 
    onProductDeleted,
    onRefreshData, 
    onNotification 
  })
  
  // Actualizar refs cuando cambien los callbacks
  useEffect(() => {
    callbacksRef.current = { 
      onProductAdded, 
      onProductUpdated, 
      onProductDeleted,
      onRefreshData, 
      onNotification 
    }
  })

  // Suscribirse a cambios en la tabla de productos usando Postgres Changes
  useEffect(() => {
    if (!userId || !projectId) return

    const supabase = createClient()
    
    // Crear canal único para este usuario/proyecto
    const channelName = `products-changes-${userId}-${projectId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Verificar que el producto pertenece al proyecto activo
          if (payload.new && payload.new.project_id === projectId) {
            callbacksRef.current.onProductAdded?.(payload.new)
            callbacksRef.current.onNotification?.(`Producto agregado: ${payload.new.title}`, 'product_added')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && payload.new.project_id === projectId) {
            callbacksRef.current.onProductUpdated?.(payload.new)
            callbacksRef.current.onNotification?.(`Producto actualizado: ${payload.new.title}`, 'product_updated')
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.old && payload.old.project_id === projectId) {
            callbacksRef.current.onProductDeleted?.(payload.old.id)
            callbacksRef.current.onNotification?.('Producto eliminado', 'product_deleted')
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Conectado a cambios de productos')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Error en el canal, usando fallback de visibilidad')
        }
      })

    channelRef.current = channel

    // Fallback: también escuchar cambios de visibilidad por si Realtime falla
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        callbacksRef.current.onRefreshData?.()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, projectId])

  // Funciones placeholder para mantener compatibilidad
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
