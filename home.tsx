"use client"

import { useState, useEffect, useRef } from "react"
import Tesseract from "tesseract.js"
import type { Product, Store, Rectangle } from "./types"
import Header from "./components/header"
import ImageUploader from "./components/image-uploader"
import ImageEditor from "./components/image-editor"
import StoreSelector from "./components/store-selector"
import ProductList from "./components/product-list"
import ManualProductForm from "./components/manual-product-form"
import TotalSummary from "./components/total-summary"
import Footer from "./components/footer"
import { useAuth } from "./contexts/auth-context"
// Importar los servicios
import { StoreService } from "./services/store-service"
import { ProductService } from "./services/product-service"
// Importar el servicio de tiempo real
import { realtimeService } from "./lib/supabase/realtime-service"
// Importar la función de verificación
import { checkRealtimeSubscriptions } from "./lib/supabase/check-realtime"
import type { RealtimeChannel } from "@supabase/supabase-js"

export default function Home() {
  // Resto del código sin cambios...
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

  // Referencias
  const isProcessingRef = useRef<boolean>(false)
  const isLoadingDataRef = useRef<boolean>(false)
  const unsubscribeRefs = useRef<{ [key: string]: () => void }>({})
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null)
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 15))
  const dataLoadedRef = useRef<boolean>(false)
  const initialLoadAttemptedRef = useRef<boolean>(false)

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !isLoadingDataRef.current && !initialLoadAttemptedRef.current) {
        initialLoadAttemptedRef.current = true
        isLoadingDataRef.current = true
        try {
          setIsLoading(true)
          console.log("Cargando datos del usuario:", user.id)

          // Primero cargar las tiendas
          try {
            const stores = await StoreService.getStores(user.id)
            console.log("Tiendas cargadas:", stores.length)

            if (stores && stores.length > 0) {
              setStores(stores)

              // Establecer "total" como tienda activa por defecto o la primera tienda disponible
              const totalStore = stores.find((store) => store.name === "Total")
              if (totalStore) {
                console.log("Tienda Total encontrada con ID:", totalStore.id)
                setActiveStoreId(totalStore.id)
              } else if (stores.length > 0) {
                setActiveStoreId(stores[0].id)
              }
            }
          } catch (storeError) {
            console.error("Error al cargar tiendas:", storeError)
          }

          // Luego cargar los productos
          try {
            console.log("Cargando productos...")
            const products = await ProductService.getProducts(user.id)
            if (products && products.length > 0) {
              console.log("Productos cargados:", products.length)
              setProducts(products)
            } else {
              console.log("No se encontraron productos o la respuesta está vacía")
            }
          } catch (productError) {
            console.error("Error al cargar productos:", productError)
          }
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error)
          setErrorMessage("Error al cargar datos. Por favor, recarga la página.")
        } finally {
          setIsLoading(false)
          isLoadingDataRef.current = false
        }
      }
    }

    loadUserData()
  }, [user])

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
              return [...prevProducts, data]
            })
          } else if (action === "update") {
            setProducts((prevProducts) => prevProducts.map((product) => (product.id === data.id ? data : product)))
          } else if (action === "delete") {
            setProducts((prevProducts) => prevProducts.filter((product) => product.id !== data.id))
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
              return [...prevStores, data]
            })
          } else if (action === "update") {
            setStores((prevStores) => {
              // Asegurarnos de preservar todos los campos necesarios
              return prevStores.map((store) =>
                store.id === data.id
                  ? {
                      ...store,
                      name: data.name !== undefined ? data.name : store.name,
                      image: data.image !== undefined ? data.image : store.image,
                      isDefault: data.isDefault !== undefined ? data.isDefault : store.isDefault,
                    }
                  : store,
              )
            })
          } else if (action === "delete") {
            setStores((prevStores) => prevStores.filter((store) => store.id !== data.id))

            // Si la tienda activa es la que se eliminó, cambiar a otra tienda disponible
            if (activeStoreId === data.id) {
              const totalStore = stores.find((store) => store.name === "Total")
              const availableStores = stores.filter((store) => store.id !== data.id)
              setActiveStoreId(totalStore ? totalStore.id : availableStores[0]?.id || "")
            }
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
            return [...prevProducts, newProduct]
          })
        },
        // Callback para productos actualizados
        (updatedProduct) => {
          if (!isMounted) return
          console.log("Producto actualizado recibido en tiempo real:", updatedProduct)
          setProducts((prevProducts) => {
            const updated = prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
            console.log("Estado de productos actualizado")
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
            return [...prevStores, newStore]
          })
        },
        // Callback para tiendas actualizadas
        (updatedStore) => {
          if (!isMounted) return
          console.log("Tienda actualizada recibida en tiempo real:", updatedStore)
          setStores((prevStores) => prevStores.map((store) => (store.id === updatedStore.id ? updatedStore : store)))
        },
        // Callback para tiendas eliminadas
        (deletedId) => {
          if (!isMounted) return
          console.log("Tienda eliminada recibida en tiempo real:", deletedId)
          setStores((prevStores) => prevStores.filter((store) => store.id !== deletedId))

          // Si la tienda activa es la que se eliminó, cambiar a otra tienda disponible
          if (activeStoreId === deletedId) {
            const totalStore = stores.find((store) => store.name === "Total")
            const availableStores = stores.filter((store) => store.id !== deletedId)
            setActiveStoreId(totalStore ? totalStore.id : availableStores[0]?.id || "")
          }
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

  // Añadir un useEffect para verificar las suscripciones
  useEffect(() => {
    if (user) {
      // Verificar que las suscripciones en tiempo real estén funcionando
      checkRealtimeSubscriptions(user.id).then((isWorking) => {
        if (!isWorking) {
          console.warn("Las suscripciones en tiempo real pueden no estar funcionando correctamente")
          // Eliminamos el mensaje de error para el usuario
          // setErrorMessage("La sincronización en tiempo real puede no estar funcionando correctamente. Algunas actualizaciones podrían requerir refrescar la página.")
        } else {
          console.log("Suscripciones en tiempo real verificadas correctamente")
        }
      })
    }
  }, [user])

  // Calcular subtotales por tienda
  useEffect(() => {
    const subtotals: { [key: string]: number } = {}

    // Inicializar subtotales para todas las tiendas
    stores.forEach((store) => {
      subtotals[store.id] = 0
    })

    // Calcular subtotales
    products.forEach((product) => {
      const storeId = product.storeId
      if (!subtotals[storeId]) {
        subtotals[storeId] = 0
      }
      subtotals[storeId] += product.price * product.quantity
    })

    setStoreSubtotals(subtotals)
  }, [products, stores])

  // Añadir un nuevo useEffect para resetear la imagen cuando cambiamos de tienda
  // Añadir este código después del useEffect que calcula los subtotales por tienda

  // Resetear la imagen y selecciones cuando cambiamos de tienda
  useEffect(() => {
    // Resetear la imagen y las selecciones cuando cambiamos de tienda
    resetState()
  }, [activeStoreId])

  // Generar un ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  // Función para añadir una tienda
  const handleAddStore = async (name: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      const newStore = await StoreService.addStore(user.id, name)

      // Actualizar el estado local inmediatamente
      setStores((prevStores) => {
        // Verificar si la tienda ya existe
        const exists = prevStores.some((s) => s.id === newStore.id)
        if (exists) return prevStores
        return [...prevStores, newStore]
      })

      // Enviar evento de broadcast para sincronizar otras ventanas
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: "broadcast",
          event: "sync_stores",
          payload: {
            action: "add",
            data: newStore,
            clientId: clientIdRef.current,
          },
        })
      }

      setActiveStoreId(newStore.id)
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      setErrorMessage("Error al añadir tienda")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar una tienda
  const handleUpdateStore = async (storeId: string, name: string, image?: string) => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log(
        "Actualizando tienda:",
        storeId,
        name,
        image ? `Imagen presente (${image.length} caracteres)` : "Sin imagen",
      )

      // Mostrar mensaje de carga
      setSuccessMessage("Actualizando tienda...")

      const updatedStore = await StoreService.updateStore(user.id, storeId, name, image)

      // Actualizar el estado local inmediatamente
      setStores((prevStores) => prevStores.map((store) => (store.id === storeId ? { ...store, name, image } : store)))

      // Enviar evento de broadcast para sincronizar otras ventanas
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: "broadcast",
          event: "sync_stores",
          payload: {
            action: "update",
            data: {
              id: storeId,
              name,
              image,
              isDefault: stores.find((store) => store.id === storeId)?.isDefault || false,
            },
            clientId: clientIdRef.current,
          },
        })
      }

      // Mostrar mensaje de éxito temporal
      setSuccessMessage("¡Tienda actualizada correctamente!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      setErrorMessage(`Error al actualizar tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función handleDeleteStore para asegurar que la eliminación se complete correctamente
  const handleDeleteStore = async (storeId: string): Promise<void> => {
    if (!user) return

    // No permitir eliminar la tienda "Total"
    const totalStore = stores.find((store) => store.name === "Total")
    if (storeId === totalStore?.id) return

    try {
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Eliminando tienda...")

      // Primero eliminar la tienda del estado local para una respuesta inmediata
      setStores((prevStores) => prevStores.filter((store) => store.id !== storeId))

      // Si la tienda activa es la que se está eliminando, cambiar a otra tienda disponible
      if (activeStoreId === storeId) {
        const availableStores = stores.filter((store) => store.id !== storeId)
        setActiveStoreId(availableStores.length > 0 ? availableStores[0].id : totalStore?.id || "")
      }

      // Luego eliminar la tienda de la base de datos
      const success = await StoreService.deleteStore(user.id, storeId)
      console.log("Tienda eliminada correctamente en la base de datos:", success)

      // Enviar evento de broadcast para sincronizar otras ventanas
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: "broadcast",
          event: "sync_stores",
          payload: {
            action: "delete",
            data: { id: storeId },
            clientId: clientIdRef.current,
          },
        })
      }

      // Recargar todas las tiendas para asegurar sincronización
      // Añadir un pequeño retraso para asegurar que la eliminación se haya propagado
      setTimeout(async () => {
        try {
          const updatedStores = await StoreService.getStores(user.id)
          setStores(updatedStores)
          console.log("Tiendas recargadas después de eliminar:", updatedStores.length)
        } catch (loadError) {
          console.error("Error al recargar tiendas después de eliminar:", loadError)
        }
      }, 500)

      // Mostrar mensaje de éxito
      setSuccessMessage("Tienda eliminada correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      setErrorMessage(`Error al eliminar tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)

      // Recargar tiendas en caso de error para restaurar el estado correcto
      try {
        const updatedStores = await StoreService.getStores(user.id)
        setStores(updatedStores)
      } catch (loadError) {
        console.error("Error al recargar tiendas después de error:", loadError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para extraer precios del texto
  const extractPricesFromText = (text: string) => {
    const debug: string[] = []
    debug.push(`Texto original: "${text}"`)

    // Buscar patrones de "ref: X.XX" o "ref: X,XX"
    const refRegex = /ref:?\s*(\d+(?:[,.]\d{1,2})?)/gi
    const refMatches = [...text.matchAll(refRegex)].map((match) => match[1])
    debug.push(`Patrones con "ref:": ${JSON.stringify(refMatches)}`)

    // Buscar patrones de precio con símbolos de moneda
    const currencyRegex = /[$€£¥]?\s*\d+(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?\s*[$€£¥]/g
    const currencyMatches = text.match(currencyRegex) || []
    debug.push(`Patrones con símbolo de moneda: ${JSON.stringify(currencyMatches)}`)

    // Limpiamos el texto para buscar otros patrones
    const cleanedText = text
      .replace(/\s+/g, " ") // Normalizar espacios
      .replace(/[^\d\s,.]/g, "") // Mantener solo dígitos, espacios, comas y puntos
      .trim()

    debug.push(`Texto limpio: "${cleanedText}"`)

    // Buscar patrones completos como "2,99" o "2.99" (números decimales aislados)
    const decimalPriceRegex = /\b\d+[,.]\d{1,2}\b/g
    const decimalMatches = cleanedText.match(decimalPriceRegex) || []
    debug.push(`Patrones decimales encontrados: ${JSON.stringify(decimalMatches)}`)

    // Buscar números enteros que podrían ser precios
    const integerPriceRegex = /\b\d{1,4}\b/g
    const integerMatches = cleanedText.match(integerPriceRegex) || []
    debug.push(`Números enteros encontrados: ${JSON.stringify(integerMatches)}`)

    // Buscar patrones que podrían ser precios fragmentados
    const fragments = cleanedText.split(/\s+/)
    debug.push(`Fragmentos: ${JSON.stringify(fragments)}`)

    const reconstructedPrices: string[] = []

    // Procesar los patrones decimales encontrados
    const normalizedDecimalPrices = decimalMatches.map((price) => {
      // Si ya tiene un punto decimal, dejarlo como está
      if (price.includes(".")) {
        return price
      }
      // Si tiene coma, convertirla a punto
      return price.replace(",", ".")
    })

    // Procesar los precios con "ref:"
    const normalizedRefPrices = refMatches.map((price) => {
      // Si ya tiene un punto decimal, dejarlo como está
      if (price.includes(".")) {
        return price
      }
      // Si tiene coma, convertirla a punto
      return price.replace(",", ".")
    })

    // Procesar los precios con símbolos de moneda
    const normalizedCurrencyPrices = currencyMatches.map((price) => {
      // Eliminar símbolos de moneda y espacios
      const cleanPrice = price.replace(/[$€£¥\s]/g, "")
      // Si ya tiene un punto decimal, dejarlo como está
      if (cleanPrice.includes(".")) {
        return cleanPrice
      }
      // Si tiene coma, convertirla a punto
      return price.replace(",", ".")
    })

    debug.push(`Precios reconstruidos: ${JSON.stringify(reconstructedPrices)}`)

    // Combinar todos los precios encontrados con prioridad
    const allPotentialPrices = [
      ...normalizedRefPrices, // Prioridad 1: Precios con "ref:"
      ...normalizedDecimalPrices, // Prioridad 2: Precios decimales explícitos
      ...normalizedCurrencyPrices, // Prioridad 3: Precios con símbolos de moneda
      ...reconstructedPrices, // Prioridad 4: Precios reconstruidos
    ]

    // Añadir números enteros solo si no hay otros precios encontrados
    if (allPotentialPrices.length === 0) {
      allPotentialPrices.push(...integerMatches)
    }

    debug.push(`Todos los precios potenciales: ${JSON.stringify(allPotentialPrices)}`)

    // Convertir a números y filtrar valores válidos
    const validPrices = allPotentialPrices
      .map((priceStr) => {
        const num = Number.parseFloat(priceStr)
        debug.push(`Conversión: "${priceStr}" => ${num}`)
        return num
      })
      .filter((price) => {
        const isValid = !isNaN(price) && price > 0 && price < 10000
        debug.push(`Validación: ${price} => ${isValid ? "válido" : "inválido"}`)
        return isValid
      })

    // Eliminar duplicados
    const uniquePrices = [...new Set(validPrices)]
    debug.push(`Precios válidos finales: ${JSON.stringify(uniquePrices)}`)

    setDebugSteps(debug)
    return uniquePrices
  }

  // Función para extraer título del texto
  const extractTitleFromText = (text: string): string => {
    // Dividir el texto en líneas y filtrar líneas vacías
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 2)

    // Priorizar las primeras líneas como título del producto
    let productTitle = "Producto sin nombre"

    if (lines.length > 0) {
      // Tomar la primera línea que no sea un precio como título
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i]
        // Verificar que la línea no sea solo un número o precio
        if (!/^[$€£¥]?\s*\d+([,.]\d{1,2})?\s*[$€£¥]?$/.test(line) && !/ref:?\s*\d+(?:[,.]\d{1,2})?/i.test(line)) {
          productTitle = line
          break
        }
      }

      // Si no encontramos un título en las primeras líneas, usar la línea más larga
      if (productTitle === "Producto sin nombre" && lines.length > 3) {
        productTitle = lines
          .slice(0, Math.min(5, lines.length)) // Considerar solo las primeras 5 líneas
          .reduce(
            (longest, current) =>
              current.length > longest.length &&
              !/^[$€£¥]?\s*\d+([,.]\d{1,2})?\s*[$€£¥]?$/.test(current) &&
              !/ref:?\s*\d+(?:[,.]\d{1,2})?/i.test(current)
                ? current
                : longest,
            "Producto sin nombre",
          )
      }
    }

    return productTitle
  }

  // Función para añadir un producto a la base de datos
  const addProductToDatabase = async (product: Omit<Product, "id" | "isEditing">) => {
    if (!user) return null

    try {
      console.log("Añadiendo producto a la base de datos:", product)
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Añadiendo producto...")

      await ProductService.addProduct(user.id, product)
      console.log("Producto añadido correctamente en la base de datos")

      // Recargar todos los productos para asegurar sincronización
      const updatedProducts = await ProductService.getProducts(user.id)
      setProducts(updatedProducts)

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al añadir producto:", error)
      setErrorMessage(`Error al añadir producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Función para procesar la imagen completa
  const processFullImage = async () => {
    // Evitar procesamiento duplicado
    if (isProcessingRef.current || isLoading) return
    isProcessingRef.current = true

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    if (!imageSrc) {
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve) => (img.onload = resolve))

      // Process with Tesseract using the correct API
      const worker = await Tesseract.createWorker()

      // Recognize text from the full image
      const result = await worker.recognize(img)

      // Clean up
      await worker.terminate()

      const fullText = result.data.text
      console.log("Texto completo extraído:", fullText)
      setDebugText(fullText)

      // Extraer precios del texto
      const prices = extractPricesFromText(fullText)

      // Extraer título del texto
      const productTitle = extractTitleFromText(fullText)

      // Si encontramos precios, creamos un nuevo producto con la descripción extraída
      if (prices.length > 0) {
        const productData = {
          title: productTitle,
          price: prices[0], // Tomamos el primer precio encontrado
          quantity: 1,
          isEditing: false,
          image: imageSrc, // Guardar la imagen completa
          storeId: activeStoreId,
        }

        // Añadir el producto a la base de datos
        // La función addProductToDatabase ya actualiza el estado local
        await addProductToDatabase(productData)

        setManualTitle(productTitle) // También actualizamos el campo manual por si el usuario quiere añadir más productos similares
        setManualPrice(prices[0].toString()) // Actualizar el campo de precio manual
      } else {
        // Si no encontramos precios pero sí descripción, actualizamos el campo manual
        if (productTitle !== "Producto sin nombre") {
          setManualTitle(productTitle)
        }
        setErrorMessage("No se encontraron precios válidos en la imagen")
      }
    } catch (error) {
      console.error("Error al procesar la imagen:", error)
      setErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  // Función para procesar el área seleccionada
  const processSelectedArea = async () => {
    // Evitar procesamiento duplicado
    if (isProcessingRef.current || isLoading) return
    isProcessingRef.current = true

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    if (!rect || !imageSrc) {
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve) => (img.onload = resolve))

      console.log("Procesando área:", rect)

      // Validate rect coordinates to ensure they're within image boundaries
      const validX = Math.max(0, Math.min(rect.x, img.width))
      const validY = Math.max(0, Math.min(rect.y, img.height))
      const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
      const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

      // Skip processing if the area is too small
      if (validWidth < 5 || validHeight < 5) {
        setErrorMessage("El área seleccionada es demasiado pequeña para procesar")
        setIsLoading(false)
        isProcessingRef.current = false
        return
      }

      // Create a temporary canvas for the cropped area
      const croppedCanvas = document.createElement("canvas")
      croppedCanvas.width = validWidth
      croppedCanvas.height = validHeight
      const croppedCtx = croppedCanvas.getContext("2d")

      if (!croppedCtx) {
        setErrorMessage("No se pudo crear el contexto del canvas")
        setIsLoading(false)
        isProcessingRef.current = false
        return
      }

      // Draw the cropped area onto the temporary canvas
      croppedCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

      // Guardar la imagen recortada como data URL
      const croppedImageSrc = croppedCanvas.toDataURL("image/jpeg", 0.8) // Usar JPEG con compresión

      // Mejorar el contraste para ayudar al OCR
      const imageData = croppedCtx.getImageData(0, 0, validWidth, validHeight)
      const data = imageData.data

      // Aumentar el contraste
      for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises para mejorar el reconocimiento de texto
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        const newValue = avg > 128 ? 255 : 0 // Alto contraste blanco/negro

        data[i] = newValue // R
        data[i + 1] = newValue // G
        data[i + 2] = newValue // B
      }

      croppedCtx.putImageData(imageData, 0, 0)

      // Process with Tesseract using the correct API
      const worker = await Tesseract.createWorker()

      // Primero, reconocer todo el texto para extraer título y otra información
      const fullTextResult = await worker.recognize(croppedCanvas)
      const fullText = fullTextResult.data.text
      console.log("Texto completo del área seleccionada:", fullText)
      setDebugText(fullText)

      // Ahora, hacer un reconocimiento optimizado para números para extraer precios
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789,.$€£¥refREF:", // Incluir símbolos de moneda, coma y "ref:"
      })
      const priceResult = await worker.recognize(croppedCanvas)

      // Clean up
      await worker.terminate()

      const priceText = priceResult.data.text
      console.log("Texto optimizado para precios:", priceText)

      // Extraer precios del texto
      const prices = extractPricesFromText(fullText)

      // Extraer título del texto
      const productTitle = extractTitleFromText(fullText)

      // Si no encontramos precios en el texto completo, intentar con el texto optimizado para precios
      if (prices.length === 0) {
        const pricesPriceText = extractPricesFromText(priceText)
        if (pricesPriceText.length > 0) {
          prices.push(...pricesPriceText)
        }
      }

      // Si encontramos precios, creamos un nuevo producto con la descripción extraída
      if (prices.length > 0) {
        const productData = {
          title: productTitle,
          price: prices[0], // Tomamos el primer precio encontrado
          quantity: 1,
          isEditing: false,
          image: imageSrc, // Guardar la imagen completa
          storeId: activeStoreId,
        }

        // Añadir el producto a la base de datos
        // La función addProductToDatabase ya actualiza el estado local
        await addProductToDatabase(productData)

        setManualTitle(productTitle) // También actualizamos el campo manual por si el usuario quiere añadir más productos similares
        setManualPrice(prices[0].toString()) // Actualizar el campo de precio manual

        // Limpiar la selección después de procesar exitosamente
        resetSelection()
      } else {
        // Si no encontramos precios pero sí descripción, actualizamos el campo manual
        if (productTitle !== "Producto sin nombre") {
          setManualTitle(productTitle)
        }
        setErrorMessage("No se encontraron precios válidos en el área seleccionada")
      }
    } catch (error) {
      console.error("Error al procesar el área seleccionada:", error)
      setErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  // Función para procesar un área específica
  const processAreaForText = async (img: HTMLImageElement, rect: Rectangle) => {
    // Validate rect coordinates to ensure they're within image boundaries
    const validX = Math.max(0, Math.min(rect.x, img.width))
    const validY = Math.max(0, Math.min(rect.y, img.height))
    const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
    const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

    // Skip processing if the area is too small
    if (validWidth < 5 || validHeight < 5) {
      throw new Error("El área seleccionada es demasiado pequeña para procesar")
    }

    // Create a temporary canvas for the cropped area
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = validWidth
    tempCanvas.height = validHeight
    const tempCtx = tempCanvas.getContext("2d")

    if (!tempCtx) {
      throw new Error("No se pudo crear el contexto del canvas")
    }

    // Draw the cropped area onto the temporary canvas
    tempCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

    // Mejorar el contraste para ayudar al OCR
    const imageData = tempCtx.getImageData(0, 0, validWidth, validHeight)
    const data = imageData.data

    // Aumentar el contraste
    for (let i = 0; i < data.length; i += 4) {
      // Convertir a escala de grises para mejorar el reconocimiento de texto
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      const newValue = avg > 128 ? 255 : 0 // Alto contraste blanco/negro

      data[i] = newValue // R
      data[i + 1] = newValue // G
      data[i + 2] = newValue // B
    }

    tempCtx.putImageData(imageData, 0, 0)

    // Process with Tesseract
    const worker = await Tesseract.createWorker()
    const result = await worker.recognize(tempCanvas)
    await worker.terminate()

    return result.data.text
  }

  // Función para procesar ambas áreas seleccionadas
  const processBothAreas = async () => {
    // Evitar procesamiento duplicado
    if (isProcessingRef.current || isLoading) return
    isProcessingRef.current = true

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    if (!titleRect || !priceRect || !imageSrc) {
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve) => (img.onload = resolve))

      // Procesar el área del título
      const titleText = await processAreaForText(img, titleRect)

      // Procesar el área del precio
      const priceText = await processAreaForText(img, priceRect)

      // Extraer el título del texto
      const productTitle = extractTitleFromText(titleText)

      // Extraer el precio del texto
      const prices = extractPricesFromText(priceText)

      // Crear la imagen recortada del producto (usando el área del título)
      const croppedCanvas = document.createElement("canvas")
      croppedCanvas.width = titleRect.width
      croppedCanvas.height = titleRect.height
      const croppedCtx = croppedCanvas.getContext("2d")

      if (!croppedCtx) {
        setErrorMessage("No se pudo crear el contexto del canvas")
        setIsLoading(false)
        isProcessingRef.current = false
        return
      }

      // Dibujar el área del título en el canvas recortado
      croppedCtx.drawImage(
        img,
        titleRect.x,
        titleRect.y,
        titleRect.width,
        titleRect.height,
        0,
        0,
        titleRect.width,
        titleRect.height,
      )

      // Guardar la imagen recortada como data URL
      const croppedImageSrc = croppedCanvas.toDataURL("image/jpeg", 0.8)

      // Mostrar los resultados para depuración
      setDebugText(`Título: ${titleText}\n\nPrecio: ${priceText}`)

      // Si encontramos precios, creamos un nuevo producto
      if (prices.length > 0) {
        const productData = {
          title: productTitle,
          price: prices[0], // Tomamos el primer precio encontrado
          quantity: 1,
          isEditing: false,
          image: imageSrc, // Guardar la imagen completa
          storeId: activeStoreId,
        }

        // Añadir el producto a la base de datos
        // La función addProductToDatabase ya actualiza el estado local
        await addProductToDatabase(productData)

        setManualTitle(productTitle) // También actualizamos el campo manual
        setManualPrice(prices[0].toString()) // Actualizar el campo de precio manual

        // Limpiar las selecciones después de procesar
        resetSelection()
      } else {
        // Si no encontramos precios pero sí descripción, actualizamos el campo manual
        if (productTitle !== "Producto sin nombre") {
          setManualTitle(productTitle)
        }
        setErrorMessage("No se encontraron precios válidos en el área seleccionada")
      }
    } catch (error) {
      console.error("Error al procesar las áreas seleccionadas:", error)
      setErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  // Modificar la función resetState para que sea más completa
  const resetState = () => {
    setImageSrc(null)
    resetSelection()
    setDebugText(null)
    setDebugSteps([])
    setManualTitle("")
    setManualPrice("")
    setErrorMessage(null)
    // No reseteamos las tiendas ni los productos aquí
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

  // Función para añadir un producto manualmente
  const handleAddManualProduct = async (title: string, price: number, quantity: number, image?: string) => {
    if (!user) return

    try {
      console.log("Iniciando adición manual de producto:", title, price, quantity, image ? "con imagen" : "sin imagen")
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Añadiendo producto...")

      const productData = {
        title,
        price,
        quantity,
        storeId: activeStoreId,
        image, // Añadir la imagen si existe
        createdAt: new Date().toISOString(), // Añadir la fecha actual
      }

      // Añadir el producto a la base de datos
      await ProductService.addProduct(user.id, productData)
      console.log("Producto añadido correctamente en la base de datos")

      // Recargar todos los productos para asegurar sincronización
      const updatedProducts = await ProductService.getProducts(user.id)
      setProducts(updatedProducts)

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al añadir producto manualmente:", error)
      setErrorMessage(`Error al añadir producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar un producto
  const handleUpdateProduct = async (id: string, title: string, price: number, quantity: number) => {
    if (!user) return

    try {
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Actualizando producto...")

      await ProductService.updateProduct(user.id, id, {
        title,
        price,
        quantity,
        storeId: activeStoreId,
      })

      // Recargar todos los productos para asegurar sincronización
      const updatedProducts = await ProductService.getProducts(user.id)
      setProducts(updatedProducts)

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto actualizado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      setErrorMessage("Error al actualizar producto")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función handleRemoveProduct para asegurar que la eliminación se complete correctamente
  const handleRemoveProduct = async (id: string) => {
    if (!user) return

    try {
      console.log("Iniciando eliminación del producto:", id)
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Eliminando producto...")

      // Primero eliminar el producto del estado local para una respuesta inmediata
      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id))

      // Luego eliminar el producto de la base de datos
      const success = await ProductService.deleteProduct(user.id, id)
      console.log("Producto eliminado correctamente en la base de datos:", success)

      // Recargar todos los productos para asegurar sincronización
      // Añadir un pequeño retraso para asegurar que la eliminación se haya propagado
      setTimeout(async () => {
        try {
          const updatedProducts = await ProductService.getProducts(user.id)
          setProducts(updatedProducts)
          console.log("Productos recargados después de eliminar:", updatedProducts.length)
        } catch (loadError) {
          console.error("Error al recargar productos después de eliminar:", loadError)
        }
      }, 500)

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto eliminado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      setErrorMessage(`Error al eliminar producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)

      // Recargar productos en caso de error para restaurar el estado correcto
      try {
        const updatedProducts = await ProductService.getProducts(user.id)
        setProducts(updatedProducts)
      } catch (loadError) {
        console.error("Error al recargar productos después de error:", loadError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Añadir una función para limpiar la caché del navegador
  const clearBrowserCache = () => {
    // Intentar limpiar la caché del navegador
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
          console.log(`Caché ${name} eliminada`)
        })
      })
    }

    // También podemos intentar recargar sin caché
    const reloadWithoutCache = () => {
      console.log("Recargando sin caché...")
      window.location.reload(true)
    }

    // Añadir un botón para recargar sin caché si es necesario
    return (
      <button
        onClick={reloadWithoutCache}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm ml-2"
      >
        Recargar sin caché
      </button>
    )
  }

  // Modificar el useEffect para recargar los productos cuando la ventana recupera el foco
  useEffect(() => {
    // Función para recargar los productos
    const reloadProducts = async () => {
      if (user) {
        try {
          console.log("Recargando productos...")

          // Añadir un parámetro de timestamp para evitar la caché
          const timestamp = new Date().getTime()
          const freshProducts = await ProductService.getProducts(user.id)

          // Verificar si hay cambios antes de actualizar el estado
          const currentIds = products
            .map((p) => p.id)
            .sort()
            .join(",")
          const newIds = freshProducts
            .map((p) => p.id)
            .sort()
            .join(",")

          if (currentIds !== newIds) {
            console.log("Se detectaron cambios en los productos, actualizando estado...")
            setProducts(freshProducts)
          }

          console.log("Productos recargados correctamente:", freshProducts.length)
        } catch (error) {
          console.error("Error al recargar productos:", error)
        }
      }
    }

    // Recargar productos cuando la ventana recupera el foco
    const handleFocus = () => {
      console.log("Ventana recuperó el foco, recargando productos...")
      reloadProducts()
    }

    // También recargar productos cuando se monta el componente
    reloadProducts()

    window.addEventListener("focus", handleFocus)

    // Limpiar el event listener al desmontar
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [user, products.length]) // Añadir products.length como dependencia para detectar cambios

  // Añadir un nuevo useEffect para recargar los productos cuando cambia el usuario
  // Añadir después del useEffect que recarga los productos cuando la ventana recupera el foco:

  // Añadir un useEffect para recargar los productos periódicamente
  useEffect(() => {
    if (!user) return

    // Función para recargar los productos
    const reloadProductsData = async () => {
      try {
        console.log("Recargando productos periódicamente...")
        const freshProducts = await ProductService.getProducts(user.id)
        setProducts(freshProducts)
        console.log("Productos recargados correctamente:", freshProducts.length)
      } catch (error) {
        console.error("Error al recargar productos:", error)
      }
    }

    // Recargar productos cada 30 segundos
    const intervalId = setInterval(reloadProductsData, 30000)

    // Limpiar el intervalo al desmontar
    return () => {
      clearInterval(intervalId)
    }
  }, [user])

  // Declarar la función forceRefreshProducts
  const forceRefreshProducts = async () => {
    if (user) {
      try {
        setIsLoading(true)
        console.log("Forzando la recarga de productos...")
        const freshProducts = await ProductService.getProducts(user.id)
        setProducts(freshProducts)
        console.log("Productos recargados correctamente:", freshProducts.length)
      } catch (error) {
        console.error("Error al forzar la recarga de productos:", error)
        setErrorMessage("Error al actualizar la lista de productos.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Renderizar el componente
  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Calcuapp</h1>
        </div>

        {/* Selector de tiendas */}
        <StoreSelector
          stores={stores}
          activeStoreId={activeStoreId}
          onStoreChange={setActiveStoreId}
          onAddStore={handleAddStore}
          onDeleteStore={handleDeleteStore}
          onUpdateStore={handleUpdateStore}
        />

        {/* Verificar si estamos en la vista "Total" */}
        {activeStoreId !== stores.find((store) => store.name === "Total")?.id && (
          <>
            {/* Carga de imágenes - solo visible en tiendas específicas */}
            <ImageUploader onImageCapture={setImageSrc} />

            {/* Editor de imágenes - solo visible en tiendas específicas */}
            {imageSrc && (
              <ImageEditor
                imageSrc={imageSrc}
                onProcessFullImage={processFullImage}
                onProcessSelectedArea={processSelectedArea}
                onProcessBothAreas={processBothAreas}
                isLoading={isLoading}
                errorMessage={errorMessage}
                debugText={debugText}
                debugSteps={debugSteps}
                showDebugSteps={showDebugSteps}
                onToggleDebugSteps={() => setShowDebugSteps(!showDebugSteps)}
                rect={rect}
                setRect={setRect}
                titleRect={titleRect}
                setTitleRect={setTitleRect}
                priceRect={priceRect}
                setPriceRect={setPriceRect}
                scanMode={scanMode}
                setScanMode={setScanMode}
                selectionMode={selectionMode}
                setSelectionMode={setSelectionMode}
                selectionsReady={selectionsReady}
                setSelectionsReady={setSelectionsReady}
                resetSelection={resetSelection}
              />
            )}

            {/* Formulario para añadir productos manualmente - solo visible en tiendas específicas */}
            <ManualProductForm
              onAddProduct={handleAddManualProduct}
              initialTitle={manualTitle}
              initialPrice={manualPrice}
            />
          </>
        )}

        {/* Lista de productos - siempre visible */}
        <div className="mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold mb-2">Productos</h2>
            <div className="flex gap-2 ml-2">
              <button
                onClick={forceRefreshProducts}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                title="Actualizar productos"
              >
                Actualizar
              </button>
            </div>
          </div>
          <ProductList
            products={products}
            activeStoreId={activeStoreId}
            onRemoveProduct={handleRemoveProduct}
            onUpdateProduct={handleUpdateProduct}
            stores={stores} // Añadir la lista de tiendas
          />
        </div>

        {/* Resumen total - siempre visible */}
        <TotalSummary
          products={products}
          stores={stores}
          activeStoreId={activeStoreId}
          storeSubtotals={storeSubtotals}
        />

        {/* Mostrar mensajes de éxito */}
        {successMessage && (
          <div className="fixed bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
            {successMessage}
          </div>
        )}

        {/* Eliminamos completamente la sección de herramientas de depuración */}
      </div>
      <Footer />
    </>
  )
}
