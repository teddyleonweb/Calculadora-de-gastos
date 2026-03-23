"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Package, Store, RefreshCw, Trash2, Plus, Edit } from "lucide-react"
import type { RealtimeEventType } from "@/hooks/use-realtime-sync"

interface ToastNotification {
  id: string
  message: string
  type: RealtimeEventType
  timestamp: number
}

interface RealtimeToastProps {
  onNewNotification?: (callback: (message: string, type: RealtimeEventType) => void) => void
}

export default function RealtimeToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([])

  const addNotification = useCallback((message: string, type: RealtimeEventType) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const notification: ToastNotification = {
      id,
      message,
      type,
      timestamp: Date.now(),
    }

    setNotifications((prev) => [...prev, notification])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Exponer la función addNotification globalmente
  useEffect(() => {
    ;(window as any).__realtimeToast = addNotification
    return () => {
      delete (window as any).__realtimeToast
    }
  }, [addNotification])

  const getIcon = (type: RealtimeEventType) => {
    switch (type) {
      case "product_added":
        return <Plus className="h-4 w-4 text-green-500" />
      case "product_updated":
        return <Edit className="h-4 w-4 text-blue-500" />
      case "product_deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />
      case "store_added":
        return <Store className="h-4 w-4 text-green-500" />
      case "store_updated":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case "store_deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getBackgroundColor = (type: RealtimeEventType) => {
    switch (type) {
      case "product_added":
      case "store_added":
        return "bg-green-50 border-green-200"
      case "product_updated":
      case "store_updated":
        return "bg-blue-50 border-blue-200"
      case "product_deleted":
      case "store_deleted":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBackgroundColor(
            notification.type
          )} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-right`}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Sincronizacion</p>
            <p className="text-sm text-gray-600 truncate">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// Función helper para mostrar notificaciones desde cualquier lugar
export function showRealtimeToast(message: string, type: RealtimeEventType) {
  if (typeof window !== "undefined" && (window as any).__realtimeToast) {
    ;(window as any).__realtimeToast(message, type)
  }
}
