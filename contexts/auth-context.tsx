"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { AuthService } from "../services/auth-service" // Assuming AuthService is in this location

interface AuthContextProps {
  isAuthenticated: boolean
  user: any // Replace 'any' with a more specific type if possible
  login: (credentials: any) => Promise<void> // Replace 'any' with a more specific type if possible
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
})

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true)
      try {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
          const userData = await AuthService.validateToken(storedToken) // Use AuthService to validate token
          if (userData) {
            setIsAuthenticated(true)
            setUser(userData)
          } else {
            setIsAuthenticated(false)
            setUser(null)
            localStorage.removeItem("token")
          }
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error("Authentication check failed:", error)
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem("token")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  const login = async (credentials: any) => {
    setIsLoading(true)
    try {
      const response = await AuthService.login(credentials) // Use AuthService to login
      localStorage.setItem("token", response.token)
      setIsAuthenticated(true)
      setUser(response.user)
    } catch (error) {
      console.error("Login failed:", error)
      setIsAuthenticated(false)
      setUser(null)
      throw error // Re-throw the error to be handled by the component
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setIsAuthenticated(false)
    setUser(null)
  }

  const value: AuthContextProps = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
