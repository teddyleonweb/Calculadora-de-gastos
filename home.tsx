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

  // Función para mejorar el reconocimiento de precios
  const extractPricesFromText = (text: string) => {
    const debug: string[] = []
    debug.push(`Texto original: "${text}"`)

    // Limpiamos el texto para mejorar el reconocimiento
    const cleanedText = text
      .replace(/\s+/g, " ") // Normalizar espacios
      .replace(/[^\d\s,.]/g, "") // Mantener solo dígitos, espacios, comas y puntos
      .trim()

    debug.push(`Texto limpio: "${cleanedText}"`)

    // Intentamos diferentes estrategias para encontrar precios

    // 1. Buscar patrones completos como "2,99" o "2.99"
    const decimalPriceRegex = /\d+[,.]\d{2}/g
    const decimalMatches = cleanedText.match(decimalPriceRegex) || []
    debug.push(`Patrones decimales encontrados: ${JSON.stringify(decimalMatches)}`)

    // 2. Buscar patrones que podrían ser precios fragmentados
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

    // Combinar todos los precios encontrados
    const allPotentialPrices = [...normalizedDecimalPrices, ...reconstructedPrices]
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

    debug.push(`Precios válidos finales: ${JSON.stringify(validPrices)}`)

    setDebugSteps(debug)
    return validPrices
  }

  const extractPriceFromArea = async () => {
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

      // Recognize text from the cropped image with configuración optimizada para números
      const result = await scheduler.addJob("recognize", croppedCanvas, {
        tessedit_char_whitelist: "0123456789,.", // Limitar a dígitos, comas y puntos
      })

      // Clean up
      await scheduler.terminate()

      const text = result.data.text
      console.log("Texto extraído:", text)
      setDebugText(text)

      // Usar nuestra función mejorada para extraer precios
      const newPrices = extractPricesFromText(text)

      // Modificar la función extractPriceFromArea para incluir quantity en los nuevos productos
      if (newPrices.length > 0) {
        // Crear nuevos productos con los precios extraídos
        const newProducts = newPrices.map((price) => ({
          id: generateId(),
          title: `Producto ${products.length + 1}`,
          price,
          quantity: 1,
          isEditing: false,
        }))

        setProducts((prevProducts) => [...prevProducts, ...newProducts])
      } else {
        setErrorMessage("No se encontraron precios válidos en el texto extraído")
      }
    } catch (error) {
      console.error("Error al extraer precio:", error)
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

  // Modificar la función handleTakePhoto para detener la cámara después de tomar la foto
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
              onClick={extractPriceFromArea}
              disabled={!rect || isLoading}
            >
              {isLoading ? "Escaneando..." : "Escanear área para precio"}
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
              : "Dibuje un rectángulo alrededor de un precio para extraerlo"}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 p-4 border border-gray-200 rounded">
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
              className="border border-gray-300 rounded px-2 py-1"
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
              className="border border-gray-300 rounded px-2 py-1"
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
                className="border border-gray-300 rounded px-2 py-1 w-16"
              />
              <button
                onClick={addManualProduct}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded flex-grow"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-right">Precio</th>
                  <th className="px-4 py-2 text-center">Cantidad</th>
                  <th className="px-4 py-2 text-right">Subtotal</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      {product.isEditing ? (
                        <input
                          type="text"
                          defaultValue={product.title}
                          id={`edit-title-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      ) : (
                        product.title
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {product.isEditing ? (
                        <input
                          type="text"
                          defaultValue={product.price.toFixed(2)}
                          id={`edit-price-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-24 text-right"
                        />
                      ) : (
                        `$${product.price.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {product.isEditing ? (
                        <input
                          type="number"
                          defaultValue={product.quantity}
                          min="1"
                          id={`edit-quantity-${product.id}`}
                          className="border border-gray-300 rounded px-2 py-1 w-16 text-center"
                        />
                      ) : (
                        product.quantity
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">${(product.price * product.quantity).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center gap-2">
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
