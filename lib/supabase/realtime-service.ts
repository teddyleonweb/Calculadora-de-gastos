import { createClient, type RealtimeChannel } from "@supabase/supabase-js"
import type { Product, Store } from "../../types"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const realtimeService = {
  setupBroadcastChannel: (userId: string): RealtimeChannel => {
    const channel = supabase.channel(`broadcast-${userId}`)
    channel.subscribe()
    return channel
  },

  subscribeToProducts: (
    userId: string,
    onInsert: (product: Product) => void,
    onUpdate: (product: Product) => void,
    onDelete: (id: string) => void,
  ): (() => void) => {
    const channel = supabase
      .channel(`products-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert(payload.new as Product)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate(payload.new as Product)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "products",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onDelete(payload.old.id)
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  },

  subscribeToStores: (
    userId: string,
    onInsert: (store: Store) => void,
    onUpdate: (store: Store) => void,
    onDelete: (id: string) => void,
  ): (() => void) => {
    const channel = supabase
      .channel(`stores-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert(payload.new as Store)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate(payload.new as Store)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "stores",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onDelete(payload.old.id)
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  },
}
