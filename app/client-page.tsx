"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import AuthGuard from "../components/auth-guard"

// Importar el componente Home de forma dinámica para evitar errores de SSR
const DynamicHome = dynamic(() => import("../home"), { ssr: false })

export default function ClientPage() {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  // No aplicar AuthGuard en páginas de autenticación
  if (isAuthPage) {
    return null
  }

  return (
    <AuthGuard>
      <DynamicHome />
    </AuthGuard>
  )
}
