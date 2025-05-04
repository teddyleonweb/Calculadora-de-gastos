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
        // Primero verificar localStorage para una respuesta inmediata
        const token = localStorage.getItem("authToken")
        const userData = localStorage.getItem("userData")

        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            setIsAuthenticated(true)
            setIsInitialized(true)

            // Verificar en segundo plano sin bloquear la UI
            setTimeout(async () => {
              try {
                const isAuth = await AuthService.isAuthenticated()
                if (!isAuth) {
                  // Si el token no es válido, limpiar
                  setIsAuthenticated(false)
                  setUser(null)
                  localStorage.removeItem("authToken")
                  localStorage.removeItem("userData")
                }
              } catch (err) {
                console.error("Error en verificación en segundo plano:", err)
              }
            }, 1000)

            return
          } catch (e) {
            // Si hay error al parsear, continuar con la verificación normal
            console.error("Error al parsear datos de usuario:", e)
          }
        }

        // Verificación normal si no hay datos en localStorage
        const isAuth = await AuthService.isAuthenticated()

        if (isAuth) {
          const currentUser = await AuthService.getCurrentUser()
          if (currentUser) {
            setUser(currentUser)
            setIsAuthenticated(true)

            // Guardar en localStorage para futuras cargas rápidas
            localStorage.setItem("authToken", "true")
            localStorage.setItem("userData", JSON.stringify(currentUser))
          } else {
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setIsAuthenticated(false)
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
