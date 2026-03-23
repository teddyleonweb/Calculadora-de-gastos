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

export interface RealtimeEvent {
  type: RealtimeEventType
  payload: any
  userId: string
  projectId: string
  timestamp: number
  clientId: string // Para identificar el dispositivo que envió el evento
}

interface UseRealtimeSyncOptions {
  userId: string | undefined
  projectId: string
  clientId: string
  onProductAdded?: (product: any) => void
  onProductUpdated?: (product: any) => void
  onProductDeleted?: (productId: string) => void
  onStoreAdded?: (store: any) => void
  onStoreUpdated?: (store: any) => void
  onStoreDeleted?: (storeId: string) => void
  onNotification?: (message: string, type: RealtimeEventType) => void
}

export function useRealtimeSync({
  userId,
  projectId,
  clientId,
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  onStoreAdded,
  onStoreUpdated,
  onStoreDeleted,
  onNotification,
}: UseRealtimeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  
  // Usar refs para los callbacks para evitar re-suscripciones
  const callbacksRef = useRef({
    onProductAdded,
    onProductUpdated,
    onProductDeleted,
    onStoreAdded,
    onStoreUpdated,
    onStoreDeleted,
    onNotification,
  })
  
  // Actualizar refs cuando cambien los callbacks
  useEffect(() => {
    callbacksRef.current = {
      onProductAdded,
      onProductUpdated,
      onProductDeleted,
      onStoreAdded,
      onStoreUpdated,
      onStoreDeleted,
      onNotification,
    }
  })

  // Función para enviar eventos a otros dispositivos
  const broadcast = useCallback(
    (type: RealtimeEventType, payload: any) => {
      if (!channelRef.current || !userId) return

      const event: RealtimeEvent = {
        type,
        payload,
        userId,
        projectId,
        timestamp: Date.now(),
        clientId,
      }

      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: event,
      })
    },
    [userId, projectId, clientId]
  )

  // Funciones para emitir eventos específicos
  const broadcastProductAdded = useCallback(
    (product: any) => {
      broadcast("product_added", product)
    },
    [broadcast]
  )

  const broadcastProductUpdated = useCallback(
    (product: any) => {
      broadcast("product_updated", product)
    },
    [broadcast]
  )

  const broadcastProductDeleted = useCallback(
    (productId: string) => {
      broadcast("product_deleted", { id: productId })
    },
    [broadcast]
  )

  const broadcastStoreAdded = useCallback(
    (store: any) => {
      broadcast("store_added", store)
    },
    [broadcast]
  )

  const broadcastStoreUpdated = useCallback(
    (store: any) => {
      broadcast("store_updated", store)
    },
    [broadcast]
  )

  const broadcastStoreDeleted = useCallback(
    (storeId: string) => {
      broadcast("store_deleted", { id: storeId })
    },
    [broadcast]
  )

  useEffect(() => {
    if (!userId || !projectId) return

    const supabase = supabaseRef.current
    const channelName = `user-sync-${userId}-${projectId}`

    // Crear canal de broadcast
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // No recibir nuestros propios mensajes
        },
      },
    })

    channel
      .on("broadcast", { event: "sync" }, ({ payload }) => {
        const event = payload as RealtimeEvent

        // Ignorar eventos de nuestro propio dispositivo
        if (event.clientId === clientId) return

        // Ignorar eventos de otros usuarios o proyectos
        if (event.userId !== userId || event.projectId !== projectId) return

        // Usar callbacks desde ref para tener siempre la versión más reciente
        const callbacks = callbacksRef.current

        // Procesar el evento según su tipo
        switch (event.type) {
          case "product_added":
            callbacks.onProductAdded?.(event.payload)
            callbacks.onNotification?.(`Producto agregado: ${event.payload.title}`, event.type)
            break
          case "product_updated":
            callbacks.onProductUpdated?.(event.payload)
            callbacks.onNotification?.(`Producto actualizado: ${event.payload.title}`, event.type)
            break
          case "product_deleted":
            callbacks.onProductDeleted?.(event.payload.id)
            callbacks.onNotification?.("Producto eliminado", event.type)
            break
          case "store_added":
            callbacks.onStoreAdded?.(event.payload)
            callbacks.onNotification?.(`Tienda agregada: ${event.payload.name}`, event.type)
            break
          case "store_updated":
            callbacks.onStoreUpdated?.(event.payload)
            callbacks.onNotification?.(`Tienda actualizada: ${event.payload.name}`, event.type)
            break
          case "store_deleted":
            callbacks.onStoreDeleted?.(event.payload.id)
            callbacks.onNotification?.("Tienda eliminada", event.type)
            break
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[v0] Conectado al canal de sincronización en tiempo real")
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, projectId, clientId]) // Solo dependencias estables

  return {
    broadcastProductAdded,
    broadcastProductUpdated,
    broadcastProductDeleted,
    broadcastStoreAdded,
    broadcastStoreUpdated,
    broadcastStoreDeleted,
  }
}
