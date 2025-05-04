"use client"

import { useEffect } from "react"
import { detectPerformanceIssues } from "../lib/performance-monitor"

export default function PerformanceInit() {
  useEffect(() => {
    // Inicializar el monitor de rendimiento
    detectPerformanceIssues()

    // Registrar el tiempo de carga inicial
    const loadTime = performance.now()
    console.log(`[Rendimiento] Tiempo de carga inicial: ${loadTime.toFixed(2)}ms`)

    // Monitorear uso de memoria
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize } = performance.memory as any
      console.log(
        `[Memoria] Uso: ${(usedJSHeapSize / 1048576).toFixed(2)}MB / ${(totalJSHeapSize / 1048576).toFixed(2)}MB`,
      )
    }

    return () => {
      // Limpiar cualquier monitor si es necesario
    }
  }, [])

  // Este componente no renderiza nada visible
  return null
}
