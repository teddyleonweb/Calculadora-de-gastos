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
import { StoreService } from "./services/store-service"
import { ProductService } from "./services/product-service"
import { ExchangeRateService } from "./services/exchange-rate-service"
import ExpenseSummary from "./components/expense-summary"
import SearchBar from "./components/search-bar"
import ExchangeRateDashboard from "./components/exchange-rate-dashboard"
import { DollarSign } from "lucide-react"
import DateFilter from "./components/date-filter"
import FinanceManager from "./components/finance-manager"
import { ProjectService } from "./services/project-service"
import ProjectSelector from "./components/project-selector"

export default function Home() {
  const { user } = useAuth()

  const [stores, setStores] = useState<Store[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string>("")
  const [storeSubtotals, setStoreSubtotals] = useState<{ [key: string]: number }>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>("") // Estado para el proyecto activo

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugText, setDebugText] = useState<string | null>(null)
  const [debugSteps, setDebugSteps] = useState<string[]>([])
  const [showDebugSteps, setShowDebugSteps] = useState<boolean>(false)

  const [rect, setRect] = useState<Rectangle | null>(null)
  const [titleRect, setTitleRect] = useState<Rectangle | null>(null)
  const [priceRect, setPriceRect] = useState<Rectangle | null>(null)
  const [selectionMode, setSelectionMode] = useState<"title" | "price" | "basic" | null>(null)
  const [selectionsReady, setSelectionsReady] = useState<boolean>(false)
  const [scanMode, setScanMode] = useState<"basic" | "advanced">("basic")

  const [manualTitle, setManualTitle] = useState<string>("")
  const [manualPrice, setManualPrice] = useState<string>("")

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const isProcessingRef = useRef<boolean>(false)
  const isLoadingDataRef = useRef<boolean>(false)
  const dataLoadedRef = useRef<boolean>(false)
  const initialLoadAttemptedRef = useRef<boolean>(false)
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 15))

  const [activeTab, setActiveTab] = useState<"products" | "summary" | "exchange" | "finances">("products")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [exchangeRates, setExchangeRates] = useState<{
    bcv: string
    parallel: string
  }>({
    bcv: "...",
    parallel: "...",
  })

  const [dateFilter, setDateFilter] = useState<string | null>(null)

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

  const resetSelection = () => {
    setRect(null)
    setTitleRect(null)
    setPriceRect(null)
    setSelectionMode(null)
    setSelectionsReady(false)
  }

  const processAreaForText = async (img: HTMLImageElement, rect: Rectangle): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const validX = Math.max(0, Math.min(rect.x, img.width))
        const validY = Math.max(0, Math.min(rect.y, img.height))
        const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
        const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

        if (validWidth < 5 || validHeight < 5) {
          reject("El área seleccionada es demasiado pequeña para procesar")
          return
        }

        const croppedCanvas = document.createElement("canvas")
        croppedCanvas.width = validWidth
        croppedCanvas.height = validHeight
        const croppedCtx = croppedCanvas.getContext("2d")

        if (!croppedCtx) {
          reject("No se pudo crear el contexto del canvas")
          return
        }

        croppedCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

        const worker = await Tesseract.createWorker()
        const result = await worker.recognize(croppedCanvas)
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

  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const rates = await ExchangeRateService.getExchangeRates()
        if (rates.bcv !== "Error" && rates.parallel !== "Error") {
          setExchangeRates({
            bcv: rates.bcv,
            parallel: rates.parallel,
          })
        }
      } catch (error) {
        console.error("Error al cargar tasas de cambio:", error)
      }
    }

    loadExchangeRates()
    const intervalId = setInterval(loadExchangeRates, 30 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

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

  const loadUserData = async () => {
    if (user && !isLoadingDataRef.current) {
      isLoadingDataRef.current = true
      try {
        setIsLoading(true)
        console.log("Cargando datos del usuario:", user.id)

        const cachedProjects = loadProjectsFromLocalStorage()
        const cachedStores = loadStoresFromLocalStorage()
        const cachedProducts = loadProductsFromLocalStorage()

        if (cachedProjects.length > 0) {
          console.log("Usando proyectos en caché mientras se cargan datos frescos...")
          setProjects(cachedProjects)

          const currentActiveProjectId = activeProjectId
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

          const currentActiveStoreId = activeStoreId
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

        try {
          console.log("Solicitando proyectos desde la API...")
          const projects = await ProjectService.getProjects(user.id)
          console.log("Proyectos cargados:", projects)

          if (projects && projects.length > 0) {
            console.log("Proyectos cargados correctamente:", projects.length)
            setProjects(projects)
            saveProjectsToLocalStorage(projects)

            if (initialLoadAttemptedRef.current === false) {
              initialLoadAttemptedRef.current = true
              const defaultProject = projects.find((project) => project.isDefault)
              if (defaultProject) {
                console.log("Primera carga: estableciendo proyecto predeterminado como activo:", defaultProject.id)
                setActiveProjectId(defaultProject.id)
              } else if (projects.length > 0) {
                setActiveProjectId(projects[0].id)
              }
            } else {
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

        const projectIdToUse = activeProjectId || projects?.find((p) => p.isDefault)?.id || projects?.[0]?.id || "1"

        console.log("Usando projectId para cargar tiendas y productos:", projectIdToUse)

        try {
          console.log("Solicitando tiendas desde la API filtradas por proyecto:", projectIdToUse)
          const stores = await StoreService.getStores(user.id, projectIdToUse)
          console.log("Tiendas cargadas:", stores.length)

          if (stores && stores.length > 0) {
            setStores(stores)
            saveStoresToLocalStorage(stores)

            if (initialLoadAttemptedRef.current === false) {
              initialLoadAttemptedRef.current = true
              const totalStore = stores.find((store) => store.name === "Total")
              if (totalStore) {
                console.log("Primera carga: estableciendo Total como tienda activa:", totalStore.id)
                setActiveStoreId(totalStore.id)
              } else if (stores.length > 0) {
                setActiveStoreId(stores[0].id)
              }
            } else {
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

  useEffect(() => {
    const loadUserData = async () => {
      if (user && !isLoadingDataRef.current) {
        isLoadingDataRef.current = true
        try {
          setIsLoading(true)
          console.log("Cargando datos del usuario:", user.id)

          const cachedStores = loadStoresFromLocalStorage()
          const cachedProducts = loadProductsFromLocalStorage()

          if (cachedStores.length > 0) {
            console.log("Usando tiendas en caché mientras se cargan datos frescos...")
            setStores(cachedStores)

            const currentActiveStoreId = activeStoreId
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

          try {
            console.log("Solicitando tiendas desde la API...")
            const stores = await StoreService.getStores(user.id)
            console.log("Tiendas cargadas:", stores.length)

            if (stores && stores.length > 0) {
              setStores(stores)
              saveStoresToLocalStorage(stores)

              if (initialLoadAttemptedRef.current === false) {
                initialLoadAttemptedRef.current = true
                const totalStore = stores.find((store) => store.name === "Total")
                if (totalStore) {
                  console.log("Primera carga: estableciendo Total como tienda activa:", totalStore.id)
                  setActiveStoreId(totalStore.id)
                } else if (stores.length > 0) {
                  setActiveStoreId(stores[0].id)
                }
              } else {
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

    console.log("Iniciando carga de datos (montaje o cambio de usuario)...")
    loadUserData()

    const handleFocus = () => {
      console.log("Ventana recuperó el foco, recargando solo productos y tiendas sin cambiar la tienda activa...")
      reloadDataWithoutChangingStore()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Página visible nuevamente, recargando solo productos y tiendas sin cambiar la tienda activa...")
        reloadDataWithoutChangingStore()
      }
    }

    const reloadDataWithoutChangingStore = async () => {
      if (user && !isLoadingDataRef.current) {
        isLoadingDataRef.current = true
        try {
          console.log("Recargando datos sin cambiar la tienda activa...")

          try {
            const stores = await StoreService.getStores(user.id)
            if (stores && stores.length > 0) {
              setStores(stores)
              saveStoresToLocalStorage(stores)
            }
          } catch (storeError) {
            console.error("Error al recargar tiendas:", storeError)
          }

          try {
            const products = await ProductService.getProducts(user.id)
            if (products && products.length > 0) {
              setProducts(products)
              saveProductsToLocalStorage(products)
            }
          } catch (productError) {
            console.error("Error al recargar productos:", productError)
          }

          setLastUpdate(new Date())
        } catch (error) {
          console.error("Error al recargar datos:", error)
        } finally {
          isLoadingDataRef.current = false
        }
      }
    }

    const handlePageLoad = () => {
      console.log("Página recargada completamente, asegurando datos frescos...")
      loadUserData()
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("load", handlePageLoad)

    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("load", handlePageLoad)
    }
  }, [user, activeTab])

  useEffect(() => {
    const subtotals: { [key: string]: number } = {}

    stores.forEach((store) => {
      subtotals[store.id] = 0
    })

    products.forEach((product) => {
      const storeId = product.storeId
      if (!subtotals[storeId]) {
        subtotals[storeId] = 0
      }
      subtotals[storeId] += product.price * product.quantity
    })

    setStoreSubtotals(subtotals)
  }, [products, stores])

  useEffect(() => {
    console.log("Cambiando de tienda, reseteando estado completo")
    resetState()
  }, [activeStoreId])

  useEffect(() => {
    const savedActiveStoreId = localStorage.getItem("active_store_id")

    if (savedActiveStoreId && stores.some((store) => store.id === savedActiveStoreId)) {
      console.log("Restaurando tienda activa desde localStorage:", savedActiveStoreId)
      setActiveStoreId(savedActiveStoreId)
    } else {
      const totalStore = stores.find((store) => store.name === "Total")
      if (totalStore) {
        console.log("Estableciendo Total como tienda activa predeterminada:", totalStore.id)
        setActiveStoreId(totalStore.id)
      }
    }
  }, [stores.length])

  useEffect(() => {
    if (activeStoreId) {
      localStorage.setItem("active_store_id", activeStoreId)
      console.log("Guardando tienda activa en localStorage:", activeStoreId)
    }
  }, [activeStoreId])

  useEffect(() => {
    const savedActiveProjectId = localStorage.getItem("active_project_id")

    if (savedActiveProjectId && projects.some((project) => project.id === savedActiveProjectId)) {
      console.log("Restaurando proyecto activo desde localStorage:", savedActiveProjectId)
      setActiveProjectId(savedActiveProjectId)
    } else {
      const defaultProject = projects.find((project) => project.isDefault)
      if (defaultProject) {
        console.log("Estableciendo proyecto predeterminado como activo:", defaultProject.id)
        setActiveProjectId(defaultProject.id)
      }
    }
  }, [projects.length])

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem("active_project_id", activeProjectId)
      console.log("Guardando proyecto activo en localStorage:", activeProjectId)
    }
  }, [activeProjectId])

  useEffect(() => {
    if (user && activeProjectId) {
      console.log(
        "Proyecto activo cambiado a:",
        activeProjectId,
        "- cargando tiendas y productos filtrados por este proyecto",
      )

      const loadStores = async () => {
        try {
          console.log(`Cargando tiendas para proyecto: ${activeProjectId}`)
          const stores = await StoreService.getStores(user.id, activeProjectId)

          console.log(`Tiendas filtradas por proyecto ${activeProjectId}:`, stores.length, stores)
          setStores(stores)
          saveStoresToLocalStorage(stores)

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

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  const handleAddProject = async (name: string, description?: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      const newProject = await ProjectService.addProject(user.id, name, description)
      console.log("Proyecto añadido correctamente:", newProject)

      setProjects((prevProjects) => {
        const exists = prevProjects.some((p) => p.id === newProject.id)
        if (exists) return prevProjects
        const updatedProjects = [...prevProjects, newProject]
        saveProjectsToLocalStorage(updatedProjects)
        return updatedProjects
      })

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

      setSuccessMessage("Proyecto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

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

      setSuccessMessage("Actualizando proyecto...")

      const updatedProject = await ProjectService.updateProject(user.id, projectId, name, description)

      setProjects((prevProjects) => {
        const updatedProjects = prevProjects.map((project) =>
          project.id === projectId ? { ...project, name, description } : project,
        )
        saveProjectsToLocalStorage(updatedProjects)
        return updatedProjects
      })

      setSuccessMessage("¡Proyecto actualizado correctamente!")
      setTimeout(() => setSuccessMessage(null), 3000)

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

    const defaultProject = projects.find((project) => project.isDefault)
    if (projectId === defaultProject?.id) return

    try {
      setIsLoading(true)

      setSuccessMessage("Eliminando proyecto...")

      const projectToDelete = projects.find((project) => project.id === projectId)
      setProjects((prevProjects) => {
        const updatedProjects = prevProjects.filter((project) => project.id !== projectId)
        saveProjectsToLocalStorage(updatedProjects)
        return updatedProjects
      })

      if (activeProjectId === projectId) {
        const availableProjects = projects.filter((project) => project.id !== projectId)
        setActiveProjectId(availableProjects.length > 0 ? availableProjects[0].id : defaultProject?.id || "")
      }

      const deleteSuccess = await ProjectService.deleteProject(user.id, projectId)

      if (deleteSuccess) {
        console.log("Proyecto eliminado correctamente en la base de datos")

        setSuccessMessage("Proyecto eliminado correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        console.error("Error al eliminar proyecto de la base de datos")

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

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al eliminar proyecto:", error)
      setErrorMessage(`Error al eliminar proyecto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStore = async (name: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log("Añadiendo tienda:", name, "al proyecto:", activeProjectId)

      if (!activeProjectId) {
        throw new Error("No hay un proyecto activo seleccionado")
      }

      const newStore = await StoreService.addStore(user.id, name, activeProjectId)

      setStores((prevStores) => {
        const exists = prevStores.some((s) => s.id === newStore.id)
        if (exists) return prevStores
        const updatedStores = [...prevStores, newStore]
        saveStoresToLocalStorage(updatedStores)
        return updatedStores
      })

      setActiveStoreId(newStore.id)

      setSuccessMessage("Tienda añadida correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al añadir tienda:", error)
      setErrorMessage(`Error al añadir tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddManualProduct = async (title: string, price: number, quantity: number, image?: string) => {
    if (!user) return

    try {
      console.log("Iniciando adición manual de producto:", title, price, quantity, image ? "con imagen" : "sin imagen")
      console.log("Proyecto activo:", activeProjectId)
      console.log("Tienda activa:", activeStoreId)
      setIsLoading(true)

      setSuccessMessage("Añadiendo producto...")

      const defaultImage = "/sin-imagen-disponible.jpg"

      const productData = {
        title,
        price,
        quantity,
        storeId: activeStoreId,
        projectId: activeProjectId,
        image: image || defaultImage,
        createdAt: new Date().toISOString(),
      }

      console.log("Datos del producto a enviar:", productData)

      const newProduct = await ProductService.addProduct(user.id, productData)
      console.log("Producto añadido correctamente en la base de datos:", newProduct)

      setProducts((prevProducts) => {
        const updatedProducts = [...prevProducts, { ...newProduct, isEditing: false }]
        saveProductsToLocalStorage(updatedProducts)
        console.log("Estado local actualizado con nuevo producto")
        return updatedProducts
      })

      try {
        const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
        console.log("Productos recargados después de añadir:", updatedProducts.length)
        setProducts(updatedProducts)
        saveProductsToLocalStorage(updatedProducts)
      } catch (reloadError) {
        console.error("Error al recargar productos después de añadir:", reloadError)
      }

      setSuccessMessage("Producto añadido correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al añadir producto manualmente:", error)
      setErrorMessage(`Error al añadir producto: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const forceRefreshData = async () => {
    if (user) {
      try {
        setIsLoading(true)
        setSuccessMessage("Actualizando datos...")

        console.log("Forzando la recarga completa de datos filtrados por proyecto:", activeProjectId)

        try {
          console.log("Recargando proyectos...")
          const freshProjects = await ProjectService.getProjects(user.id)
          const activeProjectExists = freshProjects.some((project) => project.id === activeProjectId)
          setProjects(freshProjects)
          saveProjectsToLocalStorage(freshProjects)

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

        const projectIdToUse = activeProjectId || projects?.find((p) => p.isDefault)?.id || projects?.[0]?.id || "1"

        try {
          console.log("Recargando tiendas filtradas por proyecto:", projectIdToUse)
          const freshStores = await StoreService.getStores(user.id, projectIdToUse)
          const activeStoreExists = freshStores.some((store) => store.id === activeStoreId)
          setStores(freshStores)
          saveStoresToLocalStorage(freshStores)

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

  const handleDeleteStore = async (storeId: string): Promise<void> => {
    if (!user) return

    const totalStore = stores.find((store) => store.name === "Total")
    if (storeId === totalStore?.id) return

    try {
      setIsLoading(true)

      setSuccessMessage("Eliminando tienda...")

      const storeToDelete = stores.find((store) => store.id === storeId)
      setStores((prevStores) => {
        const updatedStores = prevStores.filter((store) => store.id !== storeId)
        saveStoresToLocalStorage(updatedStores)
        return updatedStores
      })

      if (activeStoreId === storeId) {
        const availableStores = stores.filter((store) => store.id !== storeId)
        setActiveStoreId(availableStores.length > 0 ? availableStores[0].id : totalStore?.id || "")
      }

      const deleteSuccess = await StoreService.deleteStore(user.id, storeId)

      if (deleteSuccess) {
        console.log("Tienda eliminada correctamente en la base de datos")

        setSuccessMessage("Tienda eliminada correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        console.error("Error al eliminar tienda de la base de datos")

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

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
      setErrorMessage(`Error al eliminar tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStore = async (storeId: string, name: string): Promise<void> => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log("Actualizando tienda:", storeId, name)

      setSuccessMessage("Actualizando tienda...")

      const updatedStore = await StoreService.updateStore(user.id, storeId, name)

      setStores((prevStores) => {
        const updatedStores = prevStores.map((store) => (store.id === storeId ? { ...store, name } : store))
        saveStoresToLocalStorage(updatedStores)
        return updatedStores
      })

      setSuccessMessage("¡Tienda actualizada correctamente!")
      setTimeout(() => setSuccessMessage(null), 3000)

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al actualizar tienda:", error)
      setErrorMessage(`Error al actualizar tienda: ${error instanceof Error ? error.message : String(error)}`)
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageCapture = (src: string | null) => {
    setImageSrc(src)
  }

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

      const lines = text.split("\n")

      const regex = /([A-Za-z0-9\s]+)\s+(\d+(\.\d{1,2})?)/

      const newProducts = lines
        .map((line, index) => {
          const match = line.match(regex)
          if (match) {
            const title = match[1].trim()
            const price = Number.parseFloat(match[2])
            const productData = {
              id: generateId(),
              title,
              price,
              quantity: 1,
              storeId: activeStoreId,
              projectId: activeProjectId,
              isEditing: false,
              image: imageSrc,
              createdAt: new Date().toISOString(),
            }
            return productData
          } else {
            return null
          }
        })
        .filter((product) => product !== null) as Product[]

      for (const product of newProducts) {
        try {
          const addedProduct = await ProductService.addProduct(user.id, product)
          console.log("Producto añadido desde imagen completa:", addedProduct)
        } catch (error) {
          console.error("Error al añadir producto desde imagen completa:", error)
        }
      }

      try {
        const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
        setProducts(updatedProducts)
        saveProductsToLocalStorage(updatedProducts)
      } catch (reloadError) {
        console.error("Error al recargar productos después de procesar imagen completa:", reloadError)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error al procesar la imagen completa:", error)
      setErrorMessage("Error al procesar la imagen. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const processSelectedArea = async () => {
    if (!imageSrc || !rect) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const text = await processAreaForText(img, rect)
      setDebugText(text)

      const regex = /([A-Za-z0-9\s]+)\s+(\d+[.,]\d{1,2}|\d+)/

      const match = text.match(regex)
      if (match) {
        const title = match[1].trim()
        const priceText = match[2].replace(",", ".")
        const price = Number.parseFloat(priceText)

        const validX = Math.max(0, Math.min(rect.x, img.width))
        const validY = Math.max(0, Math.min(rect.y, img.height))
        const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
        const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

        const croppedCanvas = document.createElement("canvas")
        croppedCanvas.width = validWidth
        croppedCanvas.height = validHeight
        const croppedCtx = croppedCanvas.getContext("2d")

        if (croppedCtx) {
          croppedCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

          const croppedImageData = croppedCanvas.toDataURL("image/jpeg", 0.8)

          const productData = {
            title,
            price,
            quantity: 1,
            storeId: activeStoreId,
            projectId: activeProjectId,
            image: croppedImageData,
            createdAt: new Date().toISOString(),
          }

          const newProduct = await ProductService.addProduct(user.id, productData)
          console.log("Producto añadido desde área seleccionada:", newProduct)

          try {
            const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
            setProducts(updatedProducts)
            saveProductsToLocalStorage(updatedProducts)
          } catch (reloadError) {
            console.error("Error al recargar productos después de procesar área seleccionada:", reloadError)
          }

          setSuccessMessage("Producto añadido correctamente desde el escaneo")
          setTimeout(() => setSuccessMessage(null), 3000)

          setLastUpdate(new Date())
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

  const processBothAreas = async () => {
    if (!imageSrc || !titleRect || !priceRect) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
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
      const cleanPriceText = priceText.replace(",", ".")
      const price = Number.parseFloat(cleanPriceText)

      if (isNaN(price)) {
        setErrorMessage("No se pudo extraer un precio válido del área seleccionada")
        return
      }

      const combinedCanvas = document.createElement("canvas")
      const minX = Math.min(titleRect.x, priceRect.x)
      const minY = Math.min(titleRect.y, priceRect.y)
      const maxX = Math.max(titleRect.x + titleRect.width, priceRect.x + priceRect.width)
      const maxY = Math.max(titleRect.y + titleRect.height, priceRect.y + priceRect.height)

      combinedCanvas.width = maxX - minX
      combinedCanvas.height = maxY - minY
      const combinedCtx = combinedCanvas.getContext("2d")

      if (combinedCtx) {
        combinedCtx.drawImage(img, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY)

        const combinedImageData = combinedCanvas.toDataURL("image/jpeg", 0.8)

        const productData = {
          title,
          price,
          quantity: 1,
          storeId: activeStoreId,
          projectId: activeProjectId,
          image: combinedImageData,
          createdAt: new Date().toISOString(),
        }

        const newProduct = await ProductService.addProduct(user.id, productData)
        console.log("Producto añadido desde ambas áreas:", newProduct)

        try {
          const updatedProducts = await ProductService.getProducts(user.id, activeProjectId)
          setProducts(updatedProducts)
          saveProductsToLocalStorage(updatedProducts)
        } catch (reloadError) {
          console.error("Error al recargar productos después de procesar ambas áreas:", reloadError)
        }

        setSuccessMessage("Producto añadido correctamente desde el escaneo avanzado")
        setTimeout(() => setSuccessMessage(null), 3000)

        setLastUpdate(new Date())
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

  useEffect(() => {
    console.log("Cambiando de tienda, reseteando estado completo")
    resetState()
  }, [activeStoreId])

  useEffect(() => {
    console.log("Estado de proyectos actualizado:", projects)
  }, [projects])

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
  }, [user])

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <ProjectSelector
            projects={projects}
            activeProjectId={activeProjectId}
            onProjectChange={setActiveProjectId}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
          />
        </div>

        <StoreSelector
          stores={stores}
          activeStoreId={activeStoreId}
          onStoreChange={(storeId, switchToProducts) => {
            setActiveStoreId(storeId)
            if (switchToProducts) {
              setActiveTab("products")
            }
          }}
          onAddStore={handleAddStore}
          onDeleteStore={handleDeleteStore}
          onUpdateStore={handleUpdateStore}
        />

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

        {activeTab === "products" ? (
          <>
            {activeStoreId !== stores.find((store) => store.name === "Total")?.id && (
              <>
                <ImageUploader onImageCapture={handleImageCapture} />

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

                <ManualProductForm
                  onAddProduct={handleAddManualProduct}
                  initialTitle={manualTitle}
                  initialPrice={manualPrice}
                />
              </>
            )}

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
              />

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
                searchTerm={searchTerm}
                exchangeRates={exchangeRates}
                dateFilter={dateFilter}
                hideNoProductsMessage={activeStoreId === stores.find((store) => store.name === "Total")?.id}
                storeSubtotals={storeSubtotals}
              />
            </div>

            <TotalSummary
              products={products}
              stores={stores}
              activeStoreId={activeStoreId}
              storeSubtotals={storeSubtotals}
              exchangeRates={exchangeRates}
              dateFilter={dateFilter}
            />
          </>
        ) : activeTab === "summary" ? (
          <ExpenseSummary
            products={products}
            stores={stores}
            storeSubtotals={storeSubtotals}
            exchangeRates={exchangeRates}
          />
        ) : activeTab === "exchange" ? (
          <ExchangeRateDashboard />
        ) : (
          // Pasa activeProjectId al componente FinanceManager
          <FinanceManager activeProjectId={activeProjectId} />
        )}

        {successMessage && (
          <div className="fixed bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
            {errorMessage}
          </div>
        )}
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
        projectId: activeProjectId,
        createdAt: new Date().toISOString(),
        ...(image !== undefined && { image }),
      }

      console.log("Datos a enviar para actualización:", updatedProduct)

      const updateSuccess = await ProductService.updateProduct(user.id, productId, updatedProduct)

      if (updateSuccess) {
        setProducts((prevProducts) => {
          const updatedProducts = prevProducts.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  title,
                  price,
                  quantity,
                  ...(image !== undefined && { image }),
                }
              : product,
          )
          saveProductsToLocalStorage(updatedProducts)
          return updatedProducts
        })

        setSuccessMessage("¡Producto actualizado correctamente!")
        setTimeout(() => setSuccessMessage(null), 3000)
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
