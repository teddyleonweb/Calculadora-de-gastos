"use client"

import { useState, useEffect, useRef } from "react"
import * as Tesseract from "tesseract.js"
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
import { AuthService } from "./services/auth-service"
// Importar los servicios
import { StoreService } from "./services/store-service"
import { ProductService } from "./services/product-service"
// Importar el servicio de tiempo real
import { realtimeService } from "./lib/supabase/realtime-service"
// Importar la función de verificación
import { checkRealtimeSubscriptions } from "./lib/supabase/check-realtime"
// Importar la función de prueba
import { testRealtimeSubscriptions } from "./lib/supabase/debug-realtime"

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

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !isLoadingDataRef.current) {
        isLoadingDataRef.current = true
        try {
          setIsLoading(true)
          const userData = await AuthService.getUserData(user.id)
          setStores(userData.stores)
          setProducts(userData.products)

          // Establecer "total" como tienda activa por defecto o la primera tienda disponible
          const totalStore = userData.stores.find((store) => store.name === "Total")
          if (totalStore) {
            console.log("Tienda Total encontrada con ID:", totalStore.id)
          }
          setActiveStoreId(totalStore ? totalStore.id : userData.stores[0]?.id || "")
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

  // Suscribirse a cambios en tiempo real cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      console.log("Configurando suscripciones en tiempo real para el usuario:", user.id)

      // Cancelar suscripciones anteriores si existen
      if (unsubscribeRefs.current.products) {
        unsubscribeRefs.current.products()
      }

      // Suscribirse a cambios en productos
      const unsubscribeProducts = realtimeService.subscribeToProducts(
        user.id,
        // Callback para nuevos productos
        (newProduct) => {
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
          console.log("Producto actualizado recibido en tiempo real:", updatedProduct)
          setProducts((prevProducts) => {
            const updated = prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
            console.log("Estado de productos actualizado")
            return updated
          })
        },
        // Callback para productos eliminados
        (deletedId) => {
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

      // Guardar las funciones de cancelación
      unsubscribeRefs.current = {
        ...unsubscribeRefs.current,
        products: unsubscribeProducts,
      }

      // Limpiar suscripciones al desmontar
      return () => {
        console.log("Limpiando suscripciones en tiempo real")
        if (unsubscribeRefs.current.products) {
          unsubscribeRefs.current.products()
        }
      }
    }
  }, [user])

  // Suscribirse a cambios en tiempo real cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      console.log("Configurando suscripciones en tiempo real para el usuario:", user.id)

      // Suscribirse a cambios en productos
      const unsubscribeProducts = realtimeService.subscribeToProducts(
        user.id,
        // Callback para nuevos productos
        (newProduct) => {
          console.log("Nuevo producto recibido en tiempo real:", newProduct)
          setProducts((prevProducts) => {
            // Verificar si el producto ya existe (para evitar duplicados)
            const exists = prevProducts.some((s) => s.id === newProduct.id)
            if (exists) return prevProducts
            return [...prevProducts, newProduct]
          })
        },
        // Callback para productos actualizados
        (updatedProduct) => {
          console.log("Producto actualizado recibido en tiempo real:", updatedProduct)
          setProducts((prevProducts) =>
            prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
          )
        },
        // Callback para productos eliminados
        (deletedId) => {
          console.log("Producto eliminado recibido en tiempo real:", deletedId)
          setProducts((prevProducts) => prevProducts.filter((product) => product.id !== deletedId))
        },
      )

      // Suscribirse a cambios en tiendas
      const unsubscribeStores = realtimeService.subscribeToStores(
        user.id,
        // Callback para nuevas tiendas
        (newStore) => {
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
          console.log("Tienda actualizada recibida en tiempo real:", updatedStore)
          setStores((prevStores) => prevStores.map((store) => (store.id === updatedStore.id ? updatedStore : store)))
        },
        // Callback para tiendas eliminadas
        (deletedId) => {
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
        Object.values(unsubscribeRefs.current).forEach((unsubscribe) => unsubscribe())
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
          setErrorMessage(
            "La sincronización en tiempo real puede no estar funcionando correctamente. Algunas actualizaciones podrían requerir refrescar la página.",
          )
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
      // Ya no necesitamos actualizar el estado local aquí, lo hará la suscripción en tiempo real
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

      await StoreService.updateStore(user.id, storeId, name, image)

      // Ya no necesitamos actualizar el estado local aquí, lo hará la suscripción en tiempo real

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

  // Función para eliminar una tienda
  const handleDeleteStore = async (storeId: string): Promise<void> => {
    if (!user) return

    // No permitir eliminar la tienda "Total"
    const totalStore = stores.find((store) => store.name === "Total")
    if (storeId === totalStore?.id) return

    try {
      setIsLoading(true)
      await StoreService.deleteStore(user.id, storeId)

      // Ya no necesitamos actualizar el estado local aquí, lo hará la suscripción en tiempo real

      // Si la tienda activa es la que se está eliminando, cambiar a otra tienda disponible
      if (activeStoreId === storeId) {
        const availableStores = stores.filter((store) => store.id !== storeId)
        setActiveStoreId(availableStores.length > 0 ? availableStores[0].id : totalStore?.id || "")
      }
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      setErrorMessage("Error al eliminar tienda")
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

      const newProduct = await ProductService.addProduct(user.id, product)

      console.log("Producto añadido correctamente en la base de datos:", newProduct)

      // Actualizar el estado local inmediatamente para una mejor experiencia de usuario
      setProducts((prevProducts) => {
        // Verificar si el producto ya existe (para evitar duplicados)
        const exists = prevProducts.some((p) => p.id === newProduct.id)
        if (exists) {
          console.log("El producto ya existe en el estado local, no se añade:", newProduct.id)
          return prevProducts
        }
        console.log("Añadiendo nuevo producto al estado local:", newProduct)
        return [...prevProducts, newProduct]
      })

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      return newProduct
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

    // Limpiar cual  // Permitir que el usuario active el modo de selección nuevamente

    // Limpiar cualquier mensaje de error
    setErrorMessage(null)
  }

  // Función para añadir un producto manualmente
  const handleAddManualProduct = async (title: string, price: number, quantity: number) => {
    if (!user) return

    try {
      console.log("Iniciando adición manual de producto:", title, price, quantity)
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Añadiendo producto...")

      const productData = {
        title,
        price,
        quantity,
        storeId: activeStoreId,
      }

      // Añadir el producto a la base de datos
      const newProduct = await ProductService.addProduct(user.id, productData)

      console.log("Producto añadido correctamente en la base de datos:", newProduct)

      // Actualizar el estado local inmediatamente para una mejor experiencia de usuario
      setProducts((prevProducts) => {
        // Verificar si el producto ya existe (para evitar duplicados)
        const exists = prevProducts.some((p) => p.id === newProduct.id)
        if (exists) {
          console.log("El producto ya existe en el estado local, no se añade:", newProduct.id)
          return prevProducts
        }
        console.log("Añadiendo nuevo producto al estado local:", newProduct)
        return [...prevProducts, newProduct]
      })

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
      await ProductService.updateProduct(user.id, id, {
        title,
        price,
        quantity,
        storeId: activeStoreId,
      })

      // Ya no necesitamos actualizar el estado local aquí, lo hará la suscripción en tiempo real
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      setErrorMessage("Error al actualizar producto")
    }
  }

  // Función para eliminar un producto
  const handleRemoveProduct = async (id: string) => {
    if (!user) return

    try {
      console.log("Iniciando eliminación del producto:", id)
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Eliminando producto...")

      // Eliminar el producto de la base de datos
      await ProductService.deleteProduct(user.id, id)

      console.log("Producto eliminado correctamente en la base de datos")

      // Actualizar el estado local inmediatamente para una mejor experiencia de usuario
      setProducts((prevProducts) => {
        const filtered = prevProducts.filter((product) => product.id !== id)
        console.log("Estado de productos actualizado localmente después de eliminar")
        return filtered
      })

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto eliminado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      setErrorMessage(`Error al eliminar producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Añadir una función para ejecutar la prueba
  const runRealtimeTest = async () => {
    if (!user) return

    try {
      setSuccessMessage("Ejecutando prueba de tiempo real...")
      await testRealtimeSubscriptions(user.id)
      setSuccessMessage("Prueba completada. Revisa la consola para ver los resultados.")
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error("Error al ejecutar prueba:", error)
      setErrorMessage("Error al ejecutar prueba de tiempo real")
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  // Función para forzar la actualización de productos desde la base de datos
  const forceRefreshProducts = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setSuccessMessage("Actualizando productos...")

      // Obtener productos actualizados
      const updatedProducts = await ProductService.getProducts(user.id)

      // Actualizar el estado
      setProducts(updatedProducts)

      setSuccessMessage("Productos actualizados correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al actualizar productos:", error)
      setErrorMessage("Error al actualizar productos")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // El resto del código permanece sin cambios...

  // Renderizar el componente
  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        {/* Resto del código sin cambios... */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Extractor de Precios</h1>
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
          <h2 className="text-xl font-bold mb-2">Productos</h2>
          <div className="flex items-center">
            <h2 className="text-xl font-bold mb-2">Productos</h2>
            <button
              onClick={forceRefreshProducts}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm ml-2"
              title="Actualizar productos"
            >
              Actualizar
            </button>
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

        {/* En el JSX, añadir un botón de depuración (solo visible en desarrollo) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-2 bg-gray-100 border border-gray-300 rounded">
            <h3 className="font-bold mb-2">Herramientas de depuración</h3>
            <button
              onClick={runRealtimeTest}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Probar suscripciones en tiempo real
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
