"use client"

import { useState, useEffect } from "react"
import Header from "./components/header"
import Footer from "./components/footer"
import StoreSelector from "./components/store-selector"
import ProductList from "./components/product-list"
import ManualProductForm from "./components/manual-product-form"
import TotalSummary from "./components/total-summary"
import SearchBar from "./components/search-bar"
import DateFilter from "./components/date-filter"
import ExpenseSummary from "./components/expense-summary"
import ExchangeRateWidget from "./components/exchange-rate-widget"
import { useAuth } from "./contexts/auth-context"
import { StoreService } from "./services/store-service"
import { ProductService } from "./services/product-service"
import { ExchangeRateService } from "./services/exchange-rate-service"
import type { Product, Store } from "./types"
import { v4 as uuidv4 } from "uuid"

export default function Home() {
  const { user } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string>("total")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [storeSubtotals, setStoreSubtotals] = useState<{ [key: string]: number }>({})
  const [exchangeRates, setExchangeRates] = useState<{ bcv: string; parallel: string }>({
    bcv: "0",
    parallel: "0",
  })
  const [showStats, setShowStats] = useState<boolean>(false)

  // Cargar tiendas y productos al iniciar
  useEffect(() => {
    if (user) {
      loadStores()
      loadProducts()
      loadExchangeRates()
    }
  }, [user])

  // Cargar tiendas
  const loadStores = async () => {
    if (!user) return

    try {
      const storesData = await StoreService.getStores(user.id)

      // Asegurarse de que siempre exista la tienda "Total"
      const totalStore = storesData.find((store) => store.name === "Total")
      if (!totalStore) {
        storesData.unshift({
          id: "total",
          name: "Total",
          userId: user.id,
        })
      }

      setStores(storesData)

      // Si no hay tiendas, establecer la tienda activa como "Total"
      if (storesData.length > 0 && activeStoreId === "") {
        setActiveStoreId(storesData[0].id)
      }
    } catch (error) {
      console.error("Error al cargar tiendas:", error)
    }
  }

  // Cargar productos
  const loadProducts = async () => {
    if (!user) return

    try {
      const productsData = await ProductService.getProducts(user.id)
      setProducts(productsData)

      // Guardar en localStorage para uso offline
      localStorage.setItem("cached_products", JSON.stringify(productsData))
    } catch (error) {
      console.error("Error al cargar productos:", error)

      // Intentar cargar desde localStorage si hay un error
      const cachedProducts = localStorage.getItem("cached_products")
      if (cachedProducts) {
        setProducts(JSON.parse(cachedProducts))
      }
    }
  }

  // Cargar tasas de cambio
  const loadExchangeRates = async () => {
    try {
      const rates = await ExchangeRateService.getExchangeRates()
      setExchangeRates({
        bcv: rates.bcv,
        parallel: rates.parallel,
      })
    } catch (error) {
      console.error("Error al cargar tasas de cambio:", error)
    }
  }

  // Calcular subtotales por tienda
  useEffect(() => {
    const subtotals: { [key: string]: number } = {}
    let total = 0

    // Inicializar subtotales
    stores.forEach((store) => {
      subtotals[store.id] = 0
    })

    // Calcular subtotales
    products.forEach((product) => {
      const subtotal = product.price * product.quantity
      subtotals[product.storeId] = (subtotals[product.storeId] || 0) + subtotal
      total += subtotal
    })

    // Añadir el total general
    subtotals["total"] = total

    setStoreSubtotals(subtotals)
  }, [products, stores])

  // Añadir tienda
  const handleAddStore = async (name: string) => {
    if (!user) return

    try {
      const newStore: Omit<Store, "id"> = {
        name,
        userId: user.id,
      }

      const addedStore = await StoreService.addStore(newStore)
      if (addedStore) {
        setStores((prevStores) => [...prevStores, addedStore])
        setActiveStoreId(addedStore.id)
      }
    } catch (error) {
      console.error("Error al añadir tienda:", error)
    }
  }

  // Eliminar tienda
  const handleDeleteStore = async (storeId: string) => {
    try {
      const success = await StoreService.deleteStore(storeId)
      if (success) {
        // Eliminar productos de la tienda
        const updatedProducts = products.filter((product) => product.storeId !== storeId)
        setProducts(updatedProducts)

        // Eliminar la tienda
        setStores((prevStores) => prevStores.filter((store) => store.id !== storeId))

        // Si la tienda eliminada era la activa, cambiar a "Total"
        if (activeStoreId === storeId) {
          const totalStore = stores.find((store) => store.name === "Total")
          if (totalStore) {
            setActiveStoreId(totalStore.id)
          }
        }
      }
    } catch (error) {
      console.error("Error al eliminar tienda:", error)
    }
  }

  // Añadir producto
  const handleAddProduct = async (title: string, price: number, quantity: number, image?: string) => {
    if (!user) return

    try {
      // Si estamos en la vista "Total", usar la primera tienda que no sea "Total"
      let targetStoreId = activeStoreId
      if (targetStoreId === "total") {
        const firstNonTotalStore = stores.find((store) => store.id !== "total")
        if (firstNonTotalStore) {
          targetStoreId = firstNonTotalStore.id
        } else {
          // Si no hay otras tiendas, crear una
          const newStore: Omit<Store, "id"> = {
            name: "Mi Tienda",
            userId: user.id,
          }

          const addedStore = await StoreService.addStore(newStore)
          if (addedStore) {
            setStores((prevStores) => [...prevStores, addedStore])
            targetStoreId = addedStore.id
          } else {
            console.error("No se pudo crear una tienda para el producto")
            return
          }
        }
      }

      const newProduct: Omit<Product, "id"> = {
        title,
        price,
        quantity,
        storeId: targetStoreId,
        userId: user.id,
        image: image || "/sin-imagen-disponible.jpg",
        createdAt: new Date().toISOString(),
      }

      // Intentar añadir el producto a través de la API
      const addedProduct = await ProductService.addProduct(newProduct)

      if (addedProduct) {
        // Si se añadió correctamente, actualizar el estado
        setProducts((prevProducts) => [...prevProducts, addedProduct])
      } else {
        // Si hay un error en la API, añadir localmente con un ID temporal
        const tempProduct: Product = {
          ...newProduct,
          id: `temp_${uuidv4()}`,
        }
        setProducts((prevProducts) => [...prevProducts, tempProduct])

        // Guardar en localStorage para sincronización posterior
        const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]")
        localStorage.setItem("cached_products", JSON.stringify([...cachedProducts, tempProduct]))
      }
    } catch (error) {
      console.error("Error al añadir producto:", error)

      // En caso de error, añadir localmente con un ID temporal
      const tempProduct: Product = {
        title,
        price,
        quantity,
        storeId: activeStoreId === "total" ? stores.find((s) => s.id !== "total")?.id || "unknown" : activeStoreId,
        userId: user.id,
        id: `temp_${uuidv4()}`,
        image: image || "/sin-imagen-disponible.jpg",
        createdAt: new Date().toISOString(),
      }
      setProducts((prevProducts) => [...prevProducts, tempProduct])

      // Guardar en localStorage para sincronización posterior
      const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]")
      localStorage.setItem("cached_products", JSON.stringify([...cachedProducts, tempProduct]))
    }
  }

  // Actualizar producto
  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      // Intentar actualizar el producto a través de la API
      const result = await ProductService.updateProduct(updatedProduct)

      if (result) {
        // Si se actualizó correctamente, actualizar el estado
        setProducts((prevProducts) =>
          prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
        )
      } else {
        // Si hay un error en la API, actualizar localmente
        setProducts((prevProducts) =>
          prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
        )

        // Actualizar en localStorage
        const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]")
        const updatedCache = cachedProducts.map((product: Product) =>
          product.id === updatedProduct.id ? updatedProduct : product,
        )
        localStorage.setItem("cached_products", JSON.stringify(updatedCache))
      }
    } catch (error) {
      console.error("Error al actualizar producto:", error)

      // En caso de error, actualizar localmente
      setProducts((prevProducts) =>
        prevProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
      )

      // Actualizar en localStorage
      const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]")
      const updatedCache = cachedProducts.map((product: Product) =>
        product.id === updatedProduct.id ? updatedProduct : product,
      )
      localStorage.setItem("cached_products", JSON.stringify(updatedCache))
    }
  }

  // Eliminar producto
  const handleDeleteProduct = async (productId: string) => {
    try {
      // Intentar eliminar el producto a través de la API
      const success = await ProductService.deleteProduct(productId)

      if (success) {
        // Si se eliminó correctamente, actualizar el estado
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))
      } else {
        // Si hay un error en la API, eliminar localmente
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))

        // Actualizar en localStorage
        const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]")
        const updatedCache = cachedProducts.filter((product: Product) => product.id !== productId)
        localStorage.setItem("cached_products", JSON.stringify(updatedCache))
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error)

      // En caso de error, eliminar localmente
      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))

      // Actualizar en localStorage
      const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]")
      const updatedCache = cachedProducts.filter((product: Product) => product.id !== productId)
      localStorage.setItem("cached_products", JSON.stringify(updatedCache))
    }
  }

  // Filtrar productos por tienda, término de búsqueda y fecha
  const filteredProducts = products.filter((product) => {
    // Filtrar por tienda
    const matchesStore = activeStoreId === "total" || product.storeId === activeStoreId

    // Filtrar por término de búsqueda
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtrar por fecha
    let matchesDate = true
    if (dateFilter && product.createdAt) {
      const productDate = new Date(product.createdAt).toISOString().split("T")[0]
      matchesDate = productDate === dateFilter
    }

    return matchesStore && matchesSearch && matchesDate
  })

  // Manejar cambio de tienda activa
  const handleStoreChange = (storeId: string) => {
    setActiveStoreId(storeId)
    setDateFilter(null) // Resetear el filtro de fecha al cambiar de tienda
  }

  // Manejar búsqueda
  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  // Manejar filtro de fecha
  const handleDateChange = (date: string | null) => {
    setDateFilter(date)
  }

  // Manejar reset de filtro de fecha
  const handleResetDateFilter = () => {
    setDateFilter(null)
  }

  // Alternar vista de estadísticas
  const toggleStats = () => {
    setShowStats(!showStats)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda: Selector de tienda, formulario y tasas de cambio */}
          <div className="md:col-span-1 space-y-6">
            <StoreSelector
              stores={stores}
              activeStoreId={activeStoreId}
              onStoreChange={handleStoreChange}
              onAddStore={handleAddStore}
              onDeleteStore={handleDeleteStore}
              storeSubtotals={storeSubtotals}
            />

            <ManualProductForm onAddProduct={handleAddProduct} />

            <ExchangeRateWidget />
          </div>

          {/* Columna central: Lista de productos */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Productos</h2>
              <button onClick={toggleStats} className="text-sm text-blue-600 hover:text-blue-800 md:hidden">
                {showStats ? "Ocultar estadísticas" : "Ver estadísticas"}
              </button>
            </div>

            <SearchBar onSearch={handleSearch} />

            <DateFilter onDateChange={handleDateChange} onReset={handleResetDateFilter} activeStoreId={activeStoreId} />

            <ProductList
              products={filteredProducts}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              exchangeRates={exchangeRates}
              dateFilter={dateFilter}
            />
          </div>

          {/* Columna derecha: Resumen y estadísticas */}
          <div className={`md:col-span-1 space-y-6 ${showStats ? "block" : "hidden md:block"}`}>
            <TotalSummary
              products={products}
              stores={stores}
              activeStoreId={activeStoreId}
              storeSubtotals={storeSubtotals}
              exchangeRates={exchangeRates}
              dateFilter={dateFilter}
            />

            <ExpenseSummary
              products={products}
              stores={stores}
              storeSubtotals={storeSubtotals}
              exchangeRates={exchangeRates}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
