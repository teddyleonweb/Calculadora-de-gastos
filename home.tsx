"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import * as Tesseract from "tesseract.js"
import { Edit2, Check, X, Trash2 } from "lucide-react"

// Actualizar la interfaz Product para incluir quantity
interface Product {
  id: string
  title: string
  price: number
  quantity: number
  isEditing: boolean
}

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState<number>(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null)
  const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number } | null>(null)
  const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugText, setDebugText] = useState<string | null>(null)
  const [debugSteps, setDebugSteps] = useState<string[]>([])

  // Estados para añadir producto manualmente
  const [manualTitle, setManualTitle] = useState<string>("")
  const [manualPrice, setManualPrice] = useState<string>("")
  const [manualQuantity, setManualQuantity] = useState<string>("1")

  // Añadir un nuevo estado para controlar la visibilidad de la cámara
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)

  const resetState = () => {
    setImageSrc(null)
    setRect(null)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])
  }

  // Generar un ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  useEffect(() => {
    const storedProducts = localStorage.getItem("products")
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products))
    setTotal(products.reduce((sum, product) => sum + product.price * product.quantity, 0))
  }, [products])

  // Modificar la función extractPricesFromText para reconocer más formatos de precios
  const extractPricesFromText = (text: string) => {
    const debug: string[] = []
    debug.push(`Texto original: "${text}"`)

    // Primero buscamos patrones de precio con símbolos de moneda
    const currencyRegex = /[$€£¥]?\s*\d+(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?\s*[$€£¥]/g
    const currencyMatches = text.match(currencyRegex) || []
    debug.push(`Patrones con símbolo de moneda: ${JSON.stringify(currencyMatches)}`)

    // Limpiamos el texto para buscar otros patrones
    const cleanedText = text
      .replace(/\s+/g, " ") // Normalizar espacios
      .replace(/[^\d\s,.]/g, "") // Mantener solo dígitos, espacios, comas y puntos
      .trim()

    debug.push(`Texto limpio: "${cleanedText}"`)

    // Buscar patrones completos como "2,99" o "2.99"
    const decimalPriceRegex = /\b\d+[,.]\d{1,2}\b/g
    const decimalMatches = cleanedText.match(decimalPriceRegex) || []
    debug.push(`Patrones decimales encontrados: ${JSON.stringify(decimalMatches)}`)

    // Buscar números enteros que podrían ser precios
    const integerPriceRegex = /\b\d{1,4}\b/g
    const integerMatches = cleanedText.match(integerPriceRegex) || []
    debug.push(`Números enteros encontrados: ${JSON.stringify(integerMatches)}`)

    // Buscar patrones que podrían ser precios fragmentados
    // Por ejemplo, si tenemos "2 99" podría ser "2,99"
    const fragments = cleanedText.split(/\s+/)
    debug.push(`Fragmentos: ${JSON.stringify(fragments)}`)

    const reconstructedPrices: string[] = []

    // Procesar los patrones decimales encontrados
    const normalizedDecimalPrices = decimalMatches.map((price) => {
      return price.replace(",", ".")
    })

    // Intentar reconstruir precios fragmentados
    // Si encontramos un patrón como "2" seguido de "99", podría ser "2.99"
    for (let i = 0; i < fragments.length - 1; i++) {
      const current = fragments[i].trim()
      const next = fragments[i + 1].trim()

      // Verificar si el fragmento actual es un número entero y el siguiente parece ser centavos
      if (/^\d+$/.test(current) && /^\d{2}$/.test(next)) {
        const reconstructed = `${current}.${next}`
        reconstructedPrices.push(reconstructed)
        debug.push(`Reconstruido: ${current} + ${next} = ${reconstructed}`)
      }
    }

    debug.push(`Precios reconstruidos: ${JSON.stringify(reconstructedPrices)}`)

    // Procesar los precios con símbolos de moneda
    const normalizedCurrencyPrices = currencyMatches.map((price) => {
      // Eliminar símbolos de moneda y espacios
      return price.replace(/[$€£¥\s]/g, "").replace(",", ".")
    })

    debug.push(`Precios con moneda normalizados: ${JSON.stringify(normalizedCurrencyPrices)}`)

    // Combinar todos los precios encontrados
    const allPotentialPrices = [...normalizedDecimalPrices, ...reconstructedPrices, ...normalizedCurrencyPrices]

    // Añadir números enteros solo si no hay precios decimales o reconstruidos
    if (
      normalizedDecimalPrices.length === 0 &&
      reconstructedPrices.length === 0 &&
      normalizedCurrencyPrices.length === 0
    ) {
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
        if (!/^[$€£¥]?\s*\d+([,.]\d{1,2})?\s*[$€£¥]?$/.test(line)) {
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
              current.length > longest.length && !/^[$€£¥]?\s*\d+([,.]\d{1,2})?\s*[$€£¥]?$/.test(current)
                ? current
                : longest,
            "Producto sin nombre",
          )
      }
    }

    return productTitle
  }

  // Modificar la función processFullImage para priorizar las primeras líneas como título
  const processFullImage = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    if (!imageSrc) {
      setIsLoading(false)
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve) => (img.onload = resolve))

      // Process with Tesseract using the correct API
      const scheduler = Tesseract.createScheduler()
      const worker = await Tesseract.createWorker()
      scheduler.addWorker(worker)

      // Recognize text from the full image
      const result = await scheduler.addJob("recognize", img)

      // Clean up
      await scheduler.terminate()

      const fullText = result.data.text
      console.log("Texto completo extraído:", fullText)
      setDebugText(fullText)

      // Extraer precios del texto
      const prices = extractPricesFromText(fullText)

      // Extraer título del texto
      const productTitle = extractTitleFromText(fullText)

      // Si encontramos precios, creamos un nuevo producto con la descripción extraída
      if (prices.length > 0) {
        const newProduct = {
          id: generateId(),
          title: productTitle,
          price: prices[0], // Tomamos el primer precio encontrado
          quantity: 1,
          isEditing: false,
        }

        setProducts((prevProducts) => [...prevProducts, newProduct])
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
    }
  }

  // Renombrar y modificar la función extractPriceFromArea para procesar toda la información del área seleccionada
  const processSelectedArea = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setDebugText(null)
    setDebugSteps([])

    if (!rect || !displayCanvasRef.current || !imageSrc) {
      setIsLoading(false)
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      await new Promise((resolve) => (img.onload = resolve))

      // Validate rect coordinates to ensure they're within image boundaries
      const validX = Math.max(0, Math.min(rect.x, img.width))
      const validY = Math.max(0, Math.min(rect.y, img.height))
      const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
      const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

      // Skip processing if the area is too small
      if (validWidth < 5 || validHeight < 5) {
        setErrorMessage("El área seleccionada es demasiado pequeña para procesar")
        setIsLoading(false)
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
        return
      }

      // Draw the cropped area onto the temporary canvas
      croppedCtx.drawImage(img, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight)

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
      const scheduler = Tesseract.createScheduler()
      const worker = await Tesseract.createWorker()
      scheduler.addWorker(worker)

      // Primero, reconocer todo el texto para extraer título y otra información
      const fullTextResult = await scheduler.addJob("recognize", croppedCanvas)
      const fullText = fullTextResult.data.text
      console.log("Texto completo del área seleccionada:", fullText)
      setDebugText(fullText)

      // Extraer título del texto
      const productTitle = extractTitleFromText(fullText)

      // Ahora, hacer un reconocimiento optimizado para números para extraer precios
      const priceResult = await scheduler.addJob("recognize", croppedCanvas, {
        tessedit_char_whitelist: "0123456789,.$€£¥", // Incluir símbolos de moneda y coma
      })

      // Clean up
      await scheduler.terminate()

      const priceText = priceResult.data.text
      console.log("Texto optimizado para precios:", priceText)

      // Extraer precios del texto
      const prices = extractPricesFromText(fullText)

      // Si no encontramos precios en el texto completo, intentar con el texto optimizado para precios
      if (prices.length === 0) {
        const pricesPriceText = extractPricesFromText(priceText)
        if (pricesPriceText.length > 0) {
          prices.push(...pricesPriceText)
        }
      }

      // Si encontramos precios, creamos un nuevo producto con la descripción extraída
      if (prices.length > 0) {
        const newProduct = {
          id: generateId(),
          title: productTitle,
          price: prices[0], // Tomamos el primer precio encontrado
          quantity: 1,
          isEditing: false,
        }

        setProducts((prevProducts) => [...prevProducts, newProduct])
        setManualTitle(productTitle) // También actualizamos el campo manual por si el usuario quiere añadir más productos similares
        setManualPrice(prices[0].toString()) // Actualizar el campo de precio manual
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
    }
  }

  // Función para obtener coordenadas del canvas a partir de un evento (mouse o touch)
  const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()

    // Determinar si es un evento táctil o de ratón
    if ("touches" in event) {
      // Es un evento táctil
      const touch = event.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    } else {
      // Es un evento de ratón
      return {
        x: (event as React.MouseEvent).clientX - rect.left,
        y: (event as React.MouseEvent).clientY - rect.top,
      }
    }
  }

  // Manejadores de eventos para mouse
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current
    if (!canvas || !imageSrc) return

    setIsDrawing(true)
    const coords = getCanvasCoordinates(event, canvas)
    setStartPosition(coords)
    setCurrentPosition(coords)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPosition || !displayCanvasRef.current || !imageSrc) return

    const canvas = displayCanvasRef.current
    const coords = getCanvasCoordinates(event, canvas)
    setCurrentPosition(coords)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawImageOnCanvas()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    if (startPosition) {
      ctx.strokeRect(startPosition.x, startPosition.y, coords.x - startPosition.x, coords.y - startPosition.y)
    }
  }

  const handleMouseUp = () => {
    finishDrawing()
  }

  // Manejadores de eventos para touch
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault() // Prevenir el comportamiento predeterminado (scroll)
    const canvas = displayCanvasRef.current
    if (!canvas || !imageSrc) return

    setIsDrawing(true)
    const coords = getCanvasCoordinates(event, canvas)
    setStartPosition(coords)
    setCurrentPosition(coords)
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault() // Prevenir el comportamiento predeterminado (scroll)
    if (!isDrawing || !startPosition || !displayCanvasRef.current || !imageSrc) return

    const canvas = displayCanvasRef.current
    const coords = getCanvasCoordinates(event, canvas)
    setCurrentPosition(coords)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    drawImageOnCanvas()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    if (startPosition) {
      ctx.strokeRect(startPosition.x, startPosition.y, coords.x - startPosition.x, coords.y - startPosition.y)
    }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault() // Prevenir el comportamiento predeterminado
    finishDrawing()
  }

  // Función común para finalizar el dibujo (compartida entre mouse y touch)
  const finishDrawing = () => {
    setIsDrawing(false)
    if (!startPosition || !currentPosition || !imageSrc) return

    const x = Math.min(startPosition.x, currentPosition.x)
    const y = Math.min(startPosition.y, currentPosition.y)
    const width = Math.abs(startPosition.x - currentPosition.x)
    const height = Math.abs(startPosition.y - currentPosition.y)

    // Skip if the selection is too small
    if (width < 5 || height < 5) {
      setErrorMessage("Selección demasiado pequeña, intente de nuevo")
      return
    }

    // Convert canvas coordinates to image coordinates
    const canvas = displayCanvasRef.current
    if (!canvas) return

    const img = new Image()
    img.src = imageSrc

    // We need to wait for the image to load to get its dimensions
    img.onload = () => {
      // Calculate the scaling and offset
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
      const offsetX = (canvas.width - img.width * scale) / 2
      const offsetY = (canvas.height - img.height * scale) / 2

      // Convert to image coordinates
      const imgX = (x - offsetX) / scale
      const imgY = (y - offsetY) / scale
      const imgWidth = width / scale
      const imgHeight = height / scale

      setRect({
        x: imgX,
        y: imgY,
        width: imgWidth,
        height: imgHeight,
      })

      // Clear any previous error messages when a new selection is made
      setErrorMessage(null)
    }
  }

  // Modificar la función startCamera para actualizar el estado de la cámara
  const startCamera = async () => {
    try {
      setErrorMessage(null)
      setIsCameraActive(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Preferir cámara trasera en móviles
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setErrorMessage("No se pudo acceder a la cámara")
      setIsCameraActive(false)
    }
  }

  // Añadir función para detener la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }

  // Modificar la función handleTakePhoto para procesar automáticamente la imagen después de tomarla
  const handleTakePhoto = async () => {
    if (videoRef.current && captureCanvasRef.current) {
      const video = videoRef.current
      const canvas = captureCanvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }
      setImageSrc(canvas.toDataURL("image/png"))
      stopCamera() // Detener la cámara después de tomar la foto

      // Esperar a que se actualice el estado de imageSrc
      setTimeout(() => {
        processFullImage() // Procesar automáticamente toda la imagen
      }, 100)
    }
  }

  // Preload image when imageSrc changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc
      img.onload = () => {
        drawImageOnCanvas()
      }
    }
  }, [imageSrc])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setImageSrc(e.target.result)
          setErrorMessage(null)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const drawImageOnCanvas = () => {
    if (imageSrc && displayCanvasRef.current) {
      const canvas = displayCanvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      img.onload = () => {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate scaling to fit the image in the canvas while maintaining aspect ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const newWidth = img.width * scale
        const newHeight = img.height * scale
        const offsetX = (canvas.width - newWidth) / 2
        const offsetY = (canvas.height - newHeight) / 2

        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight)

        // Redraw the selection rectangle if it exists
        if (isDrawing && startPosition && currentPosition) {
          ctx.strokeStyle = "red"
          ctx.lineWidth = 2
          ctx.strokeRect(
            startPosition.x,
            startPosition.y,
            currentPosition.x - startPosition.x,
            currentPosition.y - startPosition.y,
          )
        }
      }
    }
  }

  // Funciones para gestionar productos
  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id))
  }

  const startEditing = (id: string) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, isEditing: true } : product)))
  }

  const cancelEditing = (id: string) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, isEditing: false } : product)))
  }

  // Actualizar la función saveEditing para manejar la cantidad
  const saveEditing = (id: string, newTitle: string, newPrice: string, newQuantity: string) => {
    const normalizedPrice = newPrice.replace(",", ".")
    const price = Number.parseFloat(normalizedPrice)
    const quantity = Number.parseInt(newQuantity, 10)

    if (isNaN(price) || price <= 0) {
      setErrorMessage("Por favor ingrese un precio válido")
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Por favor ingrese una cantidad válida")
      return
    }

    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, title: newTitle, price, quantity, isEditing: false } : product,
      ),
    )
  }

  // Actualizar la función addManualProduct para incluir quantity
  const addManualProduct = () => {
    const normalizedPrice = manualPrice.replace(",", ".")
    const price = Number.parseFloat(normalizedPrice)
    const quantity = Number.parseInt(manualQuantity, 10)

    if (!manualTitle.trim()) {
      setErrorMessage("Por favor ingrese un título para el producto")
      return
    }

    if (isNaN(price) || price <= 0) {
      setErrorMessage("Por favor ingrese un precio válido")
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      setErrorMessage("Por favor ingrese una cantidad válida")
      return
    }

    const newProduct = {
      id: generateId(),
      title: manualTitle,
      price,
      quantity,
      isEditing: false,
    }

    setProducts([...products, newProduct])
    setManualTitle("")
    setManualPrice("")
    setManualQuantity("1")
    setErrorMessage(null)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Extractor de Precios</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={openFileSelector}
        >
          Seleccionar imagen
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={startCamera}>
          Iniciar cámara
        </button>
      </div>

      {isCameraActive && (
        <div className="mb-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-lg mx-auto border border-gray-300 rounded"
            />
            <div className="mt-2 flex justify-center gap-2">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleTakePhoto}
              >
                Tomar foto
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                onClick={stopCamera}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={captureCanvasRef} style={{ display: "none" }} />

      {imageSrc && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={processSelectedArea}
              disabled={!rect || isLoading}
            >
              {isLoading ? "Procesando..." : "Procesar área seleccionada"}
            </button>
            <button
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              onClick={processFullImage}
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : "Procesar toda la imagen"}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              onClick={resetState}
            >
              Reiniciar
            </button>
          </div>

          <div className="relative">
            <canvas
              ref={displayCanvasRef}
              width={500}
              height={500}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="border border-gray-300 rounded cursor-crosshair touch-none"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                Procesando...
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {window.matchMedia("(pointer: coarse)").matches
              ? "Toque y arrastre para seleccionar un área con el precio"
              : "Dibuje un rectángulo alrededor de la etiqueta del producto para extraer toda la información"}
          </p>

          {errorMessage && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>
          )}

          {debugText && (
            <div className="mt-2 p-2 bg-gray-100 border border-gray-300 text-gray-700 rounded">
              <p className="font-bold">Texto detectado:</p>
              <p className="font-mono whitespace-pre-wrap">{debugText}</p>
            </div>
          )}

          {debugSteps.length > 0 && (
            <div className="mt-2 p-2 bg-gray-100 border border-gray-300 text-gray-700 rounded">
              <p className="font-bold">Pasos de procesamiento:</p>
              <ol className="list-decimal pl-5">
                {debugSteps.map((step, index) => (
                  <li key={index} className="font-mono text-xs">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Productos</h2>

        {/* Agregar producto manualmente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 p-3 md:p-4 border border-gray-200 rounded">
          <h3 className="text-lg font-semibold col-span-full mb-2">Añadir producto manualmente</h3>
          <div className="flex flex-col">
            <label htmlFor="manual-title" className="text-sm text-gray-600 mb-1">
              Nombre del producto
            </label>
            <input
              id="manual-title"
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Nombre del producto"
              className="border border-gray-300 rounded px-2 py-1 text-sm md:text-base"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="manual-price" className="text-sm text-gray-600 mb-1">
              Precio
            </label>
            <input
              id="manual-price"
              type="text"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              placeholder="0.00"
              className="border border-gray-300 rounded px-2 py-1 text-sm md:text-base"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="manual-quantity" className="text-sm text-gray-600 mb-1">
              Cantidad
            </label>
            <div className="flex gap-2">
              <input
                id="manual-quantity"
                type="number"
                min="1"
                value={manualQuantity}
                onChange={(e) => setManualQuantity(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-16 text-sm md:text-base"
              />
              <button
                onClick={addManualProduct}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 md:px-4 rounded flex-grow text-sm md:text-base"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-sm md:text-base">Producto</th>
                  <th className="px-2 py-2 text-right text-sm md:text-base">Precio</th>
                  <th className="px-2 py-2 text-center text-sm md:text-base">Cant.</th>
                  <th className="px-2 py-2 text-right text-sm md:text-base">Subtotal</th>
                  <th className="px-2 py-2 text-center text-sm md:text-base">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-2 py-2 text-sm md:text-base">
                      {product.isEditing ? (
                        <input
                          type="text"
                          defaultValue={product.title}
                          id={`edit-title-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-full text-sm md:text-base"
                        />
                      ) : (
                        <div className="truncate max-w-[150px] md:max-w-none">{product.title}</div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-sm md:text-base whitespace-nowrap">
                      {product.isEditing ? (
                        <input
                          type="text"
                          defaultValue={product.price.toFixed(2)}
                          id={`edit-price-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-16 md:w-24 text-right text-sm md:text-base"
                        />
                      ) : (
                        `$${product.price.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-2 py-2 text-center text-sm md:text-base">
                      {product.isEditing ? (
                        <input
                          type="number"
                          defaultValue={product.quantity}
                          min="1"
                          id={`edit-quantity-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-12 md:w-16 text-center text-sm md:text-base"
                        />
                      ) : (
                        product.quantity
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-sm md:text-base whitespace-nowrap">
                      ${(product.price * product.quantity).toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-center gap-1 md:gap-2">
                        {product.isEditing ? (
                          <>
                            <button
                              onClick={() => {
                                const titleInput = document.getElementById(
                                  `edit-title-${product.id}`,
                                ) as HTMLInputElement
                                const priceInput = document.getElementById(
                                  `edit-price-${product.id}`,
                                ) as HTMLInputElement
                                const quantityInput = document.getElementById(
                                  `edit-quantity-${product.id}`,
                                ) as HTMLInputElement
                                saveEditing(product.id, titleInput.value, priceInput.value, quantityInput.value)
                              }}
                              className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => cancelEditing(product.id)}
                              className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(product.id)}
                              className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay productos añadidos aún</p>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Total</h2>
        <p className="text-2xl font-bold">${total.toFixed(2)}</p>
      </div>
    </div>
  )
}
