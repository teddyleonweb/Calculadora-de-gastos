import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "../contexts/auth-context"
import PerformanceInit from "./performance-init"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <PerformanceInit />
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
