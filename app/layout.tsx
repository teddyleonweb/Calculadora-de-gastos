import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "../contexts/auth-context"

// Optimizar la carga de la fuente
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Usar 'swap' para mostrar texto inmediatamente con una fuente de respaldo
  preload: true,
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Añadir preconexión para mejorar el rendimiento */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Añadir meta para mejorar el rendimiento en móviles */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
