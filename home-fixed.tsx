"use client"

import { useState, useEffect, useRef } from "react"
import type { Product, Store, Rectangle } from "./types"
import Header from "./components/header"
import Footer from "./components/footer"
import { useAuth } from "./contexts/auth-context"
// Importar los servicios
import { StoreService } from "./services/store-service"
import { ProductService } from "./services/product-service"
// Importar el servicio de tiempo real
import { realtimeService } from "./lib/supabase/realtime-service"
import type { RealtimeChannel } from "@supabase/supabase-js"

export default function Home() {
  // Obtener el usuario autenticado
  const { user } = useAuth()

  // Estados para las tiendas
  const [stores, setStores] = useState<Store[]>([{ id: "total", name: "Total" }])
  const [activeStoreId, setActiveStoreId] = useState<string>("total")
  const [storeSubtotals, setStoreSubtotals] = useState<{ [key: string]: number }>({})

  // Estados para la imagen y procesamiento
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugText, setDebugText] = useState<string | null>(null)
  const [debugSteps, setDebugSteps] = useState<string[]>([])
  const [showDebugSteps, setShowDebugSteps] = useState<boolean>(false)

  // Estados para la selección de áreas
  const [rect, setRect] = useState<Rectangle | null>(null)
  const [titleRect, setTitleRect] = useState<Rectangle | null>(null)
  const [priceRect, setPriceRect] = useState<Rectangle | null>(null)
  const [selectionMode, setSelectionMode] = useState<"title" | "price" | "basic" | null>(null)
  const [selectionsReady, setSelectionsReady] = useState<boolean>(false)
  const [scanMode, setScanMode] = useState<"basic" | "advanced">("basic")

  // Estados para añadir producto manualmente
  const [manualTitle, setManualTitle] = useState<string>("")
  const [manualPrice, setManualPrice] = useState<string>("")

  // Añadir un estado para controlar mensajes de éxito
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Añadir un estado para la última actualización
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Referencias
  const isProcessingRef = useRef<boolean>(false)
  const isLoadingDataRef = useRef<boolean>(false)
  const unsubscribeRefs = useRef<{ [key: string]: () => void }>({})
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null)
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 15))
  const dataLoadedRef = useRef<boolean>(false)
  const initialLoadAttemptedRef = useRef<boolean>(false)

  // Implementar un enfoque optimista para la gestión de datos
  // Guardar datos en localStorage como respaldo
  const saveProductsToLocalStorage = (products: Product[]) => {
    try {
      localStorage.setItem("cached_products", JSON.stringify(products))
      localStorage.setItem("products_cache_time", new Date().toISOString())
    } catch (error) {
      console.error("Error al guardar productos en localStorage:", error)
    }
  }

  const saveStoresToLocalStorage = (stores: Store[]) => {
    try {
      localStorage.setItem("cached_stores", JSON.stringify(stores))
      localStorage.setItem("stores_cache_time", new Date().toISOString())
    } catch (error) {
      console.error("Error al guardar tiendas en localStorage:", error)
    }
  }

  const loadProductsFromLocalStorage = (): Product[] => {
    try {
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        return JSON.parse(cachedProducts)
      }
    } catch (error) {
      console.error("Error al cargar productos desde localStorage:", error)
    }
    return []
  }

  const loadStoresFromLocalStorage = (): Store[] => {
    try {
      const cachedStores = localStorage.getItem("cached_stores")
      if (cachedStores) {
        const stores = JSON.parse(cachedStores)
        // Asegurarse de que siempre exista la tienda "Total"
        const hasTotal = stores.some((store: Store) => store.name === "Total")
        if (!hasTotal) {
          stores.unshift({ id: "total", name: "Total" })
        }
        return stores
      }
    } catch (error) {
      console.error("Error al cargar tiendas desde localStorage:", error)
    }
    return [{ id: "total", name: "Total" }]
  }

  // Función para resetear la selección
  const resetSelection = () => {
    // Resetear los estados de selección
    setTitleRect(null)
    setPriceRect(null)
    setSelectionsReady(false)
    setRect(null)

    // Importante: Reiniciar el modo de selección según el modo de escaneo actual
    setSelectionMode(null) // Permitir que el usuario active el modo de selección nuevamente

    // Limpiar cualquier mensaje de error
    setErrorMessage(null)
  }

  // Función para resetear el estado
  const resetState = () => {
    setImageSrc(null)
    resetSelection()
    setDebugText(null)
    setDebugSteps([])
    setManualTitle("")
    setManualPrice("")
    setErrorMessage(null)
    // Limpiar el flag de captura de imagen
    localStorage.removeItem("image_capture_in_progress")
    // No reseteamos las tiendas ni los productos aquí
    // Y no cambiamos la tienda activa
  }

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !isLoadingDataRef.current) {
        isLoadingDataRef.current = true
        try {
          setIsLoading(true)
          console.log("Cargando datos del usuario:", user.id)

          // Intentar cargar datos desde localStorage primero para mostrar algo rápidamente
          const cachedStores = loadStoresFromLocalStorage()
          const cachedProducts = loadProductsFromLocalStorage()

          if (cachedStores.length > 0) {
            console.log("Usando tiendas en caché mientras se cargan datos frescos...")
            setStores(cachedStores)

            // Guardar la tienda activa actual antes de cualquier cambio
            const currentActiveStoreId = activeStoreId

            // Solo establecer la tienda activa si no hay ninguna seleccionada
            if (!currentActiveStoreId || currentActiveStoreId === "") {
              const totalStore = cachedStores.find((store) => store.name === "Total")
              if (totalStore) {
                console.log("No hay tienda activa, estableciendo Total como predeterminada:", totalStore.id)
                setActiveStoreId(totalStore.id)
              } else if (cachedStores.length > 0) {
                setActiveStoreId(cachedStores[0].id)
              }
            }
          }

          if (cachedProducts.length > 0) {
            console.log("Usando productos en caché mientras se cargan datos frescos...")
            setProducts(cachedProducts)
          }

          // Primero cargar las tiendas
          try {
            console.log("Solicitando tiendas desde la API...")
            const stores = await StoreService.getStores(user.id)
            console.log("Tiendas cargadas:", stores.length)

            if (stores && stores.length > 0) {
              setStores(stores)
              saveStoresToLocalStorage(stores)

              // Verificar si es la primera carga de la página
              if (initialLoadAttemptedRef.current === false) {
                initialLoadAttemptedRef.current = true
                // Establecer "Total" como tienda activa en la primera carga
                const totalStore = stores.find((store) => store.name === "Total")
                if (totalStore) {
                  console.log("Primera carga: estableciendo Total como tienda activa:", totalStore.id)
                  setActiveStoreId(totalStore.id)
                } else if (stores.length > 0) {
                  setActiveStoreId(stores[0].id)
                }
              } else {
                // Para cargas posteriores, solo establecer la tienda activa si no hay ninguna seleccionada
                if (!activeStoreId || activeStoreId === "") {
                  const totalStore = stores.find((store) => store.name === "Total")
                  if (totalStore) {
                    console.log("No hay tienda activa, estableciendo Total como predeterminada:", totalStore.id)
                    setActiveStoreId(totalStore.id)
                  } else if (stores.length > 0) {
                    setActiveStoreId(stores[0].id)
                  }
                }
              }
            }
          } catch (storeError) {
            console.error("Error al cargar tiendas:", storeError)
          }

          // Luego cargar los productos directamente desde la API
          try {
            console.log("Solicitando productos desde la API...")
            const products = await ProductService.getProducts(user.id)
            if (products && products.length > 0) {
              console.log("Productos cargados:", products.length)
              setProducts(products)
              saveProductsToLocalStorage(products)
            } else {
              console.log("No se encontraron productos o la respuesta está vacía")
              setProducts([])
            }
          } catch (productError) {
            console.error("Error al cargar productos:", productError)
          }

          // Actualizar la hora de la última actualización
          setLastUpdate(new Date())
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error)
          setErrorMessage("Error al cargar datos. Por favor, recarga la página.")
        } finally {
          setIsLoading(false)
          isLoadingDataRef.current = false
          dataLoadedRef.current = true
        }
      }
    }

    // Cargar datos al montar el componente o cuando cambia el usuario
    console.log("Iniciando carga de datos (montaje o cambio de usuario)...")
    loadUserData()

    // También recargar cuando la ventana recupera el foco
    const handleFocus = () => {
      console.log("Ventana recuperó el foco, recargando solo productos y tiendas sin cambiar la tienda activa...")
      // Solo recargar productos y tiendas, sin cambiar la tienda activa
      reloadDataWithoutChangingStore()
    }

    // Recargar cuando la página se vuelve visible (útil para cambios de pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Página visible nuevamente, recargando solo productos y tiendas sin cambiar la tienda activa...")
        // Solo recargar productos y tiendas, sin cambiar la tienda activa
        reloadDataWithoutChangingStore()
      }
    }

    // Añadir esta nueva función para recargar datos sin cambiar la tienda activa
    const reloadDataWithoutChangingStore = async () => {
      if (user && !isLoadingDataRef.current) {
        isLoadingDataRef.current = true
        try {
          // No establecer isLoading para evitar mostrar spinners innecesarios
          console.log("Recargando datos sin cambiar la tienda activa...")

          // Recargar tiendas
          try {
            const stores = await StoreService.getStores(user.id)
            if (stores && stores.length > 0) {
              // Mantener la tienda activa actual
              setStores(stores)
              saveStoresToLocalStorage(stores)
            }
          } catch (storeError) {
            console.error("Error al recargar tiendas:", storeError)
          }

          // Recargar productos
          try {
            const products = await ProductService.getProducts(user.id)
            if (products && products.length > 0) {
              setProducts(products)
              saveProductsToLocalStorage(products)
            }
          } catch (productError) {
            console.error("Error al recargar productos:", productError)
          }

          // Actualizar la hora de la última actualización
          setLastUpdate(new Date())
        } catch (error) {
          console.error("Error al recargar datos:", error)
        } finally {
          isLoadingDataRef.current = false
        }
      }
    }

    // Recargar cuando la página se recarga completamente
    const handlePageLoad = () => {
      console.log("Página recargada completamente, asegurando datos frescos...")
      loadUserData()
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("load", handlePageLoad)

    // Limpiar los event listeners al desmontar
    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("load", handlePageLoad)
    }
  }, [user, activeStoreId])

  // Configurar el canal de broadcast para sincronización entre ventanas
  useEffect(() => {
    if (user) {
      console.log("Configurando canal de broadcast para el usuario:", user.id)

      // Configurar el canal de broadcast
      const broadcastChannel = realtimeService.setupBroadcastChannel(user.id)

      // Suscribirse a eventos de sincronización
      broadcastChannel
        .on("broadcast", { event: "sync_products" }, (payload) => {
          console.log("Recibido evento de sincronización de productos:", payload)

          // Verificar que no sea un evento enviado por esta misma instancia
          if (payload.payload.clientId === clientIdRef.current) {
            console.log("Ignorando evento enviado por esta misma instancia")
            return
          }

          const { action, data } = payload.payload
          console.log(`Procesando acción ${action} para producto:`, data)

          if (action === "add") {
            setProducts((prevProducts) => {
              // Verificar si el producto ya existe
              const exists = prevProducts.some((p) => p.id === data.id)
              if (exists) {
                console.log("El producto ya existe, no se añade:", data.id)
                return prevProducts
              }
              console.log("Añadiendo nuevo producto al estado desde broadcast:", data)
              const updatedProducts = [...prevProducts, data]
              saveProductsToLocalStorage(updatedProducts)
              return updatedProducts
            })
          } else if (action === "update") {
            setProducts((prevProducts) => {
              const updatedProducts = prevProducts.map((product) => (product.id === data.id ? data : product))
              saveProductsToLocalStorage(updatedProducts)
              return updatedProducts
            })
          } else if (action === "delete") {
            setProducts((prevProducts) => {
              const updatedProducts = prevProducts.filter((product) => product.id !== data.id)
              saveProductsToLocalStorage(updatedProducts)
              return updatedProducts
            })
          }
        })
        .on("broadcast", { event: "sync_stores" }, (payload) => {
          console.log("Recibido evento de sincronización de tiendas:", payload)

          // Verificar que no sea un evento enviado por esta misma instancia
          if (payload.payload.clientId === clientIdRef.current) {
            console.log("Ignorando evento enviado por esta misma instancia")
            return
          }

          const { action, data } = payload.payload

          if (action === "add") {
            setStores((prevStores) => {
              // Verificar si la tienda ya existe
              const exists = prevStores.some((s) => s.id === data.id)
              if (exists) return prevStores
              const updatedStores = [...prevStores, data]
              saveStoresToLocalStorage(updatedStores)
              return updatedStores
            })
          } else if (action === "update") {
            setStores((prevStores) => {
              // Asegurarnos de preservar todos los campos necesarios
              const updatedStores = prevStores.map((store) =>
                store.id === data.id
                  ? {
                      ...store,
                      name: data.name !== undefined ? data.name : store.name,
                      image: data.image !== undefined ? data.image : store.image,
                      isDefault: data.isDefault !== undefined ? data.isDefault : store.isDefault,
                    }
                  : store,
              )
              saveStoresToLocalStorage(updatedStores)
              return updatedStores
            })
          } else if (action === "delete") {
            setStores((prevStores) => {
              const updatedStores = prevStores.filter((store) => store.id !== data.id)
              saveStoresToLocalStorage(updatedStores)

              // Si la tienda activa es la que se eliminó, cambiar a otra tienda disponible
              if (activeStoreId === data.id) {
                const totalStore = updatedStores.find((store) => store.name === "Total")
                const availableStores = updatedStores.filter((store) => store.id !== data.id)
                setActiveStoreId(totalStore ? totalStore.id : availableStores[0]?.id || "")
              }

              return updatedStores
            })
          }
        })

      // Guardar la referencia al canal
      broadcastChannelRef.current = broadcastChannel

      // Limpiar al desmontar
      return () => {
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.unsubscribe()
          broadcastChannelRef.current = null
        }
      }
    }
  }, [user])

  // Suscribirse a cambios en tiempo real cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      console.log("Configurando suscripciones en tiempo real para el usuario:", user.id)

      // Cancelar suscripciones anteriores si existen
      Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      })

      // Variable para controlar si el componente está montado
      let isMounted = true

      // Suscribirse a cambios en productos
      const unsubscribeProducts = realtimeService.subscribeToProducts(
        user.id,
        // Callback para nuevos productos
        (newProduct) => {
          if (!isMounted) return
          console.log("Nuevo producto recibido en tiempo real:", newProduct)
          setProducts((prevProducts) => {
            // Verificar si el producto ya existe (para evitar duplicados)
            const exists = prevProducts.some((p) => p.id === newProduct.id)
            if (exists) {
              console.log("El producto ya existe, no se añade:", newProduct.id)
              return prevProducts
            }
            console.log("Añadiendo nuevo producto al estado:", newProduct)
            const updatedProducts = [...prevProducts, newProduct]
            saveProductsToLocalStorage(updatedProducts)
            return updatedProducts
          })
        },
        // Callback para productos actualizados
        (updatedProduct) => {
          if (!isMounted) return
          console.log("Producto actualizado recibido en tiempo real:", updatedProduct)
          setProducts((prevProducts) => {
            const updated = prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
            console.log("Estado de productos actualizado")
            saveProductsToLocalStorage(updated)
            return updated
          })
        },
        // Callback para productos eliminados
        (deletedId) => {
          if (!isMounted) return
          console.log("Producto eliminado recibido en tiempo real:", deletedId)
          setProducts((prevProducts) => {
            console.log("Filtrando producto con ID:", deletedId)
            console.log("Productos antes de filtrar:", prevProducts.length)
            const filtered = prevProducts.filter((product) => {
              const keep = product.id !== deletedId
              if (!keep) {
                console.log("Eliminando producto del estado:", product.id)
              }
              return keep
            })
            console.log("Productos después de filtrar:", filtered.length)
            saveProductsToLocalStorage(filtered)
            return filtered
          })
        },
      )

      // Suscribirse a cambios en tiendas
      const unsubscribeStores = realtimeService.subscribeToStores(
        user.id,
        // Callback para nuevas tiendas
        (newStore) => {
          if (!isMounted) return
          console.log("Nueva tienda recibida en tiempo real:", newStore)
          setStores((prevStores) => {
            // Verificar si la tienda ya existe (para evitar duplicados)
            const exists = prevStores.some((s) => s.id === newStore.id)
            if (exists) return prevStores
            const updatedStores = [...prevStores, newStore]
            saveStoresToLocalStorage(updatedStores)
            return updatedStores
          })
        },
        // Callback para tiendas actualizadas
        (updatedStore) => {
          if (!isMounted) return
          console.log("Tienda actualizada recibida en tiempo real:", updatedStore)
          setStores((prevStores) => {
            const updatedStores = prevStores.map((store) => (store.id === updatedStore.id ? updatedStore : store))
            saveStoresToLocalStorage(updatedStores)
            return updatedStores
          })
        },
        // Callback para tiendas eliminadas
        (deletedId) => {
          if (!isMounted) return
          console.log("Tienda eliminada recibida en tiempo real:", deletedId)
          setStores((prevStores) => {
            const updatedStores = prevStores.filter((store) => store.id !== deletedId)
            saveStoresToLocalStorage(updatedStores)

            // Si la tienda activa es la que se eliminó, cambiar a otra tienda disponible
            if (activeStoreId === deletedId) {
              const totalStore = updatedStores.find((store) => store.name === "Total")
              const availableStores = updatedStores.filter((store) => store.id !== deletedId)
              setActiveStoreId(totalStore ? totalStore.id : availableStores[0]?.id || "")
            }

            return updatedStores
          })
        },
      )

      // Guardar las funciones de cancelación
      unsubscribeRefs.current = {
        products: unsubscribeProducts,
        stores: unsubscribeStores,
      }

      // Limpiar suscripciones al desmontar
      return () => {
        console.log("Limpiando suscripciones en tiempo real")
        isMounted = false
        Object.values(unsubscribeRefs.current).forEach((unsubscribe) => {
          if (typeof unsubscribe === "function") {
            unsubscribe()
          }
        })
      }
    }
  }, [user, activeStoreId, stores])

  // Resto del código...

  // Renderizar el componente
  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Calcuapp</h1>
        </div>

        {/* Resto del JSX... */}
      </div>
      <Footer />
    </>
  )
}
