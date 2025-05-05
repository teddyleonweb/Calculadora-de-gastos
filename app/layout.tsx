import type React from "react"
import { AuthProvider } from "../contexts/auth-context"
import "./globals.css"

export const metadata = {
  title: "Calculadora de costos",
  description: "Aplicación para calcular costos de productos",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
