"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import * as Tesseract from "tesseract.js"
import { Edit2, Check, X, Trash2 } from "lucide-react"

// Actualizar la interfaz Product para incluir la imagen
interface Product {
  id: string
  title: string
  price: number
  quantity: number
  isEditing: boolean
  image?: string // Añadir campo opcional para la imagen
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
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 })

  // Estados para añadir producto manualmente
  const [manualTitle, setManualTitle] = useState<string>("")
  const [manualPrice, setManualPrice] = useState<string>("")
  const [manualQuantity, setManualQuantity] = useState<string>("1")

  // Añadir un nuevo estado para controlar la visibilidad de la cámara
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)

  // Añadir un estado para controlar la visibilidad de los pasos de procesamiento
  const [showDebugSteps, setShowDebugSteps] = useState<boolean>(false)

  // Efecto para ajustar el tamaño del canvas según el tamaño de la pantalla
  useEffect(() => {
    const updateCanvasSize = () => {
      const containerWidth = Math.min(window.innerWidth - 32, 800) // -32 para el padding
      const newWidth = containerWidth
      const newHeight = containerWidth * 0.75 // Mantener una proporción de aspecto de 4:3

      setCanvasSize({
        width: newWidth,
        height: newHeight,
      })

      // Actualizar el canvas si ya existe
      if (displayCanvasRef.current) {
        displayCanvasRef.current.width = newWidth
        displayCanvasRef.current.height = newHeight

        // Redibujar la imagen si hay una cargada
        if (imageSrc) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = imageSrc
          img.onload = () => drawImageOnCanvas()
        }
      }
    }

    // Actualizar tamaño inicial
    updateCanvasSize()

    // Actualizar tamaño cuando cambie el tamaño de la ventana
    window.addEventListener("resize", updateCanvasSize)
    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [imageSrc]) // Añadir imageSrc como dependencia

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
    // Por ejemplo, si tenemos "2 99" podría ser "2,99"
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
      return cleanPrice.replace(",", ".")
    })

    debug.push(`Precios reconstruidos: ${JSON.stringify(reconstructedPrices)}`)

    // Procesar los precios con símbolos de moneda
    const normalizedCurrencyPricesOld = currencyMatches.map((price) => {
      // Eliminar símbolos de moneda y espacios
      return price.replace(/[$€£¥\s]/g, "").replace(",", ".")
    })

    debug.push(`Precios con moneda normalizados: ${JSON.stringify(normalizedCurrencyPrices)}`)

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

  // Modificar la función processFullImage para guardar la imagen con el producto
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
          image: imageSrc, // Guardar la imagen completa
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

  // Modificar la función processSelectedArea para guardar la imagen recortada
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

      // Guardar la imagen recortada como data URL
      const croppedImageSrc = croppedCanvas.toDataURL("image/png")

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
        tessedit_char_whitelist: "0123456789,.$€£¥refREF:", // Incluir símbolos de moneda, coma y "ref:"
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
          image: croppedImageSrc, // Guardar la imagen recortada
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

    // Factor de escala entre el tamaño del canvas en el DOM y su tamaño interno
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Determinar si es un evento táctil o de ratón
    if ("touches" in event) {
      // Es un evento táctil
      const touch = event.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      // Es un evento de ratón
      return {
        x: ((event as React.MouseEvent).clientX - rect.left) * scaleX,
        y: ((event as React.MouseEvent).clientY - rect.top) * scaleY,
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

  // Actualizar la función drawImageOnCanvas para manejar correctamente el rectángulo de selección
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
    // Normalizar el precio: si ya tiene punto, dejarlo; si tiene coma, convertirla a punto
    let normalizedPrice = newPrice
    if (!normalizedPrice.includes(".") && normalizedPrice.includes(",")) {
      normalizedPrice = normalizedPrice.replace(",", ".")
    }

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
    // Normalizar el precio: si ya tiene punto, dejarlo; si tiene coma, convertirla a punto
    let normalizedPrice = manualPrice
    if (!normalizedPrice.includes(".") && normalizedPrice.includes(",")) {
      normalizedPrice = normalizedPrice.replace(",", ".")
    }

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
              width={canvasSize.width}
              height={canvasSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="border border-gray-300 rounded cursor-crosshair touch-none w-full"
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

              <div className="mt-2">
                <button
                  onClick={() => setShowDebugSteps(!showDebugSteps)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showDebugSteps ? "Ocultar pasos de procesamiento" : "Mostrar pasos de procesamiento"}
                </button>

                {showDebugSteps && debugSteps.length > 0 && (
                  <div className="mt-2">
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
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Productos</h2>

        {/* Agregar producto manualmente */}
        <div className="mb-4 p-3 md:p-4 border border-gray-200 rounded">
          <h3 className="text-lg font-semibold mb-3">Añadir producto manualmente</h3>
          <div className="flex flex-col space-y-3">
            <div className="w-full">
              <label htmlFor="manual-title" className="text-sm text-gray-600 mb-1 block">
                Nombre del producto
              </label>
              <input
                id="manual-title"
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Nombre del producto"
                className="border border-gray-300 rounded px-2 py-1 text-sm md:text-base w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="w-full sm:w-1/2">
                <label htmlFor="manual-price" className="text-sm text-gray-600 mb-1 block">
                  Precio
                </label>
                <input
                  id="manual-price"
                  type="text"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="0.00"
                  className="border border-gray-300 rounded px-2 py-1 text-sm md:text-base w-full"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label htmlFor="manual-quantity" className="text-sm text-gray-600 mb-1 block">
                  Cantidad
                </label>
                <div className="flex gap-2 w-full">
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
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg shadow-sm overflow-hidden bg-white">
                {product.isEditing ? (
                  <div className="flex flex-col sm:flex-row w-full">
                    {/* Imagen del producto en modo edición */}
                    {product.image && (
                      <div className="sm:w-1/4 md:w-1/5 p-2 flex items-center justify-center bg-gray-50">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt="Vista previa"
                          className="max-h-24 object-contain"
                        />
                      </div>
                    )}

                    {/* Formulario de edición */}
                    <div className={`p-3 space-y-3 flex-grow ${product.image ? "sm:w-3/4 md:w-4/5" : "w-full"}`}>
                      <div>
                        <label htmlFor={`edit-title-${product.id}`} className="text-xs text-gray-500 block">
                          Nombre del producto
                        </label>
                        <input
                          type="text"
                          defaultValue={product.title}
                          id={`edit-title-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-full text-sm md:text-base"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex-1 min-w-[120px]">
                          <label htmlFor={`edit-price-${product.id}`} className="text-xs text-gray-500 block">
                            Precio
                          </label>
                          <input
                            type="text"
                            defaultValue={product.price.toFixed(2)}
                            id={`edit-price-${product.id}`}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-right text-sm md:text-base"
                          />
                        </div>
                        <div className="w-24">
                          <label htmlFor={`edit-quantity-${product.id}`} className="text-xs text-gray-500 block">
                            Cant.
                          </label>
                          <input
                            type="number"
                            defaultValue={product.quantity}
                            min="1"
                            id={`edit-quantity-${product.id}`}
                            className="border border-gray-300 rounded px-2 py-1 w-full text-center text-sm md:text-base"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            const titleInput = document.getElementById(`edit-title-${product.id}`) as HTMLInputElement
                            const priceInput = document.getElementById(`edit-price-${product.id}`) as HTMLInputElement
                            const quantityInput = document.getElementById(
                              `edit-quantity-${product.id}`,
                            ) as HTMLInputElement
                            saveEditing(product.id, titleInput.value, priceInput.value, quantityInput.value)
                          }}
                          className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Guardar
                        </button>
                        <button
                          onClick={() => cancelEditing(product.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" /> Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row w-full">
                    {/* Imagen del producto */}
                    {product.image && (
                      <div className="sm:w-1/4 md:w-1/5 p-2 flex items-center justify-center bg-gray-50">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.title}
                          className="max-h-24 object-contain"
                        />
                      </div>
                    )}

                    {/* Información del producto */}
                    <div className={`p-3 flex-grow ${product.image ? "sm:w-3/4 md:w-4/5" : "w-full"}`}>
                      <h3 className="font-medium text-base md:text-lg line-clamp-2 mb-1" title={product.title}>
                        {product.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-gray-500">Precio:</span> ${product.price.toFixed(2)}
                        </div>
                        <div>
                          <span className="text-gray-500">Cantidad:</span> {product.quantity}
                        </div>
                        <div className="font-semibold">
                          <span className="text-gray-500">Subtotal:</span> $
                          {(product.price * product.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex sm:flex-col justify-end p-2 sm:border-l border-gray-100 bg-gray-50">
                      <button
                        onClick={() => startEditing(product.id)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex items-center gap-1 mb-1"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
