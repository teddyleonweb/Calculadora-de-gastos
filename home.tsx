"use client"

import { useState, useEffect, useRef } from "react"
import Tesseract from "tesseract.js"
import type { Product, Store, Rectangle, Project } from "./types"
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
import { ExchangeRateService } from "./services/exchange-rate-service"
// Eliminar importaciones de Supabase
import ExpenseSummary from "./components/expense-summary"
import SearchBar from "./components/search-bar"
import ExchangeRateDashboard from "./components/exchange-rate-dashboard"
import { DollarSign } from "lucide-react"
import DateFilter from "./components/date-filter"
import FinanceManager from "./components/finance-manager"
// Importar el servicio de proyectos y el componente de selector de proyectos
import { ProjectService } from "./services/project-service"
import ProjectSelector from "./components/project-selector"
// Importar hook de sincronización en tiempo real y componente de notificaciones
import { useRealtimeSync } from "./hooks/use-realtime-sync"
import RealtimeToast, { showRealtimeToast } from "./components/realtime-toast"

export default function Home() {
  // Obtener el usuario autenticado
  const { user } = useAuth()

  // Estados para las tiendas
  const [stores, setStores] = useState<Store[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string>("")
  const [storeSubtotals, setStoreSubtotals] = useState<{ [key: string]: number }>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>("")

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
  const dataLoadedRef = useRef<boolean>(false)
  const initialLoadAttemptedRef = useRef<boolean>(false)
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 15))

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<"products" | "summary" | "exchange" | "finances">("products")
  // Estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState<string>("")
  // Estado para las tasas de cambio
  const [exchangeRates, setExchangeRates] = useState<{
    bcv: string
    parallel: string
    binance: string
    bcv_euro?: string
  }>({
    bcv: "...",
    parallel: "...",
    binance: "...",
    bcv_euro: "...",
  })

  // Añadir un estado para el filtro de fecha (inicializar como null para mostrar todas las fechas)
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  // Hook de sincronización en tiempo real
  const {
    broadcastProductAdded,
    broadcastProductUpdated,
    broadcastProductDeleted,
    broadcastStoreAdded,
    broadcastStoreUpdated,
    broadcastStoreDeleted,
  } = useRealtimeSync({
    userId: user?.id,
    projectId: activeProjectId,
    pollingInterval: 10000, // Verificar cada 10 segundos
    // Recargar datos desde la API (funciona con PHP/WordPress backend)
    onRefreshData: async () => {
      if (!user || !activeProjectId) return
      
      try {
        const freshProducts = await ProductService.getProducts(user.id, activeProjectId)
        
        // Solo actualizar si hay diferencias para evitar re-renders innecesarios
        setProducts((currentProducts) => {
          // Comparar si los productos son diferentes
          if (JSON.stringify(currentProducts.map(p => p.id).sort()) !== 
              JSON.stringify(freshProducts.map((p: any) => p.id).sort())) {
            saveProductsToLocalStorage(freshProducts)
            return freshProducts
          }
          return currentProducts
        })
        
        const freshStores = await StoreService.getStores(user.id, activeProjectId)
        setStores(freshStores)
      } catch (error) {
        console.error("Error al sincronizar datos:", error)
      }
    },
    onNotification: (message, type) => {
      showRealtimeToast(message, type)
    },
  })

  // Función para resetear el estado
  const resetState = () => {
    setImageSrc(null)
    setRect(null)
    setTitleRect(null)
    setPriceRect(null)
    setSelectionMode(null)
    setSelectionsReady(false)
    setManualTitle("")
    setManualPrice("")
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])
  }

  // Función para resetear la selección
  const resetSelection = () => {
    setRect(null)
    setTitleRect(null)
    setPriceRect(null)
    setSelectionMode(null)
    setSelectionsReady(false)
  }

  // Función para procesar un área específica de la imagen y extraer texto
  const processAreaForText = async (img: HTMLImageElement, rect: Rectangle): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Validate rect coordinates to ensure they're within image boundaries
        const validX = Math.max(0, Math.min(rect.x, img.width))
        const validY = Math.max(0, Math.min(rect.y, img.height))
        const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
        const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

        // Skip processing if the area is too small
        if (validWidth < 5 || validHeight < 5) {
          reject("El área seleccionada es demasiado pequeña para procesar")
          return
        }

        // Create a temporary canvas for the cropped area
        const croppedCanvas = document.createElement("canvas")
        croppedCanvas.width = validWidth
        croppedCanvas.height = validHeight
        const croppedCtx = croppedCanvas.getContext("2d")

        if (!croppedCtx) {
          reject("No se pudo crear el contexto del canvas")
          return
        }

        // Draw the cropped area onto the temporary canvas
        croppedCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

        // Process with Tesseract using the correct API
        const worker = await Tesseract.createWorker()

        // Recognize text from the cropped area
        const result = await worker.recognize(croppedCanvas)

        // Clean up
        await worker.terminate()

        const text = result.data.text
        console.log("Texto extraído del área:", text)
        resolve(text)
      } catch (error) {
        console.error("Error al procesar el área:", error)
        reject(error)
      }
    })
  }

  // Cargar las tasas de cambio
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const rates = await ExchangeRateService.getExchangeRates()
        if (rates.bcv !== "Error" && rates.parallel !== "Error") {
          setExchangeRates({
            bcv: rates.bcv,
            parallel: rates.parallel,
            binance: rates.binance || rates.parallel,
            bcv_euro: rates.bcv_euro,
          })
        }
      } catch (error) {
        console.error("Error al cargar tasas de cambio:", error)
      }
    }

    loadExchangeRates()

    // Actualizar cada 30 minutos
    const intervalId = setInterval(loadExchangeRates, 30 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

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

  // Añadir funciones para guardar y cargar proyectos en localStorage
  const saveProjectsToLocalStorage = (projects: Project[]) => {
    try {
      localStorage.setItem("cached_projects", JSON.stringify(projects))
      localStorage.setItem("projects_cache_time", new Date().toISOString())
    } catch (error) {
      console.error("Error al guardar proyectos en localStorage:", error)
    }
  }

  const loadProjectsFromLocalStorage = (): Project[] => {
    try {
      const cachedProjects = localStorage.getItem("cached_projects")
      if (cachedProjects) {
        return JSON.parse(cachedProjects)
      }
    } catch (error) {
      console.error("Error al cargar proyectos desde localStorage:", error)
    }
    return []
  }

  // Modificar la función loadUserData para que cargue los datos filtrados por proyecto

  // Modificar la función loadUserData para cargar también los proyectos
  const loadUserData = async () => {
    if (user && !isLoadingDataRef.current) {
      isLoadingDataRef.current = true
      try {
        setIsLoading(true)
        console.log("Cargando datos del usuario:", user.id)

        // Intentar cargar datos desde localStorage primero para mostrar algo rápidamente
        const cachedProjects = loadProjectsFromLocalStorage()
        const cachedStores = loadStoresFromLocalStorage()
        const cachedProducts = loadProductsFromLocalStorage()

        if (cachedProjects.length > 0) {
          console.log("Usando proyectos en caché mientras se cargan datos frescos...")
          setProjects(cachedProjects)

          // Guardar el proyecto activo actual antes de cualquier cambio
          const currentActiveProjectId = activeProjectId

          // Solo establecer el proyecto activo si no hay ninguno seleccionado
          if (!currentActiveProjectId || currentActiveProjectId === "") {
            const defaultProject = cachedProjects.find((project) => project.isDefault)
            if (defaultProject) {
              console.log("No hay proyecto activo, estableciendo el predeterminado como activo:", defaultProject.id)
              setActiveProjectId(defaultProject.id)
            } else if (cachedProjects.length > 0) {
              setActiveProjectId(cachedProjects[0].id)
            }
          }
        }

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

        // Primero cargar los proyectos
        try {
          console.log("Solicitando proyectos desde la API...")
          const projects = await ProjectService.getProjects(user.id)
          console.log("Proyectos cargados:", projects)

          if (projects && projects.length > 0) {
            console.log("Proyectos cargados correctamente:", projects.length)
            setProjects(projects)
            saveProjectsToLocalStorage(projects)

            // Verificar si es la primera carga de la página
            if (initialLoadAttemptedRef.current === false) {
              initialLoadAttemptedRef.current = true
              // Establecer el proyecto predeterminado como activo en la primera carga
              const defaultProject = projects.find((project) => project.isDefault)
              if (defaultProject) {
                console.log("Primera carga: estableciendo proyecto predeterminado como activo:", defaultProject.id)
                setActiveProjectId(defaultProject.id)
              } else if (projects.length > 0) {
                setActiveProjectId(projects[0].id)
              }
            } else {
              // Para cargas posteriores, solo establecer el proyecto activo si no hay ninguno seleccionado
              if (!activeProjectId || activeProjectId === "") {
                const defaultProject = projects.find((project) => project.isDefault)
                if (defaultProject) {
                  console.log("No hay proyecto activo, estableciendo el predeterminado como activo:", defaultProject.id)
                  setActiveProjectId(defaultProject.id)
                } else if (projects.length > 0) {
                  setActiveProjectId(projects[0].id)
                }
              }
            }
          } else {
            console.log("No se encontraron proyectos o la respuesta está vacía")
          }
        } catch (projectError) {
          console.error("Error al cargar proyectos:", projectError)
        }

        // Determinar qué projectId usar para cargar tiendas y productos
        const projectIdToUse = activeProjectId || projects?.find((p) => p.isDefault)?.id || projects?.[0]?.id || "1"

        console.log("Usando projectId para cargar tiendas y productos:", projectIdToUse)

        // Luego cargar las tiendas filtradas por proyecto
        try {
          console.log("Solicitando tiendas desde la API filtradas por proyecto:", projectIdToUse)
          const stores = await StoreService.getStores(user.id, projectIdToUse)
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

        // Luego cargar los productos filtrados por proyecto
        try {
          console.log("Solicitando productos desde la API filtrados por proyecto:", projectIdToUse)
          const products = await ProductService.getProducts(user.id, projectIdToUse)
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

          const projectIdToUse = activeProjectId || projects?.find((p) => p.isDefault)?.id || projects?.[0]?.id

          // Primero cargar las tiendas FILTRADAS POR PROYECTO
          try {
            console.log("Solicitando tiendas desde la API filtradas por proyecto:", projectIdToUse)
            const stores = await StoreService.getStores(user.id, projectIdToUse)
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

          // Luego cargar los productos directamente desde la API FILTRADOS POR PROYECTO
          try {
            console.log("Solicitando productos desde la API filtrados por proyecto:", projectIdToUse)
            const products = await ProductService.getProducts(user.id, projectIdToUse)
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

          const projectIdToUse = activeProjectId || projects?.find((p) => p.isDefault)?.id || projects?.[0]?.id

          // Recargar tiendas FILTRADAS POR PROYECTO
          try {
            console.log("Recargando tiendas filtradas por proyecto:", projectIdToUse)
            const stores = await StoreService.getStores(user.id, projectIdToUse)
            if (stores && stores.length > 0) {
              // Mantener la tienda activa actual
              setStores(stores)
              saveStoresToLocalStorage(stores)
            }
          } catch (storeError) {
            console.error("Error al recargar tiendas:", storeError)
          }

          // Recargar productos FILTRADOS POR PROYECTO
          try {
            console.log("Recargando productos filtrados por proyecto:", projectIdToUse)
            const products = await ProductService.getProducts(user.id, projectIdToUse)
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
  }, [user, activeTab, activeProjectId, projects])

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

  // Resetear la imagen y selecciones cuando cambiamos de tienda
  useEffect(() => {
    // Siempre resetear el estado cuando cambia la tienda activa
    console.log("Cambiando de tienda, reseteando estado completo")
    resetState()
  }, [activeStoreId])

  // Añadir un useEffect para guardar y restaurar la tienda activa
  useEffect(() => {
    // Restaurar la tienda activa desde localStorage al cargar la página
    const savedActiveStoreId = localStorage.getItem("active_store_id")

    if (savedActiveStoreId && stores.some((store) => store.id === savedActiveStoreId)) {
      // Solo restaurar si la tienda existe en la lista de tiendas
      console.log("Restaurando tienda activa desde localStorage:", savedActiveStoreId)
      setActiveStoreId(savedActiveStoreId)
    } else {
      // Si no hay tienda guardada o no existe, establecer "Total" como predeterminada
      const totalStore = stores.find((store) => store.name === "Total")
      if (totalStore) {
        console.log("Estableciendo Total como tienda activa predeterminada:", totalStore.id)
        setActiveStoreId(totalStore.id)
      }
    }
  }, [stores.length]) // Solo ejecutar cuando cambia la lista de tiendas

  // Guardar la tienda activa en localStorage cuando cambia
  useEffect(() => {
    if (activeStoreId) {
      localStorage.setItem("active_store_id", activeStoreId)
      console.log("Guardando tienda activa en localStorage:", activeStoreId)
    }
  }, [activeStoreId])

  // Añadir un useEffect para guardar y restaurar el proyecto activo
  useEffect(() => {
    // Restaurar el proyecto activo desde localStorage al cargar la página
    const savedActiveProjectId = localStorage.getItem("active_project_id")

    if (savedActiveProjectId && projects.some((project) => project.id === savedActiveProjectId)) {
      // Solo restaurar si el proyecto existe en la lista de proyectos
      console.log("Restaurando proyecto activo desde localStorage:", savedActiveProjectId)
      setActiveProjectId(savedActiveProjectId)
    } else {
      // Si no hay proyecto guardado o no existe, establecer el proyecto predeterminado
      const defaultProject = projects.find((project) => project.isDefault)
      if (defaultProject) {
        console.log("Estableciendo proyecto predeterminado como activo:", defaultProject.id)
        setActiveProjectId(defaultProject.id)
      }
    }
  }, [projects.length]) // Solo ejecutar cuando cambia la lista de proyectos

  // Guardar el proyecto activo en localStorage cuando cambia
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("active_project_id", activeProjectId)
      console.log("Guardando proyecto activo en localStorage:", activeProjectId)
    }
  }, [activeProjectId])

  // Añadir un useEffect para cargar tiendas y productos cuando cambia el proyecto activo
  useEffect(() => {
    if (user && activeProjectId) {
      console.log(
        "Proyecto activo cambiado a:",
        activeProjectId,
        "- cargando tiendas y productos filtrados por este proyecto",
      )

      // Cargar tiendas filtradas por proyecto
      const loadStores = async () => {
        try {
          console.log(`Cargando tiendas para proyecto: ${activeProjectId}`)
          const stores = await StoreService.getStores(user.id, activeProjectId)

          console.log(`Tiendas filtradas por proyecto ${activeProjectId}:`, stores.length, stores)
          setStores(stores)
          saveStoresToLocalStorage(stores)

          // Establecer la tienda "Total" como activa al cambiar de proyecto
          const totalStore = stores.find((store) => store.name === "Total")
          if (totalStore) {
            console.log("Estableciendo tienda Total como activa:", totalStore.id)
            setActiveStoreId(totalStore.id)
          } else if (stores.length > 0) {
            console.log("No hay tienda Total, estableciendo primera tienda:", stores[0].id)
            setActiveStoreId(stores[0].id)
          }
        } catch (error) {
          console.error("Error al cargar tiendas filtradas por proyecto:", error)
        }
      }

      // Cargar productos filtrados por proyecto
      const loadProducts = async () => {
        try {
          console.log(`Cargando productos para proyecto: ${activeProjectId}`)
          const products = await ProductService.getProducts(user.id, activeProjectId)

          console.log(`Productos filtrados por proyecto ${activeProjectId}:`, products.length, products)
          setProducts(products)
          saveProductsToLocalStorage(products)
        } catch (error) {
          console.error("Error al cargar productos filtrados por proyecto:", error)
        }
      }

      loadStores()
      loadProducts()
    }
  }, [user, activeProjectId])

  // Generar un ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  // Añadir funciones para gestionar proyectos
  const handleAddProject = async (name: string, description?: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      const newProject = await ProjectService.addProject(user.id, name, description)
      console.log("Proyecto añadido correctamente:", newProject)

      // Actualizar el estado local inmediatamente
      setProjects((prevProjects) => {
        // Verificar si el proyecto ya existe
        const exists = prevProjects.some((p) => p.id === newProject.id)
        if (exists) return prevProjects
        const updatedProjects = [...prevProjects, newProject]
        saveProjectsToLocalStorage(updatedProjects)
        return updatedProjects
      })

      // Forzar una recarga completa de los proyectos para asegurar sincronización
      try {
        const refreshedProjects = await ProjectService.getProjects(user.id)
        if (refreshedProjects && refreshedProjects.length > 0) {
          console.log("Proyectos actualizados después de añadir:", refreshedProjects)
          setProjects(refreshedProjects)
          saveProjectsToLocalStorage(refreshedProjects)
        }
      } catch (refreshError) {
        console.error("Error al recargar proyectos después de añadir:", refreshError)
      }

      setActiveProjectId(newProject.id)

      // Mostrar mensaje de éxito
      setSuccessMessage("Proyecto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al añadir proyecto:", error)
      setErrorMessage("Error al añadir proyecto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProject = async (projectId: string, name: string, description?: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log("Actualizando proyecto:", projectId, name, description)

      // Mostrar mensaje de carga
      setSuccessMessage("Actualizando proyecto...")

      const updatedProject = await ProjectService.updateProject(user.id, projectId, name, description)

      // Actualizar el estado local inmediatamente
      setProjects((prevProjects) => {
        const updatedProjects = prevProjects.map((project) =>
          project.id === projectId ? { ...project, name, description } : project,
        )
        saveProjectsToLocalStorage(updatedProjects)
        return updatedProjects
      })

      // Mostrar mensaje de éxito temporal
      setSuccessMessage("¡Proyecto actualizado correctamente!")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al actualizar proyecto:", error)
      setErrorMessage(`Error al actualizar proyecto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    if (!user) return

    // No permitir eliminar el proyecto por defecto
    const defaultProject = projects.find((project) => project.isDefault)
    if (projectId === defaultProject?.id) return

    try {
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Eliminando proyecto...")

      // Primero actualizar el estado local (enfoque optimista)
      const projectToDelete = projects.find((project) => project.id === projectId)
      setProjects((prevProjects) => {
        const updatedProjects = prevProjects.filter((project) => project.id !== projectId)
        saveProjectsToLocalStorage(updatedProjects)
        return updatedProjects
      })

      // Si el proyecto activo es el que se está eliminando, cambiar a otro proyecto disponible
      if (activeProjectId === projectId) {
        const availableProjects = projects.filter((project) => project.id !== projectId)
        setActiveProjectId(availableProjects.length > 0 ? availableProjects[0].id : defaultProject?.id || "")
      }

      // Luego intentar eliminar el proyecto de la base de datos
      const deleteSuccess = await ProjectService.deleteProject(user.id, projectId)

      if (deleteSuccess) {
        console.log("Proyecto eliminado correctamente en la base de datos")

        // Mostrar mensaje de éxito
        setSuccessMessage("Proyecto eliminado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        console.error("Error al eliminar proyecto de la base de datos")

        // Si falla la eliminación en el servidor, restaurar el proyecto en el estado local
        if (projectToDelete) {
          setProjects((prevProjects) => {
            const updatedProjects = [...prevProjects, projectToDelete]
            saveProjectsToLocalStorage(updatedProjects)
            return updatedProjects
          })
        }

        setErrorMessage("Error al eliminar proyecto. Se ha restaurado en la interfaz.")
        setTimeout(() => setErrorMessage(null), 5000)
      }

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al eliminar proyecto:", error)
      setErrorMessage(`Error al eliminar proyecto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para añadir una tienda
  const handleAddStore = async (name: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log("Añadiendo tienda:", name, "al proyecto:", activeProjectId)

      // Verificar que el projectId no esté vacío
      if (!activeProjectId) {
        throw new Error("No hay un proyecto activo seleccionado")
      }

      const newStore = await StoreService.addStore(user.id, name, activeProjectId)

      // Actualizar el estado local inmediatamente
      setStores((prevStores) => {
        // Verificar si la tienda ya existe
        const exists = prevStores.some((s) => s.id === newStore.id)
        if (exists) return prevStores
        const updatedStores = [...prevStores, newStore]
        saveStoresToLocalStorage(updatedStores)
        return updatedStores
      })

      setActiveStoreId(newStore.id)

      // Mostrar mensaje de éxito
      setSuccessMessage("Tienda añadida correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())

      // Emitir evento de sincronización a otros dispositivos
      broadcastStoreAdded(newStore)
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      setErrorMessage(`Error al añadir tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función handleAddManualProduct para incluir el projectId
  const handleAddManualProduct = async (title: string, price: number, quantity: number, image?: string) => {
    if (!user) return

    try {
      console.log("Iniciando adición manual de producto:", title, price, quantity, image ? "con imagen" : "sin imagen")
      console.log("Proyecto activo:", activeProjectId)
      console.log("Tienda activa:", activeStoreId)
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Añadiendo producto...")

      // Usar una imagen por defecto si no hay imagen
      const defaultImage = "/sin-imagen-disponible.jpg"

      const productData = {
        title,
        price,
        quantity,
        storeId: activeStoreId,
        projectId: activeProjectId, // Asegurar que se incluya el projectId
        image: image || defaultImage,
        createdAt: new Date().toISOString(),
      }

      console.log("Datos del producto a enviar:", productData)

      // Añadir el producto a la base de datos
      const newProduct = await ProductService.addProduct(user.id, productData)
      console.log("Producto añadido correctamente en la base de datos:", newProduct)

      try {
        const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
        console.log("Productos recargados después de añadir:", updatedProducts.length)
        setProducts(updatedProducts)
        saveProductsToLocalStorage(updatedProducts)
      } catch (reloadError) {
        console.error("Error al recargar productos después de añadir:", reloadError)
        setProducts((prevProducts) => {
          const updatedProducts = [...prevProducts, { ...newProduct, isEditing: false }]
          saveProductsToLocalStorage(updatedProducts)
          console.log("Estado local actualizado con nuevo producto (fallback)")
          return updatedProducts
        })
      }

      // Mostrar mensaje de éxito
      setSuccessMessage("Producto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())

      // Filtrar por fecha de hoy al agregar un producto (compra nueva)
      const todayDate = new Date().toISOString().split("T")[0]
      setDateFilter(todayDate)

      // Emitir evento de sincronización a otros dispositivos
      broadcastProductAdded(newProduct)
    } catch (error) {
      console.error("Error al añadir producto manualmente:", error)
      setErrorMessage(`Error al añadir producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función forceRefreshData para incluir la recarga de proyectos
  const forceRefreshData = async () => {
    if (user) {
      try {
        setIsLoading(true)
        setSuccessMessage("Actualizando datos...")

        console.log("Forzando la recarga completa de datos filtrados por proyecto:", activeProjectId)

        // Recargar proyectos
        try {
          console.log("Recargando proyectos...")
          const freshProjects = await ProjectService.getProjects(user.id)
          // Asegurarse de que el proyecto activo siga existiendo en los proyectos actualizados
          const activeProjectExists = freshProjects.some((project) => project.id === activeProjectId)
          setProjects(freshProjects)
          saveProjectsToLocalStorage(freshProjects)

          // Solo cambiar el proyecto activo si el proyecto actual ya no existe
          if (!activeProjectExists) {
            const defaultProject = freshProjects.find((project) => project.isDefault)
            if (defaultProject) {
              console.log("El proyecto activo ya no existe, cambiando al predeterminado:", defaultProject.id)
              setActiveProjectId(defaultProject.id)
            } else if (freshProjects.length > 0) {
              setActiveProjectId(freshProjects[0].id)
            }
          }

          console.log("Proyectos recargados correctamente:", freshProjects.length)
        } catch (projectError) {
          console.error("Error al recargar proyectos:", projectError)
        }

        // Determinar qué projectId usar
        const projectIdToUse = activeProjectId || projects?.find((p) => p.isDefault)?.id || projects?.[0]?.id

        // Recargar tiendas filtradas por proyecto
        try {
          console.log("Recargando tiendas filtradas por proyecto:", projectIdToUse)
          const freshStores = await StoreService.getStores(user.id, projectIdToUse)
          // Asegurarse de que la tienda activa siga existiendo en las tiendas actualizadas
          const activeStoreExists = freshStores.some((store) => store.id === activeStoreId)
          setStores(freshStores)
          saveStoresToLocalStorage(freshStores)

          // Solo cambiar la tienda activa si la tienda actual ya no existe
          if (!activeStoreExists) {
            const totalStore = freshStores.find((store) => store.name === "Total")
            if (totalStore) {
              console.log("La tienda activa ya no existe, cambiando a Total:", totalStore.id)
              setActiveStoreId(totalStore.id)
            } else if (freshStores.length > 0) {
              setActiveStoreId(freshStores[0].id)
            }
          }

          console.log("Tiendas recargadas correctamente:", freshStores.length)
        } catch (storeError) {
          console.error("Error al recargar tiendas:", storeError)
        }

        // Recargar productos filtrados por proyecto
        try {
          console.log("Recargando productos filtrados por proyecto:", projectIdToUse)
          const freshProducts = await ProductService.getProducts(user.id, projectIdToUse)
          setProducts(freshProducts)
          saveProductsToLocalStorage(freshProducts)
          console.log("Productos recargados correctamente:", freshProducts.length)
        } catch (productError) {
          console.error("Error al recargar productos:", productError)
        }

        setSuccessMessage("Datos actualizados correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Actualizar la hora de la última actualización
        setLastUpdate(new Date())
      } catch (error) {
        console.error("Error al forzar la recarga de datos:", error)
        setErrorMessage("Error al actualizar los datos.")
        setTimeout(() => setErrorMessage(null), 5000)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Modificar el useEffect que resetea el estado cuando cambia la tienda activa
  // para que no haga nada si hay una imagen cargada
  // Función para eliminar una tienda
  const handleDeleteStore = async (storeId: string): Promise<void> => {
    if (!user) return

    // No permitir eliminar la tienda "Total"
    const totalStore = stores.find((store) => store.name === "Total")
    if (storeId === totalStore?.id) return

    try {
      setIsLoading(true)

      // Mostrar mensaje de carga
      setSuccessMessage("Eliminando tienda...")

      // Primero actualizar el estado local (enfoque optimista)
      const storeToDelete = stores.find((store) => store.id === storeId)
      setStores((prevStores) => {
        const updatedStores = prevStores.filter((store) => store.id !== storeId)
        saveStoresToLocalStorage(updatedStores)
        return updatedStores
      })

      // Si la tienda activa es la que se está eliminando, cambiar a otra tienda disponible
      if (activeStoreId === storeId) {
        const availableStores = stores.filter((store) => store.id !== storeId)
        setActiveStoreId(availableStores.length > 0 ? availableStores[0].id : totalStore?.id || "")
      }

      // Luego intentar eliminar la tienda de la base de datos
      const deleteSuccess = await StoreService.deleteStore(user.id, storeId)

      if (deleteSuccess) {
        console.log("Tienda eliminada correctamente en la base de datos")

        // Mostrar mensaje de éxito
        setSuccessMessage("Tienda eliminada correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Emitir evento de sincronización a otros dispositivos
        broadcastStoreDeleted(storeId)
      } else {
        console.error("Error al eliminar tienda de la base de datos")

        // Si falla la eliminación en el servidor, restaurar la tienda en el estado local
        if (storeToDelete) {
          setStores((prevStores) => {
            const updatedStores = [...prevStores, storeToDelete]
            saveStoresToLocalStorage(updatedStores)
            return updatedStores
          })
        }

        setErrorMessage("Error al eliminar tienda. Se ha restaurado en la interfaz.")
        setTimeout(() => setErrorMessage(null), 5000)
      }

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      setErrorMessage(`Error al eliminar tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar una tienda
  const handleUpdateStore = async (storeId: string, name: string, image?: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log("Actualizando tienda:", storeId, name, image ? "con imagen" : "sin imagen")

      // Mostrar mensaje de carga
      setSuccessMessage("Actualizando tienda...")

      const updatedStore = await StoreService.updateStore(user.id, storeId, name, image)

      setStores((prevStores) => {
        const updatedStores = prevStores.map((store) =>
          store.id === storeId ? { ...store, name, ...(image && { image }) } : store,
        )
        saveStoresToLocalStorage(updatedStores)
        return updatedStores
      })

      // Mostrar mensaje de éxito temporal
      setSuccessMessage(image ? "¡Imagen actualizada correctamente!" : "¡Tienda actualizada correctamente!")
      setTimeout(() => setSuccessMessage(null), 3000)

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())

      // Emitir evento de sincronización a otros dispositivos
      const storeToSync = stores.find((s) => s.id === storeId)
      if (storeToSync) {
        broadcastStoreUpdated({ ...storeToSync, name, ...(image && { image }) })
      }
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      setErrorMessage(`Error al actualizar tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para capturar una imagen
  const handleImageCapture = (src: string | null) => {
    setImageSrc(src)
  }

  // Función para procesar la imagen completa
  const processFullImage = async () => {
    if (!imageSrc) {
      setErrorMessage("No se pudo cargar la imagen")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      // Crear una nueva imagen para procesar
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const worker = await Tesseract.createWorker()
      await worker.loadLanguage("spa")
      await worker.initialize("spa")

      const result = await worker.recognize(img)
      const text = result.data.text

      await worker.terminate()

      setDebugText(text)

      // Dividir el texto en líneas
      const lines = text.split("\n")

      // Expresión regular para encontrar el título y el precio
      const regex = /([A-Za-z0-9\s]+)\s+(\d+(\.\d{1,2})?)/

      const newProducts = lines
        .map((line, index) => {
          const match = line.match(regex)
          if (match) {
            const title = match[1].trim()
            const price = Number.parseFloat(match[2])
            // Para cada producto encontrado, usar la imagen completa
            const productData = {
              id: generateId(),
              title,
              price,
              quantity: 1,
              storeId: activeStoreId,
              projectId: activeProjectId,
              isEditing: false,
              image: imageSrc, // Usar la imagen completa
              createdAt: new Date().toISOString(),
            }
            return productData
          } else {
            return null
          }
        })
        .filter((product) => product !== null) as Product[]

      // Añadir productos a la base de datos
      for (const product of newProducts) {
        try {
          const addedProduct = await ProductService.addProduct(user.id, product)
          console.log("Producto añadido desde imagen completa:", addedProduct)
          // Emitir evento de sincronización a otros dispositivos
          broadcastProductAdded(addedProduct)
        } catch (error) {
          console.error("Error al añadir producto desde imagen completa:", error)
        }
      }

      // Recargar productos después de añadir
      try {
        const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
        setProducts(updatedProducts)
        saveProductsToLocalStorage(updatedProducts)
      } catch (reloadError) {
        console.error("Error al recargar productos después de procesar imagen completa:", reloadError)
      }

      // Actualizar la hora de la última actualización
      setLastUpdate(new Date())

      // Filtrar por fecha de hoy al agregar productos (compra nueva)
      const todayDate = new Date().toISOString().split("T")[0]
      setDateFilter(todayDate)

    } catch (error) {
      console.error("Error al procesar la imagen completa:", error)
      setErrorMessage("Error al procesar la imagen. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para procesar un área seleccionada de la imagen
  const processSelectedArea = async () => {
    if (!imageSrc || !rect) {
      // Eliminar este mensaje de error ya que puede ser confuso
      // setErrorMessage("No se pudo cargar la imagen o no se ha seleccionado un área")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      // Crear una nueva imagen para procesar
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const text = await processAreaForText(img, rect)
      setDebugText(text)

      // Expresión regular para encontrar el título y el precio
      // Mejorada para detectar precios con coma o punto decimal
      const regex = /([A-Za-z0-9\s]+)\s+(\d+[.,]\d{1,2}|\d+)/

      const match = text.match(regex)
      if (match) {
        const title = match[1].trim()
        // Reemplazar coma por punto para asegurar que se procese correctamente
        const priceText = match[2].replace(",", ".")
        const price = Number.parseFloat(priceText)

        // Validate rect coordinates to ensure they're within image boundaries
        const validX = Math.max(0, Math.min(rect.x, img.width))
        const validY = Math.max(0, Math.min(rect.y, img.height))
        const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
        const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

        // Crear canvas para guardar el área seleccionada como imagen
        const croppedCanvas = document.createElement("canvas")
        croppedCanvas.width = validWidth
        croppedCanvas.height = validHeight
        const croppedCtx = croppedCanvas.getContext("2d")

        if (croppedCtx) {
          // Dibujar el área seleccionada en el canvas
          croppedCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

          // Convertir el canvas a base64 para guardar como imagen
          const croppedImageData = croppedCanvas.toDataURL("image/jpeg", 0.8)

          const productData = {
            title,
            price,
            quantity: 1,
            storeId: activeStoreId,
            projectId: activeProjectId,
            image: croppedImageData, // Usar la imagen del área seleccionada
            createdAt: new Date().toISOString(),
          }

          // Añadir el producto a la base de datos
          const newProduct = await ProductService.addProduct(user.id, productData)
          console.log("Producto añadido desde área seleccionada:", newProduct)

          // Recargar productos después de añadir
          try {
            const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
            setProducts(updatedProducts)
            saveProductsToLocalStorage(updatedProducts)
          } catch (reloadError) {
            console.error("Error al recargar productos después de procesar área seleccionada:", reloadError)
          }

          // Mostrar mensaje de éxito
          setSuccessMessage("Producto añadido correctamente desde el escaneo")
          setTimeout(() => setSuccessMessage(null), 3000)

          // Actualizar la hora de la última actualización
          setLastUpdate(new Date())

          // Filtrar por fecha de hoy al agregar un producto (compra nueva)
          const todayDate = new Date().toISOString().split("T")[0]
          setDateFilter(todayDate)

          // Emitir evento de sincronización a otros dispositivos
          broadcastProductAdded(newProduct)
        }
      } else {
        setErrorMessage("No se pudo extraer el título y el precio del área seleccionada")
      }
    } catch (error) {
      console.error("Error al procesar el área seleccionada:", error)
      setErrorMessage("Error al procesar el área seleccionada. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para procesar ambas áreas (título y precio)
  const processBothAreas = async () => {
    if (!imageSrc || !titleRect || !priceRect) {
      // Eliminar este mensaje de error ya que puede ser confuso
      // setErrorMessage("No se pudo cargar la imagen o no se han seleccionado ambas áreas")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      // Crear una nueva imagen para procesar
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const titleText = await processAreaForText(img, titleRect)
      const priceText = await processAreaForText(img, priceRect)

      setDebugSteps([`Título: ${titleText}`, `Precio: ${priceText}`])

      const title = titleText.trim()
      // Reemplazar coma por punto para asegurar que se procese correctamente
      const cleanPriceText = priceText.replace(",", ".")
      const price = Number.parseFloat(cleanPriceText)

      if (isNaN(price)) {
        setErrorMessage("No se pudo extraer un precio válido del área seleccionada")
        return
      }

      // Crear canvas que incluya ambas áreas seleccionadas
      const combinedCanvas = document.createElement("canvas")
      const minX = Math.min(titleRect.x, priceRect.x)
      const minY = Math.min(titleRect.y, priceRect.y)
      const maxX = Math.max(titleRect.x + titleRect.width, priceRect.x + priceRect.width)
      const maxY = Math.max(titleRect.y + titleRect.height, priceRect.y + priceRect.height)

      combinedCanvas.width = maxX - minX
      combinedCanvas.height = maxY - minY
      const combinedCtx = combinedCanvas.getContext("2d")

      if (combinedCtx) {
        // Dibujar el área combinada en el canvas
        combinedCtx.drawImage(img, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY)

        // Convertir el canvas a base64 para guardar como imagen
        const combinedImageData = combinedCanvas.toDataURL("image/jpeg", 0.8)

        const productData = {
          title,
          price,
          quantity: 1,
          storeId: activeStoreId,
          projectId: activeProjectId,
          image: combinedImageData, // Usar la imagen del área combinada
          createdAt: new Date().toISOString(),
        }

        // Añadir el producto a la base de datos
        const newProduct = await ProductService.addProduct(user.id, productData)
        console.log("Producto añadido desde ambas áreas:", newProduct)

        // Recargar productos después de añadir
        try {
          const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
          setProducts(updatedProducts)
          saveProductsToLocalStorage(updatedProducts)
        } catch (reloadError) {
          console.error("Error al recargar productos después de procesar ambas áreas:", reloadError)
        }

        // Mostrar mensaje de éxito
        setSuccessMessage("Producto añadido correctamente desde el escaneo avanzado")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Actualizar la hora de la última actualización
        setLastUpdate(new Date())

        // Filtrar por fecha de hoy al agregar un producto (compra nueva)
        const todayDate = new Date().toISOString().split("T")[0]
        setDateFilter(todayDate)

        // Emitir evento de sincronización a otros dispositivos
        broadcastProductAdded(newProduct)
      }
    } catch (error) {
      console.error("Error al procesar ambas áreas:", error)
      setErrorMessage("Error al procesar ambas áreas. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
      return "Hace menos de un minuto"
    } else if (minutes < 60) {
      return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`
    } else {
      const hours = Math.floor(minutes / 60)
      if (hours < 24) {
        return `Hace ${hours} hora${hours > 1 ? "s" : ""}`
      } else {
        const days = Math.floor(hours / 24)
        return `Hace ${days} día${days > 1 ? "s" : ""}`
      }
    }
  }

  // Modificar el useEffect que resetea el estado cuando cambia la tienda activa
  // para que no haga nada si hay una imagen cargada
  useEffect(() => {
    // Siempre resetear el estado cuando cambia la tienda activa
    console.log("Cambiando de tienda, reseteando estado completo")
    resetState()
  }, [activeStoreId])

  // Añadir un useEffect para depurar los cambios en el estado de los proyectos

  // Añadir este useEffect después de los otros useEffects
  useEffect(() => {
    console.log("Estado de proyectos actualizado:", projects)
  }, [projects])

  // Modificar el useEffect que carga los datos al inicio para forzar una carga de proyectos al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      if (user) {
        console.log("Cargando proyectos al montar el componente...")
        try {
          const projects = await ProjectService.getProjects(user.id)
          if (projects && projects.length > 0) {
            console.log("Proyectos iniciales cargados:", projects)
            setProjects(projects)
            saveProjectsToLocalStorage(projects)

            // Establecer el proyecto predeterminado como activo
            const defaultProject = projects.find((project) => project.isDefault)
            if (defaultProject) {
              setActiveProjectId(defaultProject.id)
            } else if (projects.length > 0) {
              setActiveProjectId(projects[0].id)
            }
          }
        } catch (error) {
          console.error("Error al cargar proyectos iniciales:", error)
        }
      }
    }

    loadInitialData()
  }, [user]) // Solo ejecutar cuando el usuario cambia

  // Renderizar el componente
  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          {/* Selector de proyectos */}
          <ProjectSelector
            projects={projects}
            activeProjectId={activeProjectId}
            onProjectChange={setActiveProjectId}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
        </div>

        {/* Selector de tiendas */}
        <StoreSelector
          stores={stores}
          activeStoreId={activeStoreId}
          onStoreChange={(storeId, switchToProducts) => {
            setActiveStoreId(storeId)
            // Si se solicita cambiar a la pestaña de productos, hacerlo
            if (switchToProducts) {
              setActiveTab("products")
            }
          }}
          onAddStore={handleAddStore}
          onDeleteStore={handleDeleteStore}
          onUpdateStore={handleUpdateStore}
        />

        {/* Pestañas de navegación */}
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "products"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Productos
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "summary" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("summary")}
          >
            Resumen y Gráficas
          </button>
          <button
            className={`py-2 px-4 font-medium flex items-center ${
              activeTab === "exchange"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("exchange")}
          >
            Dólar Hoy
            <span className="ml-2 text-xs bg-gray-100 rounded-full px-2 py-1 hidden md:flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              <span className="whitespace-nowrap">
                BCV: {exchangeRates.bcv !== "..." ? exchangeRates.bcv : "..."} | Paralelo:{" "}
                {exchangeRates.parallel !== "..." ? exchangeRates.parallel : "..."}
              </span>
            </span>
            <span className="ml-2 text-xs bg-gray-100 rounded-full px-2 py-1 flex md:hidden flex-col items-center">
              <div className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                <span>BCV: {exchangeRates.bcv !== "..." ? exchangeRates.bcv : "..."}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-3 h-3 mr-1" />
                <span>Paralelo: {exchangeRates.parallel !== "..." ? exchangeRates.parallel : "..."}</span>
              </div>
            </span>
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "finances"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("finances")}
          >
            Finanzas
          </button>
        </div>

        {/* Contenido según la pestaña activa */}
        {activeTab === "products" ? (
          <>
            {/* Verificar si estamos en la vista "Total" */}
            {activeStoreId !== stores.find((store) => store.name === "Total")?.id && (
              <>
                {/* Carga de imágenes - solo visible en tiendas específicas */}
                <ImageUploader onImageCapture={handleImageCapture} />

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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold">Productos</h2>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={forceRefreshData}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm flex items-center"
                      title="Actualizar todos los datos"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Actualizando...
                        </>
                      ) : (
                        <>Actualizar datos</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">Última actualización: {formatLastUpdate(lastUpdate)}</div>
              </div>

              {/* Añadir el filtro de fecha */}
              <DateFilter
                onDateChange={(date) => {
                  console.log("Fecha seleccionada:", date)
                  setDateFilter(date)
                }}
                onReset={() => {
                  console.log("Filtro de fecha reseteado")
                  setDateFilter(null)
                }}
                activeStoreId={activeStoreId}
                externalSelectedDate={dateFilter}
              />

              {/* Añadir el buscador solo para tiendas específicas (no en Total) */}
              {activeStoreId !== stores.find((store) => store.name === "Total")?.id && (
                <div className="mb-3">
                  <SearchBar onSearch={setSearchTerm} placeholder="Buscar productos por nombre..." />
                </div>
              )}

              <ProductList
                products={products}
                activeStoreId={activeStoreId}
                onRemoveProduct={handleRemoveProduct}
                onUpdateProduct={handleUpdateProduct}
                stores={stores}
                searchTerm={searchTerm} // Pasar el término de búsqueda
                exchangeRates={exchangeRates} // Pasar las tasas de cambio
                dateFilter={dateFilter} // Pasar el filtro de fecha
                hideNoProductsMessage={activeStoreId === stores.find((store) => store.name === "Total")?.id} // Ocultar mensaje en vista Total
                storeSubtotals={storeSubtotals} // Pasar los subtotales por tienda
              />
            </div>

            {/* Resumen total - siempre visible */}
            <TotalSummary
              products={products}
              stores={stores}
              activeStoreId={activeStoreId}
              storeSubtotals={storeSubtotals}
              exchangeRates={exchangeRates} // Pasar las tasas de cambio
              dateFilter={dateFilter} // Pasar el filtro de fecha
            />
          </>
        ) : activeTab === "summary" ? (
          // Pestaña de Resumen y Gráficas
          <ExpenseSummary
            products={products}
            stores={stores}
            storeSubtotals={storeSubtotals}
            exchangeRates={exchangeRates} // Pasar las tasas de cambio
          />
        ) : activeTab === "exchange" ? (
          // Pestaña de Dólar Hoy
          <ExchangeRateDashboard />
        ) : (
          // Pestaña de Finanzas
          <FinanceManager activeProjectId={activeProjectId} />
        )}

        {/* Mostrar mensajes de éxito */}
        {successMessage && (
          <div className="fixed bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
            {successMessage}
          </div>
        )}

        {/* Mostrar mensajes de error */}
        {errorMessage && (
          <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
            {errorMessage}
          </div>
        )}

        {/* Notificaciones de sincronización en tiempo real */}
        <RealtimeToast />
      </div>
      <Footer />
    </>
  )
  async function handleRemoveProduct(productId: string) {
    if (!user) return

    try {
      setIsLoading(true)

      setSuccessMessage("Eliminando producto...")

      const productToDelete = products.find((product) => product.id === productId)
      setProducts((prevProducts) => {
        const updatedProducts = prevProducts.filter((product) => product.id !== productId)
        saveProductsToLocalStorage(updatedProducts)
        return updatedProducts
      })

      const deleteSuccess = await ProductService.deleteProduct(user.id, productId)

      if (deleteSuccess) {
        console.log("Producto eliminado correctamente en la base de datos")

        setSuccessMessage("Producto eliminado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Emitir evento de sincronización a otros dispositivos
        broadcastProductDeleted(productId)
      } else {
        console.error("Error al eliminar producto de la base de datos")

        if (productToDelete) {
          setProducts((prevProducts) => {
            const updatedProducts = [...prevProducts, productToDelete]
            saveProductsToLocalStorage(updatedProducts)
            return updatedProducts
          })
        }

        setErrorMessage("Error al eliminar producto. Se ha restaurado en la interfaz.")
        setTimeout(() => setErrorMessage(null), 5000)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al eliminar producto:", error)
      setErrorMessage(`Error al eliminar producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateProduct(
    productId: string,
    title: string,
    price: number,
    quantity: number,
    image?: string,
  ) {
    if (!user) return

    try {
      setIsLoading(true)
      console.log(
        "Actualizando producto:",
        productId,
        title,
        price,
        quantity,
        image ? "con nueva imagen" : "sin cambio de imagen",
      )

      setSuccessMessage("Actualizando producto...")

      const updatedProduct = {
        title,
        price,
        quantity,
        storeId: activeStoreId,
        projectId: activeProjectId, // Asegurar que se incluya el projectId
        createdAt: new Date().toISOString(),
        // Solo incluir la imagen si se proporciona
        ...(image !== undefined && { image }),
      }

      console.log("Datos a enviar para actualización:", updatedProduct)

      const updateSuccess = await ProductService.updateProduct(user.id, productId, updatedProduct)

      if (updateSuccess) {
        // Actualizar el estado local inmediatamente
        setProducts((prevProducts) => {
          const updatedProducts = prevProducts.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  title,
                  price,
                  quantity,
                  // Solo actualizar la imagen si se proporciona
                  ...(image !== undefined && { image }),
                }
              : product,
          )
          saveProductsToLocalStorage(updatedProducts)
          return updatedProducts
        })

        // Mostrar mensaje de éxito temporal
        setSuccessMessage("¡Producto actualizado correctamente!")
        setTimeout(() => setSuccessMessage(null), 3000)

        // Emitir evento de sincronización a otros dispositivos
        const productToSync = products.find((p) => p.id === productId)
        if (productToSync) {
          broadcastProductUpdated({
            ...productToSync,
            title,
            price,
            quantity,
            ...(image !== undefined && { image }),
          })
        }
      } else {
        setErrorMessage("Error al actualizar producto en la base de datos.")
        setTimeout(() => setErrorMessage(null), 5000)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      setErrorMessage(`Error al actualizar producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }
}
