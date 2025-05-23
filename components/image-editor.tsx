"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { ZoomIn, ZoomOut, Maximize } from "lucide-react"
import type { Rectangle, Position, ImageSize } from "../types"

interface ImageEditorProps {
  imageSrc: string | null
  onProcessFullImage: () => void
  onProcessSelectedArea: () => void
  onProcessBothAreas: () => void
  isLoading: boolean
  errorMessage: string | null
  debugText: string | null
  debugSteps: string[]
  showDebugSteps: boolean
  onToggleDebugSteps: () => void
  rect: Rectangle | null
  setRect: (rect: Rectangle | null) => void
  titleRect: Rectangle | null
  setTitleRect: (rect: Rectangle | null) => void
  priceRect: Rectangle | null
  setPriceRect: (rect: Rectangle | null) => void
  scanMode: "basic" | "advanced"
  setScanMode: (mode: "basic" | "advanced") => void
  selectionMode: "title" | "price" | "basic" | null
  setSelectionMode: (mode: "title" | "price" | "basic" | null) => void
  selectionsReady: boolean
  setSelectionsReady: (ready: boolean) => void
  resetSelection: () => void
}

export default function ImageEditor({
  imageSrc,
  onProcessFullImage,
  onProcessSelectedArea,
  onProcessBothAreas,
  isLoading,
  errorMessage,
  debugText,
  debugSteps,
  showDebugSteps,
  onToggleDebugSteps,
  rect,
  setRect,
  titleRect,
  setTitleRect,
  priceRect,
  setPriceRect,
  scanMode,
  setScanMode,
  selectionMode,
  setSelectionMode,
  selectionsReady,
  setSelectionsReady,
  resetSelection,
}: ImageEditorProps) {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPosition, setStartPosition] = useState<Position | null>(null)
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [lastPanPosition, setLastPanPosition] = useState<Position | null>(null)
  const [originalImageSize, setOriginalImageSize] = useState<ImageSize | null>(null)
  const [showMagnifier, setShowMagnifier] = useState<boolean>(false)
  const [magnifierPosition, setMagnifierPosition] = useState<Position | null>(null)
  const [magnifierZoom, setMagnifierZoom] = useState<number>(2)
  const lastImageData = useRef<ImageData | null>(null)
  const isProcessingRef = useRef<boolean>(false)
  const [setIsLoading] = useState<boolean>(false)
  const [setErrorMessage] = useState<string | null>(null)
  const [setDebugText] = useState<string | null>(null)
  const [setDebugSteps] = useState<string[]>([])

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
          img.onload = () => {
            setOriginalImageSize({ width: img.width, height: img.height })
            drawImageOnCanvas()
          }
        }
      }
    }

    // Actualizar tamaño inicial
    updateCanvasSize()

    // Actualizar tamaño cuando cambie el tamaño de la ventana
    window.addEventListener("resize", updateCanvasSize)
    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [imageSrc])

  // Redibuja la imagen cuando cambia el nivel de zoom o el desplazamiento
  useEffect(() => {
    if (imageSrc) {
      drawImageOnCanvas()
    }
  }, [zoomLevel, panOffset])

  // Preload image when imageSrc changes
  useEffect(() => {
    if (imageSrc) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc
      img.onload = () => {
        setOriginalImageSize({ width: img.width, height: img.height })
        drawImageOnCanvas()
      }
    }
  }, [imageSrc])

  const drawImageOnCanvas = () => {
    if (!imageSrc || !displayCanvasRef.current) return

    const canvas = displayCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas antes de dibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageSrc
    img.onload = () => {
      try {
        if (!originalImageSize) {
          setOriginalImageSize({ width: img.width, height: img.height })
        }

        // Calculate scaling to fit the image in the canvas while maintaining aspect ratio
        const baseScale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const newWidth = img.width * baseScale * zoomLevel
        const newHeight = img.height * baseScale * zoomLevel

        // Calcular el offset para centrar la imagen
        let offsetX = (canvas.width - newWidth) / 2
        let offsetY = (canvas.height - newHeight) / 2

        // Aplicar el desplazamiento (pan)
        offsetX += panOffset.x
        offsetY += panOffset.y

        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight)

        // Guardar el estado del canvas después de dibujar SOLO la imagen, sin selecciones
        lastImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Dibujar las selecciones existentes
        drawSelections(ctx)

        // Redraw the selection rectangle if it exists
        if (isDrawing && startPosition && currentPosition && selectionMode) {
          ctx.lineWidth = 3 // Aumentar el grosor de la línea para mayor visibilidad
          if (selectionMode === "title") {
            ctx.strokeStyle = "#0000FF" // Azul puro para título
          } else if (selectionMode === "price") {
            ctx.strokeStyle = "#FF0000" // Rojo puro para precio
          } else if (selectionMode === "basic") {
            ctx.strokeStyle = "#800080" // Púrpura para modo básico
          }
          ctx.strokeRect(
            startPosition.x,
            startPosition.y,
            currentPosition.x - startPosition.x,
            currentPosition.y - startPosition.y,
          )
        }
      } catch (error) {
        console.error("Error al dibujar la imagen:", error)
      }
    }
  }

  const drawSelections = (ctx: CanvasRenderingContext2D) => {
    const canvas = displayCanvasRef.current
    if (!canvas || !imageSrc || !originalImageSize) return

    // Dibujar el rectángulo básico si existe
    if (rect && scanMode === "basic") {
      ctx.strokeStyle = "#800080" // Púrpura para modo básico
      ctx.lineWidth = 3
      const rectCanvas = imageToCanvasCoordinates(rect.x, rect.y)
      const endRectCanvas = imageToCanvasCoordinates(rect.x + rect.width, rect.y + rect.height)
      const widthCanvas = endRectCanvas.x - rectCanvas.x
      const heightCanvas = endRectCanvas.y - rectCanvas.y
      ctx.strokeRect(rectCanvas.x, rectCanvas.y, widthCanvas, heightCanvas)
    }

    // Dibujar el rectángulo del título si existe (SIEMPRE EN AZUL)
    if (titleRect && scanMode === "advanced") {
      ctx.strokeStyle = "#0000FF" // Azul puro para título
      ctx.lineWidth = 3
      const titleRectCanvas = imageToCanvasCoordinates(titleRect.x, titleRect.y)
      const endTitleRectCanvas = imageToCanvasCoordinates(titleRect.x + titleRect.width, titleRect.y + titleRect.height)
      const titleWidthCanvas = endTitleRectCanvas.x - titleRectCanvas.x
      const titleHeightCanvas = endTitleRectCanvas.y - titleRectCanvas.y
      ctx.strokeRect(titleRectCanvas.x, titleRectCanvas.y, titleWidthCanvas, titleHeightCanvas)
    }

    // Dibujar el rectángulo del precio si existe (SIEMPRE EN ROJO)
    if (priceRect && scanMode === "advanced") {
      ctx.strokeStyle = "#FF0000" // Rojo puro para precio
      ctx.lineWidth = 3
      const priceRectCanvas = imageToCanvasCoordinates(priceRect.x, priceRect.y)
      const endPriceRectCanvas = imageToCanvasCoordinates(priceRect.x + priceRect.width, priceRect.y + priceRect.height)
      const priceWidthCanvas = endPriceRectCanvas.x - priceRectCanvas.x
      const priceHeightCanvas = endPriceRectCanvas.y - priceRectCanvas.y
      ctx.strokeRect(priceRectCanvas.x, priceRectCanvas.y, priceWidthCanvas, priceHeightCanvas)
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

  // Función para convertir coordenadas del canvas a coordenadas de la imagen con zoom
  const canvasToImageCoordinates = (canvasX: number, canvasY: number) => {
    if (!displayCanvasRef.current || !imageSrc || !originalImageSize) return { x: 0, y: 0 }

    const canvas = displayCanvasRef.current

    // Calcular la escala base (sin zoom)
    const baseScale = Math.min(canvas.width / originalImageSize.width, canvas.height / originalImageSize.height)

    // Calcular el tamaño de la imagen con la escala base
    const baseWidth = originalImageSize.width * baseScale
    const baseHeight = originalImageSize.height * baseScale

    // Calcular los offsets base (centrado)
    const baseOffsetX = (canvas.width - baseWidth) / 2
    const baseOffsetY = (canvas.height - baseHeight) / 2

    // Ajustar las coordenadas del canvas considerando el zoom y el desplazamiento
    const adjustedCanvasX = (canvasX - panOffset.x) / zoomLevel
    const adjustedCanvasY = (canvasY - panOffset.y) / zoomLevel

    // Convertir a coordenadas de imagen
    const imgX = (adjustedCanvasX - baseOffsetX) / baseScale
    const imgY = (adjustedCanvasY - baseOffsetY) / baseScale

    // Asegurarse de que las coordenadas estén dentro de los límites de la imagen
    return {
      x: Math.max(0, Math.min(imgX, originalImageSize.width)),
      y: Math.max(0, Math.min(imgY, originalImageSize.height)),
    }
  }

  // Función para convertir coordenadas de la imagen a coordenadas del canvas con zoom
  const imageToCanvasCoordinates = (imgX: number, imgY: number) => {
    if (!displayCanvasRef.current || !imageSrc || !originalImageSize) return { x: 0, y: 0 }

    const canvas = displayCanvasRef.current

    // Calcular la escala base (sin zoom)
    const baseScale = Math.min(canvas.width / originalImageSize.width, canvas.height / originalImageSize.height)

    // Calcular el tamaño de la imagen con la escala base
    const baseWidth = originalImageSize.width * baseScale
    const baseHeight = originalImageSize.height * baseScale

    // Calcular los offsets base (centrado)
    const baseOffsetX = (canvas.width - baseWidth) / 2
    const baseOffsetY = (canvas.height - baseHeight) / 2

    // Convertir de coordenadas de imagen a coordenadas de canvas
    const canvasX = imgX * baseScale + baseOffsetX
    const canvasY = imgY * baseScale + baseOffsetY

    // Aplicar el zoom y el desplazamiento
    return {
      x: canvasX * zoomLevel + panOffset.x,
      y: canvasY * zoomLevel + panOffset.y,
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current
    if (!canvas || !imageSrc) return

    const coords = getCanvasCoordinates(event, canvas)

    // Si estamos en modo de selección, iniciamos el dibujo
    if (selectionMode) {
      // Asegurarse de que lastImageData tenga la imagen sin selecciones
      if (!lastImageData.current) {
        // Crear una imagen temporal para obtener la imagen sin selecciones
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext("2d")

        if (tempCtx) {
          // Dibujar solo la imagen sin selecciones
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.src = imageSrc

          // Calcular escala y offset
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
          const newWidth = img.width * scale
          const newHeight = img.height * scale
          const offsetX = (canvas.width - newWidth) / 2
          const offsetY = (canvas.height - newHeight) / 2

          tempCtx.drawImage(img, offsetX, offsetY, newWidth, newHeight)
          lastImageData.current = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
        }
      }

      setIsDrawing(true)
      setStartPosition(coords)
      setCurrentPosition(coords)
    }
    // Si no estamos en modo de selección, iniciamos el desplazamiento (pan)
    else if (zoomLevel > 1) {
      setIsPanning(true)
      setLastPanPosition(coords)
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!displayCanvasRef.current || !imageSrc) return

    const canvas = displayCanvasRef.current
    const coords = getCanvasCoordinates(event, canvas)

    // Si estamos en modo de desplazamiento (pan)
    if (isPanning && lastPanPosition && zoomLevel > 1) {
      const deltaX = coords.x - lastPanPosition.x
      const deltaY = coords.y - lastPanPosition.y

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))

      setLastPanPosition(coords)
      drawImageOnCanvas()
      return
    }

    // Si estamos en modo de dibujo (selección)
    if (!isDrawing || !startPosition || !selectionMode) return

    setCurrentPosition(coords)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Restaurar la imagen desde el último dibujo completo o la imagen original
    if (lastImageData.current) {
      ctx.putImageData(lastImageData.current, 0, 0)
    }

    // Dibujar las selecciones existentes PRIMERO
    drawSelections(ctx)

    // Luego dibujamos el nuevo rectángulo con el color correspondiente al modo
    ctx.lineWidth = 3 // Aumentar el grosor de la línea para mayor visibilidad
    if (selectionMode === "title") {
      ctx.strokeStyle = "#0000FF" // Azul puro para título
    } else if (selectionMode === "price") {
      ctx.strokeStyle = "#FF0000" // Rojo puro para precio
    } else if (selectionMode === "basic") {
      ctx.strokeStyle = "#800080" // Púrpura para modo básico
    }

    if (startPosition) {
      ctx.strokeRect(startPosition.x, startPosition.y, coords.x - startPosition.x, coords.y - startPosition.y)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      setLastPanPosition(null)
    } else if (isDrawing) {
      finishDrawing()
    }
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault() // Prevenir el comportamiento predeterminado (scroll)
    const canvas = displayCanvasRef.current
    if (!canvas || !imageSrc) return

    const coords = getCanvasCoordinates(event, canvas)

    // Si estamos en modo de selección, iniciamos el dibujo
    if (selectionMode) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Guardar el estado actual del canvas antes de empezar a dibujar
        lastImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      }

      setIsDrawing(true)
      setStartPosition(coords)
      setCurrentPosition(coords)
    }
    // Si no estamos en modo de selección, iniciamos el desplazamiento (pan)
    else if (zoomLevel > 1) {
      setIsPanning(true)
      setLastPanPosition(coords)
    }
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault() // Prevenir el comportamiento predeterminado (scroll)
    if (!displayCanvasRef.current || !imageSrc) return

    const canvas = displayCanvasRef.current
    const coords = getCanvasCoordinates(event, canvas)

    // Si estamos en modo de desplazamiento (pan)
    if (isPanning && lastPanPosition && zoomLevel > 1) {
      const deltaX = coords.x - lastPanPosition.x
      const deltaY = coords.y - lastPanPosition.y

      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))

      setLastPanPosition(coords)
      drawImageOnCanvas()
      return
    }

    // Si estamos en modo de dibujo (selección)
    if (!isDrawing || !startPosition || !selectionMode) return

    setCurrentPosition(coords)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // En lugar de redibujar toda la imagen, solo actualizamos el rectángulo de selección
    // Primero, restauramos la imagen desde el último dibujo completo
    if (lastImageData.current) {
      ctx.putImageData(lastImageData.current, 0, 0)
    }

    // Dibujar las selecciones existentes PRIMERO
    drawSelections(ctx)

    // Luego dibujamos el nuevo rectángulo con el color correspondiente al modo
    ctx.lineWidth = 3 // Aumentar el grosor de la línea para mayor visibilidad
    if (selectionMode === "title") {
      ctx.strokeStyle = "#0000FF" // Azul puro para título
    } else if (selectionMode === "price") {
      ctx.strokeStyle = "#FF0000" // Rojo puro para precio
    } else if (selectionMode === "basic") {
      ctx.strokeStyle = "#800080" // Púrpura para modo básico
    }

    if (startPosition) {
      ctx.strokeRect(startPosition.x, startPosition.y, coords.x - startPosition.x, coords.y - startPosition.y)
    }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault() // Prevenir el comportamiento predeterminado
    if (isPanning) {
      setIsPanning(false)
      setLastPanPosition(null)
    } else if (isDrawing) {
      finishDrawing()
    }
  }

  const finishDrawing = () => {
    setIsDrawing(false)
    if (!startPosition || !currentPosition || !imageSrc || !selectionMode) {
      console.error("Faltan datos para finalizar el dibujo:", {
        startPosition,
        currentPosition,
        hasImageSrc: !!imageSrc,
        selectionMode,
      })
      setErrorMessage("Error al finalizar la selección. Intente nuevamente.")
      return
    }

    // Convert canvas coordinates to image coordinates
    const canvas = displayCanvasRef.current
    if (!canvas) {
      console.error("No se encontró el canvas")
      setErrorMessage("Error al finalizar la selección. Intente nuevamente.")
      return
    }

    try {
      // Convertir las coordenadas del canvas a coordenadas de la imagen
      const startImgCoords = canvasToImageCoordinates(startPosition.x, startPosition.y)
      const endImgCoords = canvasToImageCoordinates(currentPosition.x, currentPosition.y)

      // Asegurarnos de que las coordenadas estén en el orden correcto (x1,y1 es la esquina superior izquierda)
      const imgX = Math.min(startImgCoords.x, endImgCoords.x)
      const imgY = Math.min(startImgCoords.y, endImgCoords.y)
      const imgWidth = Math.abs(endImgCoords.x - startImgCoords.x)
      const imgHeight = Math.abs(endImgCoords.y - startImgCoords.y)

      // Verificar que el área seleccionada sea válida
      if (imgWidth < 5 || imgHeight < 5) {
        console.error("Área seleccionada demasiado pequeña:", { imgWidth, imgHeight })
        setErrorMessage("El área seleccionada es demasiado pequeña. Por favor, seleccione un área más grande.")
        return
      }

      console.log("Área seleccionada:", { x: imgX, y: imgY, width: imgWidth, height: imgHeight })

      if (selectionMode === "basic") {
        // En modo básico, guardamos la selección en el estado rect
        setRect({
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
        })

        // Ejecutar automáticamente el procesamiento en modo básico
        setTimeout(() => {
          onProcessSelectedArea()
        }, 100)
      } else if (selectionMode === "title") {
        // En modo avanzado, guardamos la selección según el modo actual
        setTitleRect({
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
        })
        // Cambiar al modo de selección de precio
        setSelectionMode("price")
      } else if (selectionMode === "price") {
        setPriceRect({
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
        })
        // Ambas selecciones están listas
        setSelectionsReady(true)
        setSelectionMode(null)

        // Ejecutar automáticamente el procesamiento en modo avanzado
        setTimeout(() => {
          onProcessBothAreas()
        }, 100)
      }
    } catch (error) {
      console.error("Error al finalizar la selección:", error)
      setErrorMessage("Error al finalizar la selección. Intente nuevamente.")
    }
  }

  // Función para cambiar el nivel de zoom
  const changeZoomLevel = (increment: boolean) => {
    setZoomLevel((prevZoom) => {
      const newZoom = increment ? prevZoom + 0.5 : prevZoom - 0.5
      return Math.max(1, Math.min(newZoom, 5)) // Limitar entre 1 y 5
    })
  }

  // Función para activar/desactivar la lupa
  const toggleMagnifier = () => {
    setShowMagnifier(!showMagnifier)
    if (!showMagnifier && currentPosition) {
      setMagnifierPosition(currentPosition)
    } else {
      setMagnifierPosition(null)
    }
  }

  // Componente para la lupa
  const Magnifier = ({ src, width, height, show, position, zoom }: any) => {
    if (!show || !position) return null

    const magnifierSize = 150 // Tamaño fijo de la lupa
    const zoomLevel = zoom || 2 // Nivel de zoom por defecto

    const style = {
      position: "absolute" as const,
      left: position.x - magnifierSize / 2,
      top: position.y - magnifierSize / 2,
      width: magnifierSize,
      height: magnifierSize,
      borderRadius: "50%",
      border: "2px solid #333",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 10,
    }

    const imageStyle = {
      position: "absolute" as const,
      left: -position.x * zoomLevel + magnifierSize / 2,
      top: -position.y * zoomLevel + magnifierSize / 2,
      width: width * zoomLevel,
      height: height * zoomLevel,
      pointerEvents: "none",
    }

    return (
      <div style={style}>
        <img src={src || "/placeholder.svg"} alt="Magnified" style={imageStyle} />
      </div>
    )
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

    if (!rect) {
      setErrorMessage("No se ha seleccionado un área. Por favor, seleccione un área primero.")
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    if (!imageSrc) {
      setErrorMessage("No se pudo cargar la imagen. Por favor, intente cargar la imagen nuevamente.")
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      // Esperar a que la imagen se cargue completamente
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error("Error al cargar la imagen"))
      })

      console.log("Procesando área:", rect)
      console.log("Dimensiones de la imagen:", img.width, "x", img.height)

      // Resto del código...
      try {
        const detectedText = await processAreaForText(img, rect)
        setDebugText(detectedText)
        onProcessFullImage() // Llama a la función original para procesar la imagen completa
      } catch (error: any) {
        console.error("Error al procesar el área seleccionada:", error)
        setErrorMessage(error.message || "Error al procesar el área seleccionada.")
      } finally {
        setIsLoading(false)
        isProcessingRef.current = false
      }
    } catch (error: any) {
      console.error("Error al cargar la imagen:", error)
      setErrorMessage(error.message || "Error al cargar la imagen.")
      setIsLoading(false)
      isProcessingRef.current = false
    }
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

    if (!titleRect) {
      setErrorMessage("No se ha seleccionado el área del título. Por favor, seleccione el título primero.")
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    if (!priceRect) {
      setErrorMessage("No se ha seleccionado el área del precio. Por favor, seleccione el precio primero.")
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    if (!imageSrc) {
      setErrorMessage("No se pudo cargar la imagen. Por favor, intente cargar la imagen nuevamente.")
      setIsLoading(false)
      isProcessingRef.current = false
      return
    }

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = imageSrc

      // Esperar a que la imagen se cargue completamente
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error("Error al cargar la imagen"))
      })

      console.log("Procesando áreas - Título:", titleRect, "Precio:", priceRect)
      console.log("Dimensiones de la imagen:", img.width, "x", img.height)

      // Resto del código...
      try {
        // Procesar el área del título
        const titleText = await processAreaForText(img, titleRect)

        // Procesar el área del precio
        const priceText = await processAreaForText(img, priceRect)

        // Concatenar los resultados (puedes ajustarlo según tus necesidades)
        const combinedText = `Título: ${titleText}\nPrecio: ${priceText}`
        setDebugText(combinedText)

        onProcessFullImage() // Llama a la función original para procesar la imagen completa
      } catch (error: any) {
        console.error("Error al procesar las áreas seleccionadas:", error)
        setErrorMessage(error.message || "Error al procesar las áreas seleccionadas.")
      } finally {
        setIsLoading(false)
        isProcessingRef.current = false
      }
    } catch (error: any) {
      console.error("Error al cargar la imagen:", error)
      setErrorMessage(error.message || "Error al cargar la imagen.")
      setIsLoading(false)
      isProcessingRef.current = false
    }
  }

  const processAreaForText = async (img: HTMLImageElement, rect: Rectangle): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!img) {
          console.error("No se proporcionó una imagen válida")
          reject("No se proporcionó una imagen válida")
          return
        }

        if (!rect) {
          console.error("No se proporcionó un área válida")
          reject("No se proporcionó un área válida")
          return
        }

        console.log("Procesando área:", rect)
        console.log("Dimensiones de la imagen:", img.width, "x", img.height)

        // Validate rect coordinates to ensure they're within image boundaries
        const validX = Math.max(0, Math.min(rect.x, img.width))
        const validY = Math.max(0, Math.min(rect.y, img.height))
        const validWidth = Math.max(1, Math.min(rect.width, img.width - validX))
        const validHeight = Math.max(1, Math.min(rect.height, img.height - validY))

        // Skip processing if the area is too small
        if (validWidth < 5 || validHeight < 5) {
          console.error("Área seleccionada demasiado pequeña:", { validWidth, validHeight })
          reject("El área seleccionada es demasiado pequeña para procesar")
          return
        }

        // Resto del código...
        // Crear un canvas temporal para dibujar solo el área seleccionada
        const canvas = document.createElement("canvas")
        canvas.width = validWidth
        canvas.height = validHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          console.error("No se pudo obtener el contexto del canvas")
          reject("No se pudo obtener el contexto del canvas")
          return
        }

        // Dibujar la porción de la imagen en el canvas temporal
        ctx.drawImage(
          img,
          validX, // Coordenada X de inicio en la imagen original
          validY, // Coordenada Y de inicio en la imagen original
          validWidth, // Ancho del área a extraer
          validHeight, // Alto del área a extraer
          0, // Coordenada X de inicio en el canvas
          0, // Coordenada Y de inicio en el canvas
          validWidth, // Ancho en el canvas (igual al ancho del área)
          validHeight, // Alto en el canvas (igual al alto del área)
        )

        // Convertir el contenido del canvas a una URL de datos
        const imageDataURL = canvas.toDataURL("image/png")

        // Simular el uso de Tesseract.js (reemplazar con la lógica real)
        // Aquí deberías llamar a tu función de OCR con imageDataURL
        // y procesar el texto resultante.
        // Para este ejemplo, simplemente devolvemos un texto simulado.
        setTimeout(() => {
          const simulatedText = `Texto detectado en el área: (${validX}, ${validY}, ${validWidth}, ${validHeight})`
          resolve(simulatedText)
        }, 1000)
      } catch (error: any) {
        console.error("Error al procesar el área para texto:", error)
        reject(error.message || "Error al procesar el área para texto")
      }
    })
  }

  if (!imageSrc) return null

  return (
    <div className="mb-4">
      <div className="mb-3 bg-gray-100 p-3 rounded">
        <h3 className="font-semibold mb-2">Modo de escaneo:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`py-2 px-4 rounded ${
              scanMode === "basic" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => {
              setScanMode("basic")
              resetSelection()
            }}
          >
            Básico (una selección)
          </button>
          <button
            className={`py-2 px-4 rounded ${
              scanMode === "advanced" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => {
              setScanMode("advanced")
              resetSelection()
            }}
          >
            Avanzado (título y precio)
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {scanMode === "basic" ? (
          // Botones para modo básico
          <>
            <button
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                setSelectionMode("basic")
                setTitleRect(null)
                setPriceRect(null)
              }}
              disabled={isLoading || selectionMode === "basic"}
            >
              {selectionMode === "basic" ? "Seleccionando área..." : "Seleccionar área"}
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={onProcessSelectedArea}
              disabled={!rect || isLoading}
            >
              {isLoading ? "Procesando..." : "Procesar área seleccionada"}
            </button>
          </>
        ) : (
          // Botones para modo avanzado
          <>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setSelectionMode("title")}
              disabled={isLoading || selectionMode === "title"}
            >
              {selectionMode === "title" ? "Seleccionando título..." : "Seleccionar título"}
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setSelectionMode("price")}
              disabled={isLoading || selectionMode === "price" || !titleRect}
            >
              {selectionMode === "price" ? "Seleccionando precio..." : "Seleccionar precio"}
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={onProcessBothAreas}
              disabled={!selectionsReady || isLoading}
            >
              {isLoading ? "Procesando..." : "Procesar selecciones"}
            </button>
          </>
        )}
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onClick={resetSelection}
          disabled={isLoading}
        >
          Reiniciar selección
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

        <div className="absolute top-2 left-2 flex gap-2">
          <button
            onClick={() => changeZoomLevel(false)}
            className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
            disabled={zoomLevel <= 1}
            title="Reducir zoom"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={() => changeZoomLevel(true)}
            className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
            disabled={zoomLevel >= 5}
            title="Aumentar zoom"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1)
              setPanOffset({ x: 0, y: 0 })
            }}
            className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
            disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
            title="Restablecer zoom"
          >
            <Maximize size={20} />
          </button>
        </div>

        {showMagnifier && (
          <button
            onClick={toggleMagnifier}
            className={`absolute top-2 right-2 p-2 rounded-full ${
              showMagnifier ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title={showMagnifier ? "Desactivar lupa" : "Activar lupa"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        )}

        {showMagnifier && (
          <Magnifier
            src={imageSrc}
            width={canvasSize.width}
            height={canvasSize.height}
            show={showMagnifier}
            position={magnifierPosition}
            zoom={magnifierZoom}
          />
        )}
      </div>

      {showMagnifier && (
        <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow-md flex items-center gap-2">
          <span className="text-xs">Zoom:</span>
          <input
            type="range"
            min="1.5"
            max="5"
            step="0.5"
            value={magnifierZoom}
            onChange={(e) => setMagnifierZoom(Number.parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-xs">{magnifierZoom}x</span>
        </div>
      )}
      <p className="text-sm text-gray-600 mt-1">
        {scanMode === "basic"
          ? selectionMode === "basic"
            ? "Seleccione el área que contiene el título y el precio"
            : "Pulse 'Seleccionar área' para comenzar"
          : selectionMode === "title"
            ? "Seleccione el área del TÍTULO (azul)"
            : selectionMode === "price"
              ? "Seleccione el área del PRECIO (rojo)"
              : selectionsReady
                ? "Ambas áreas seleccionadas. Pulse 'Procesar selecciones'"
                : "Pulse 'Seleccionar título' para comenzar"}
      </p>

      {errorMessage && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>
      )}

      {debugText && (
        <div className="mt-2 p-2 bg-gray-100 border border-gray-300 text-gray-700 rounded">
          <p className="font-bold">Texto detectado:</p>
          <p className="font-mono whitespace-pre-wrap">{debugText}</p>

          <div className="mt-2">
            <button onClick={onToggleDebugSteps} className="text-sm text-blue-600 hover:text-blue-800">
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
  )
}
