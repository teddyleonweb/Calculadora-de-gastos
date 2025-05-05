"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { createWorker } from "tesseract.js"
import type Tesseract from "tesseract.js" // Import Tesseract type
import ImageUploader from "@/components/image-uploader"
import ImageEditor from "@/components/image-editor"
import ProductList from "@/components/product-list"
import StoreSelector from "@/components/store-selector"
import ManualProductForm from "@/components/manual-product-form"
import TotalSummary from "@/components/total-summary"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { ProductService } from "@/services/product-service"
import { StoreService } from "@/services/store-service"
import type { Product, Store, Rectangle } from "@/types"

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugText, setDebugText] = useState<string | null>(null)
  const [debugSteps, setDebugSteps] = useState<string[]>([])
  const [showDebugSteps, setShowDebugSteps] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string>("")
  const [rect, setRect] = useState<Rectangle | null>(null)
  const [titleRect, setTitleRect] = useState<Rectangle | null>(null)
  const [priceRect, setPriceRect] = useState<Rectangle | null>(null)
  const [scanMode, setScanMode] = useState<"basic" | "advanced">("basic")
  const [selectionMode, setSelectionMode] = useState<"title" | "price" | "basic" | null>(null)
  const [selectionsReady, setSelectionsReady] = useState<boolean>(false)
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [showManualForm, setShowManualForm] = useState<boolean>(false)
  const [manualProduct, setManualProduct] = useState<Partial<Product> | null>(null)
  const [isEditingProduct, setIsEditingProduct] = useState<boolean>(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isAddingStore, setIsAddingStore] = useState<boolean>(false)
  const [newStoreName, setNewStoreName] = useState<string>("")
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false)
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false)
  const [isUpdatingProduct, setIsUpdatingProduct] = useState<boolean>(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false)
  const [isAddingProductToList, setIsAddingProductToList] = useState<boolean>(false)
  const [isRemovingProductFromList, setIsRemovingProductFromList] = useState<boolean>(false)
  const [isUpdatingProductInList, setIsUpdatingProductInList] = useState<boolean>(false)
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(false)
  const [isCreatingList, setIsCreatingList] = useState<boolean>(false)
  const [isUpdatingList, setIsUpdatingList] = useState<boolean>(false)
  const [isDeletingList, setIsDeletingList] = useState<boolean>(false)
  const [isAddingStoreToList, setIsAddingStoreToList] = useState<boolean>(false)
  const [isRemovingStoreFromList, setIsRemovingStoreFromList] = useState<boolean>(false)
  const [isUpdatingStoreInList, setIsUpdatingStoreInList] = useState<boolean>(false)
  const [isLoadingStoreProducts, setIsLoadingStoreProducts] = useState<boolean>(false)
  const [isAddingStoreProduct, setIsAddingStoreProduct] = useState<boolean>(false)
  const [isUpdatingStoreProduct, setIsUpdatingStoreProduct] = useState<boolean>(false)
  const [isDeletingStoreProduct, setIsDeletingStoreProduct] = useState<boolean>(false)
  const [isLoadingStoreProductLists, setIsLoadingStoreProductLists] = useState<boolean>(false)
  const [isCreatingStoreProductList, setIsCreatingStoreProductList] = useState<boolean>(false)
  const [isUpdatingStoreProductList, setIsUpdatingStoreProductList] = useState<boolean>(false)
  const [isDeletingStoreProductList, setIsDeletingStoreProductList] = useState<boolean>(false)
  const [isAddingStoreProductToList, setIsAddingStoreProductToList] = useState<boolean>(false)
  const [isRemovingStoreProductFromList, setIsRemovingStoreProductFromList] = useState<boolean>(false)
  const [isUpdatingStoreProductInList, setIsUpdatingStoreProductInList] = useState<boolean>(false)
  const [isLoadingStoreProductListProducts, setIsLoadingStoreProductListProducts] = useState<boolean>(false)
  const [isAddingStoreProductListProduct, setIsAddingStoreProductListProduct] = useState<boolean>(false)
  const [isUpdatingStoreProductListProduct, setIsUpdatingStoreProductListProduct] = useState<boolean>(false)
  const [isDeletingStoreProductListProduct, setIsDeletingStoreProductListProduct] = useState<boolean>(false)
  const [isLoadingStoreProductListProductLists, setIsLoadingStoreProductListProductLists] = useState<boolean>(false)
  const [isCreatingStoreProductListProductList, setIsCreatingStoreProductListProductList] = useState<boolean>(false)
  const [isUpdatingStoreProductListProductList, setIsUpdatingStoreProductListProductList] = useState<boolean>(false)
  const [isDeletingStoreProductListProductList, setIsDeletingStoreProductListProductList] = useState<boolean>(false)
  const [isAddingStoreProductListProductToList, setIsAddingStoreProductListProductToList] = useState<boolean>(false)
  const [isRemovingStoreProductListProductFromList, setIsRemovingStoreProductListProductFromList] =
    useState<boolean>(false)
  const [isUpdatingStoreProductListProductInList, setIsUpdatingStoreProductListProductInList] = useState<boolean>(false)
  const [isLoadingStoreProductListProductListProducts, setIsLoadingStoreProductListProductListProducts] =
    useState<boolean>(false)
  const [isAddingStoreProductListProductListProduct, setIsAddingStoreProductListProductListProduct] =
    useState<boolean>(false)
  const [isUpdatingStoreProductListProductListProduct, setIsUpdatingStoreProductListProductListProduct] =
    useState<boolean>(false)
  const [isDeletingStoreProductListProductListProduct, setIsDeletingStoreProductListProductListProduct] =
    useState<boolean>(false)
  const [isLoadingStoreProductListProductListProductLists, setIsLoadingStoreProductListProductListProductLists] =
    useState<boolean>(false)
  const [isCreatingStoreProductListProductListProductList, setIsCreatingStoreProductListProductListProductList] =
    useState<boolean>(false)
  const [isUpdatingStoreProductListProductListProductList, setIsUpdatingStoreProductListProductListProductList] =
    useState<boolean>(false)
  const [isDeletingStoreProductListProductListProductList, setIsDeletingStoreProductListProductListProductList] =
    useState<boolean>(false)
  const [isAddingStoreProductListProductListProductToList, setIsAddingStoreProductListProductListProductToList] =
    useState<boolean>(false)
  const [
    isRemovingStoreProductListProductListProductFromList,
    setIsRemovingStoreProductListProductListProductFromList,
  ] = useState<boolean>(false)
  const [isUpdatingStoreProductListProductListProductInList, setIsUpdatingStoreProductListProductListProductInList] =
    useState<boolean>(false)
  const [
    isLoadingStoreProductListProductListProductListProducts,
    setIsLoadingStoreProductListProductListProductListProducts,
  ] = useState<boolean>(false)
  const [
    isAddingStoreProductListProductListProductListProduct,
    setIsAddingStoreProductListProductListProductListProduct,
  ] = useState<boolean>(false)
  const [
    isUpdatingStoreProductListProductListProductListProduct,
    setIsUpdatingStoreProductListProductListProductListProduct,
  ] = useState<boolean>(false)
  const [
    isDeletingStoreProductListProductListProductListProduct,
    setIsDeletingStoreProductListProductListProductListProduct,
  ] = useState<boolean>(false)

  // Referencia para el worker de Tesseract
  const workerRef = useRef<Tesseract.Worker | null>(null)

  // Inicializar el worker de Tesseract
  const initWorker = useCallback(async () => {
    if (!workerRef.current) {
      try {
        const worker = await createWorker("spa")
        workerRef.current = worker
        console.log("Tesseract worker initialized")
      } catch (error) {
        console.error("Error initializing Tesseract worker:", error)
        setErrorMessage("Error al inicializar el reconocimiento de texto. Por favor, recarga la página.")
      }
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    if (user && !authLoading) {
      loadStores()
      initWorker()
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router, initWorker])

  // Cargar tiendas
  const loadStores = async () => {
    if (!user) return

    setIsLoadingStores(true)
    try {
      const fetchedStores = await StoreService.getStores(user.id)

      if (fetchedStores && fetchedStores.length > 0) {
        setStores(fetchedStores)

        // Buscar la tienda "Total" o usar la primera tienda como activa
        const totalStore = fetchedStores.find((store) => store.name === "Total")
        if (totalStore) {
          setActiveStoreId(totalStore.id)
        } else if (fetchedStores.length > 0) {
          setActiveStoreId(fetchedStores[0].id)
        }

        // Cargar productos después de cargar tiendas
        await loadProducts(totalStore ? totalStore.id : fetchedStores[0].id)
      } else {
        // Si no hay tiendas, crear la tienda "Total"
        const newTotalStore = await StoreService.addStore(user.id, "Total")
        setStores([newTotalStore])
        setActiveStoreId(newTotalStore.id)
      }
    } catch (error) {
      console.error("Error loading stores:", error)
      setErrorMessage("Error al cargar las tiendas. Por favor, recarga la página.")
    } finally {
      setIsLoadingStores(false)
      setIsLoadingData(false)
    }
  }

  // Cargar productos
  const loadProducts = async (storeId: string) => {
    if (!user || !storeId) return

    setIsLoadingProducts(true)
    try {
      const fetchedProducts = await ProductService.getProducts(user.id)
      setProducts(fetchedProducts || [])
    } catch (error) {
      console.error("Error loading products:", error)
      setErrorMessage("Error al cargar los productos. Por favor, recarga la página.")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Manejar cambio de tienda
  const handleStoreChange = (storeId: string) => {
    setActiveStoreId(storeId)
    loadProducts(storeId)
  }

  // Añadir tienda
  const handleAddStore = async (name: string) => {
    if (!user || !name.trim()) return

    try {
      const newStore = await StoreService.addStore(user.id, name.trim())
      setStores((prevStores) => [...prevStores, newStore])
      return newStore
    } catch (error) {
      console.error("Error adding store:", error)
      throw error
    }
  }

  // Actualizar tienda
  const handleUpdateStore = async (storeId: string, name: string, image?: string) => {
    if (!user || !storeId || !name.trim()) return

    try {
      const updatedStore = await StoreService.updateStore(user.id, storeId, name.trim(), image)
      setStores((prevStores) =>
        prevStores.map((store) => (store.id === storeId ? { ...store, name: name.trim(), image } : store)),
      )
      return updatedStore
    } catch (error) {
      console.error("Error updating store:", error)
      throw error
    }
  }

  // Eliminar tienda
  const handleDeleteStore = async (storeId: string) => {
    if (!user || !storeId) return

    try {
      await StoreService.deleteStore(user.id, storeId)

      // Actualizar la lista de tiendas
      setStores((prevStores) => prevStores.filter((store) => store.id !== storeId))

      // Si la tienda eliminada era la activa, cambiar a la tienda "Total"
      if (storeId === activeStoreId) {
        const totalStore = stores.find((store) => store.name === "Total")
        if (totalStore) {
          setActiveStoreId(totalStore.id)
          loadProducts(totalStore.id)
        } else if (stores.length > 0) {
          setActiveStoreId(stores[0].id)
          loadProducts(stores[0].id)
        }
      }
    } catch (error) {
      console.error("Error deleting store:", error)
      throw error
    }
  }

  // Manejar captura de imagen
  const handleImageCapture = (imageSrc: string) => {
    setImageSrc(imageSrc)
    setRect(null)
    setTitleRect(null)
    setPriceRect(null)
    setSelectionMode(null)
    setSelectionsReady(false)
    setDebugText(null)
    setDebugSteps([])
    setErrorMessage(null)
  }

  // Procesar imagen completa
  const handleProcessFullImage = async () => {
    if (!imageSrc || !workerRef.current) {
      setErrorMessage("No hay imagen para procesar o el reconocimiento de texto no está listo.")
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      const result = await workerRef.current.recognize(imageSrc)
      const text = result.data.text
      setDebugText(text)

      // Extraer título y precio del texto
      const { title, price } = extractProductInfo(text)

      if (title && price) {
        setManualProduct({
          title,
          price,
          store_id: activeStoreId,
        })
        setShowManualForm(true)
      } else {
        setErrorMessage(
          "No se pudo extraer información del producto. Intenta seleccionar un área específica o ingresa los datos manualmente.",
        )
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setErrorMessage("Error al procesar la imagen. Por favor, intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Procesar área seleccionada
  const handleProcessSelectedArea = async () => {
    if (!imageSrc || !rect || !workerRef.current) {
      setErrorMessage("No hay área seleccionada o el reconocimiento de texto no está listo.")
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      // Crear un canvas para recortar la imagen
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("No se pudo crear el contexto del canvas")
      }

      // Cargar la imagen
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageSrc
      })

      // Configurar el canvas con el tamaño del área seleccionada
      canvas.width = rect.width
      canvas.height = rect.height

      // Dibujar solo el área seleccionada
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)

      // Convertir el canvas a una imagen data URL
      const croppedImageSrc = canvas.toDataURL("image/jpeg")

      // Reconocer texto en el área recortada
      const result = await workerRef.current.recognize(croppedImageSrc)
      const text = result.data.text
      setDebugText(text)

      // Extraer título y precio del texto
      const { title, price } = extractProductInfo(text)

      if (title || price) {
        setManualProduct({
          title: title || "",
          price: price || 0,
          store_id: activeStoreId,
        })
        setShowManualForm(true)
      } else {
        setErrorMessage(
          "No se pudo extraer información del producto. Intenta seleccionar un área diferente o ingresa los datos manualmente.",
        )
      }
    } catch (error) {
      console.error("Error processing selected area:", error)
      setErrorMessage("Error al procesar el área seleccionada. Por favor, intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Procesar ambas áreas (título y precio)
  const handleProcessBothAreas = async () => {
    if (!imageSrc || !titleRect || !priceRect || !workerRef.current) {
      setErrorMessage("No hay áreas seleccionadas o el reconocimiento de texto no está listo.")
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    try {
      // Crear un canvas para recortar la imagen del título
      const titleCanvas = document.createElement("canvas")
      const titleCtx = titleCanvas.getContext("2d")

      // Crear un canvas para recortar la imagen del precio
      const priceCanvas = document.createElement("canvas")
      const priceCtx = priceCanvas.getContext("2d")

      if (!titleCtx || !priceCtx) {
        throw new Error("No se pudo crear el contexto del canvas")
      }

      // Cargar la imagen
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageSrc
      })

      // Configurar el canvas del título
      titleCanvas.width = titleRect.width
      titleCanvas.height = titleRect.height

      // Configurar el canvas del precio
      priceCanvas.width = priceRect.width
      priceCanvas.height = priceRect.height

      // Dibujar solo el área del título
      titleCtx.drawImage(
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

      // Dibujar solo el área del precio
      priceCtx.drawImage(
        img,
        priceRect.x,
        priceRect.y,
        priceRect.width,
        priceRect.height,
        0,
        0,
        priceRect.width,
        priceRect.height,
      )

      // Convertir los canvas a imágenes data URL
      const titleImageSrc = titleCanvas.toDataURL("image/jpeg")
      const priceImageSrc = priceCanvas.toDataURL("image/jpeg")

      // Reconocer texto en el área del título
      const titleResult = await workerRef.current.recognize(titleImageSrc)
      const titleText = titleResult.data.text.trim()

      // Reconocer texto en el área del precio
      const priceResult = await workerRef.current.recognize(priceImageSrc)
      const priceText = priceResult.data.text.trim()

      // Combinar los resultados para depuración
      setDebugText(`Título: ${titleText}\n\nPrecio: ${priceText}`)

      // Extraer precio del texto del precio
      const extractedPrice = extractPriceFromText(priceText)

      if (titleText || extractedPrice) {
        setManualProduct({
          title: titleText || "",
          price: extractedPrice || 0,
          store_id: activeStoreId,
        })
        setShowManualForm(true)
      } else {
        setErrorMessage(
          "No se pudo extraer información del producto. Intenta seleccionar áreas diferentes o ingresa los datos manualmente.",
        )
      }
    } catch (error) {
      console.error("Error processing both areas:", error)
      setErrorMessage("Error al procesar las áreas seleccionadas. Por favor, intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Extraer información del producto del texto
  const extractProductInfo = (text: string): { title: string | null; price: number | null } => {
    setDebugSteps([...debugSteps, "Extrayendo información del producto..."])

    // Extraer precio
    const price = extractPriceFromText(text)
    setDebugSteps([...debugSteps, `Precio extraído: ${price || "No encontrado"}`])

    // Extraer título
    const title = extractTitleFromText(text, price)
    setDebugSteps([...debugSteps, `Título extraído: ${title || "No encontrado"}`])

    return { title, price }
  }

  // Extraer precio del texto
  const extractPriceFromText = (text: string): number | null => {
    // Limpiar el texto
    const cleanedText = text
      .replace(/\s+/g, " ")
      .replace(/[^\d.,\s]/g, " ")
      .trim()

    setDebugSteps([...debugSteps, `Texto limpio para precio: "${cleanedText}"`])

    // Buscar patrones de precio
    const decimalPriceRegex = /\b\d+[,.]\d{1,2}\b/g
    const decimalMatches = cleanedText.match(decimalPriceRegex)

    if (decimalMatches && decimalMatches.length > 0) {
      // Convertir el primer match a número
      const priceStr = decimalMatches[0].replace(",", ".")
      return Number.parseFloat(priceStr)
    }

    // Si no se encontró un precio con decimales, buscar números enteros
    const integerPriceRegex = /\b\d+\b/g
    const integerMatches = cleanedText.match(integerPriceRegex)

    if (integerMatches && integerMatches.length > 0) {
      return Number.parseInt(integerMatches[0], 10)
    }

    return null
  }

  // Extraer título del texto
  const extractTitleFromText = (text: string, price: number | null): string | null => {
    // Si hay un precio, intentar encontrar el título antes del precio
    if (price !== null) {
      const priceIndex = text.indexOf(price.toString())
      if (priceIndex > 0) {
        // Tomar el texto antes del precio como posible título
        const possibleTitle = text.substring(0, priceIndex).trim()
        if (possibleTitle.length > 0) {
          return possibleTitle
        }
      }
    }

    // Si no se pudo extraer el título basado en el precio, usar todo el texto
    const cleanedText = text.trim()
    if (cleanedText.length > 0) {
      // Limitar el título a 100 caracteres
      return cleanedText.substring(0, 100)
    }

    return null
  }

  // Manejar envío del formulario manual
  const handleManualFormSubmit = async (product: Partial<Product>) => {
    if (!user || !activeStoreId) return

    try {
      if (isEditingProduct && editingProductId) {
        // Actualizar producto existente
        setIsUpdatingProduct(true)
        const updatedProduct = await ProductService.updateProduct(user.id, editingProductId, {
          ...product,
          storeId: activeStoreId,
        })

        setProducts((prevProducts) => prevProducts.map((p) => (p.id === editingProductId ? updatedProduct : p)))

        setIsEditingProduct(false)
        setEditingProductId(null)
      } else {
        // Crear nuevo producto
        setIsAddingProduct(true)
        const newProduct = await ProductService.addProduct(user.id, {
          ...product,
          storeId: activeStoreId,
        })

        setProducts((prevProducts) => [...prevProducts, newProduct])
      }

      setShowManualForm(false)
      setManualProduct(null)
    } catch (error) {
      console.error("Error saving product:", error)
      setErrorMessage("Error al guardar el producto. Por favor, intenta de nuevo.")
    } finally {
      setIsAddingProduct(false)
      setIsUpdatingProduct(false)
    }
  }

  // Manejar edición de producto
  const handleEditProduct = (product: Product) => {
    setManualProduct(product)
    setIsEditingProduct(true)
    setEditingProductId(product.id)
    setShowManualForm(true)
  }

  // Manejar eliminación de producto
  const handleDeleteProduct = async (productId: string) => {
    if (!user || !productId) return

    try {
      setIsDeletingProduct(true)
      await ProductService.deleteProduct(user.id, productId)
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId))
    } catch (error) {
      console.error("Error deleting product:", error)
      setErrorMessage("Error al eliminar el producto. Por favor, intenta de nuevo.")
    } finally {
      setIsDeletingProduct(false)
    }
  }

  // Reiniciar selección
  const resetSelection = () => {
    setRect(null)
    setTitleRect(null)
    setPriceRect(null)
    setSelectionMode(null)
    setSelectionsReady(false)
  }

  // Alternar mostrar pasos de depuración
  const toggleDebugSteps = () => {
    setShowDebugSteps(!showDebugSteps)
  }

  // Forzar actualización de productos
  const handleForceRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadProducts(activeStoreId)
    } catch (error) {
      console.error("Error refreshing products:", error)
      setErrorMessage("Error al actualizar los productos. Por favor, intenta de nuevo.")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Si está cargando la autenticación, mostrar spinner
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!user && !authLoading) {
    return null // La redirección se maneja en el useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />

      <main className="mt-4">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <StoreSelector
              stores={stores}
              activeStoreId={activeStoreId}
              onStoreChange={handleStoreChange}
              onAddStore={handleAddStore}
              onDeleteStore={handleDeleteStore}
              onUpdateStore={handleUpdateStore}
            />

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Capturar producto</h2>
              <ImageUploader onImageCapture={handleImageCapture} />

              {imageSrc && (
                <ImageEditor
                  imageSrc={imageSrc}
                  onProcessFullImage={handleProcessFullImage}
                  onProcessSelectedArea={handleProcessSelectedArea}
                  onProcessBothAreas={handleProcessBothAreas}
                  isLoading={isProcessing}
                  errorMessage={errorMessage}
                  debugText={debugText}
                  debugSteps={debugSteps}
                  showDebugSteps={showDebugSteps}
                  onToggleDebugSteps={toggleDebugSteps}
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
            </div>

            {showManualForm && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">
                  {isEditingProduct ? "Editar producto" : "Confirmar producto"}
                </h2>
                <ManualProductForm
                  product={manualProduct}
                  onSubmit={handleManualFormSubmit}
                  onCancel={() => {
                    setShowManualForm(false)
                    setManualProduct(null)
                    setIsEditingProduct(false)
                    setEditingProductId(null)
                  }}
                  isSubmitting={isAddingProduct || isUpdatingProduct}
                />
              </div>
            )}

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Lista de productos</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleForceRefresh}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar lista"
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("auth_token")
                        console.log("Token:", token)

                        const response = await fetch(
                          `/api/proxy?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"}/stores`)}`,
                          {
                            headers: {
                              Authorization: token ? `Bearer ${token}` : "",
                            },
                          },
                        )

                        const data = await response.json()
                        console.log("Respuesta de prueba:", data)

                        // Mostrar alerta con la respuesta
                        alert(JSON.stringify(data, null, 2))
                      } catch (error) {
                        console.error("Error en prueba:", error)
                        alert("Error: " + String(error))
                      }
                    }}
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Probar API
                  </button>
                  <button
                    onClick={() => {
                      setManualProduct({
                        title: "",
                        price: 0,
                        store_id: activeStoreId,
                      })
                      setShowManualForm(true)
                      setIsEditingProduct(false)
                      setEditingProductId(null)
                    }}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Añadir manualmente
                  </button>
                </div>
              </div>

              <ProductList
                products={products}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                isLoading={isLoadingProducts}
              />
            </div>

            <TotalSummary products={products} />
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
