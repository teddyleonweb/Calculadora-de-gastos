"use client"

import dynamic from "next/dynamic"

// Importar el componente Home de forma dinámica para evitar errores de SSR
const DynamicHome = dynamic(() => import("../home"), { ssr: false })

export default function ClientPage() {
  return <DynamicHome />
}
