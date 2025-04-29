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

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("currentUser")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        // Si hay un error, limpiar el localStorage
        localStorage.removeItem("currentUser")
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
      localStorage.setItem("currentUser", JSON.stringify(loggedUser))
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
      await AuthService.register(name, email, password)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse")
      return false
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("currentUser")
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
