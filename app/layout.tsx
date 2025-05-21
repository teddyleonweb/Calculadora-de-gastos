import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import AuthGuard from "@/components/auth-guard"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <AuthGuard>
            <div className="flex-grow flex flex-col">{children}</div>
            <Footer />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: "v0.dev",
}
