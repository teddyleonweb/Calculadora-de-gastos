"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { AuthService } from "../services/auth-service"
import type { User, AuthContextType } from "../types"

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar si hay una sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación...")
        setIsInitialized(false)

        const token = localStorage.getItem("auth_token")
        if (!token) {
          console.log("No hay token, usuario no autenticado")
          setIsAuthenticated(false)
          setUser(null)
          setIsInitialized(true)
          return
        }

        // Verificar si el token es válido decodificándolo
        try {
          // Decodificar el token JWT (formato: header.payload.signature)
          const parts = token.split(".")
          if (parts.length !== 3) {
            console.error("Token JWT inválido")
            localStorage.removeItem("auth_token")
            setIsAuthenticated(false)
            setUser(null)
            setIsInitialized(true)
            return
          }

          // Decodificar la parte del payload (índice 1)
          const payload = JSON.parse(atob(parts[1]))

          // Verificar si el token ha expirado
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("Token expirado")
            localStorage.removeItem("auth_token")
            setIsAuthenticated(false)
            setUser(null)
            setIsInitialized(true)
            return
          }

          // Token válido, establecer usuario
          const currentUser = {
            id: payload.id,
            name: payload.name,
            email: payload.email,
          }

          setUser(currentUser)
          setIsAuthenticated(true)
        } catch (e) {
          console.error("Error al decodificar token JWT:", e)
          localStorage.removeItem("auth_token")
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsInitialized(true)
      }
    }

    checkAuth()
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const loggedUser = await AuthService.login(email, password)
      setUser(loggedUser)
      setIsAuthenticated(true)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      return false
    }
  }

  // Función para registrarse
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      const success = await AuthService.register(name, email, password)
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse")
      return false
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    await AuthService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  // Valor del contexto
  const value = {
    user,
    isAuthenticated,
    isInitialized,
    login,
    register,
    logout,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
