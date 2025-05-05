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
        console.log("Verificando autenticación al iniciar...")
        setIsInitialized(false)

        // Intentar recuperar el usuario directamente del localStorage primero
        const cachedUserData = window.localStorage.getItem("user_data")
        if (cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData)
            console.log("Usuario recuperado de localStorage:", userData)
            setUser(userData)

            // Verificar que el token sigue siendo válido
            const isAuth = await AuthService.isAuthenticated()
            if (isAuth) {
              console.log("Token válido, usuario autenticado desde localStorage")
              setIsAuthenticated(true)
              setIsInitialized(true)
              return
            } else {
              console.log("Token inválido o expirado, limpiando datos de usuario")
              window.localStorage.removeItem("user_data")
              setUser(null)
            }
          } catch (e) {
            console.error("Error al parsear datos de usuario en localStorage:", e)
          }
        }

        // Si no hay datos en caché o son inválidos, verificar autenticación
        const isAuth = await AuthService.isAuthenticated()

        if (isAuth) {
          console.log("Token válido, obteniendo datos del usuario...")
          const currentUser = await AuthService.getCurrentUser()
          if (currentUser) {
            console.log("Usuario autenticado:", currentUser)
            setUser(currentUser)
            setIsAuthenticated(true)
          } else {
            console.log("No se pudo obtener el usuario actual")
            setIsAuthenticated(false)
            setUser(null)
          }
        } else {
          console.log("Token inválido o expirado")
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
