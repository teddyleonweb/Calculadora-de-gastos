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
        console.log("Verificando autenticación del usuario...")

        // Añadir un timeout para evitar que se quede cargando indefinidamente
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log("Timeout de autenticación alcanzado")
            resolve(false)
          }, 5000) // 5 segundos de timeout
        })

        // Intentar verificar la autenticación
        const authPromise = AuthService.isAuthenticated()

        // Usar la primera promesa que se resuelva
        const isAuth = await Promise.race([authPromise, timeoutPromise])

        if (isAuth) {
          console.log("Usuario autenticado, obteniendo datos del usuario...")
          try {
            const currentUser = await AuthService.getCurrentUser()
            if (currentUser) {
              console.log("Datos del usuario obtenidos correctamente:", currentUser.id)
              setUser(currentUser)
              setIsAuthenticated(true)
            } else {
              console.log("No se pudieron obtener los datos del usuario a pesar de estar autenticado")
              setIsAuthenticated(false)
            }
          } catch (userError) {
            console.error("Error al obtener datos del usuario:", userError)
            setIsAuthenticated(false)
          }
        } else {
          console.log("Usuario no autenticado")
          setIsAuthenticated(false)
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setIsAuthenticated(false)
      } finally {
        console.log("Inicialización de autenticación completada")
        setIsInitialized(true)
      }
    }

    checkAuth()
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      console.log("Iniciando sesión con email:", email)
      const result = await AuthService.login(email, password)

      if (result && result.user) {
        console.log("Sesión iniciada correctamente, usuario:", result.user.id)
        setUser(result.user)
        setIsAuthenticated(true)
        return true
      } else {
        console.error("No se recibieron datos de usuario después del login")
        setError("Error al iniciar sesión: no se recibieron datos de usuario")
        return false
      }
    } catch (err) {
      console.error("Error durante el inicio de sesión:", err)
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
    try {
      await AuthService.logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    } finally {
      // Siempre limpiar el estado local, incluso si hay un error
      setUser(null)
      setIsAuthenticated(false)
    }
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
