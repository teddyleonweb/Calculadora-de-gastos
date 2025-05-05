import type { User } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Iniciar sesión
  login: async (email: string, password: string): Promise<User> => {
    try {
      console.log("Iniciando sesión con:", email)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al iniciar sesión: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Respuesta de login:", data)

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)

      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      }
    } catch (error) {
      console.error("Error en AuthService.login:", error)
      throw error
    }
  },

  // Registrarse
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log("Registrando usuario:", name, email)

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al registrarse: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Respuesta de registro:", data)

      return data.success
    } catch (error) {
      console.error("Error en AuthService.register:", error)
      throw error
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    localStorage.removeItem("auth_token")
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    const token = localStorage.getItem("auth_token")
    return !!token
  },

  // Obtener el usuario actual
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // Verificar si hay un token
      const token = localStorage.getItem("auth_token")
      if (!token) {
        return null
      }

      // Decodificar el token JWT (formato: header.payload.signature)
      const parts = token.split(".")
      if (parts.length !== 3) {
        console.error("Token JWT inválido")
        return null
      }

      // Decodificar la parte del payload (índice 1)
      try {
        const payload = JSON.parse(atob(parts[1]))

        // Verificar si el token ha expirado
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log("Token expirado")
          localStorage.removeItem("auth_token")
          return null
        }

        return {
          id: payload.id,
          name: payload.name,
          email: payload.email,
        }
      } catch (e) {
        console.error("Error al decodificar token JWT:", e)
        return null
      }
    } catch (error) {
      console.error("Error en AuthService.getCurrentUser:", error)
      return null
    }
  },

  // Obtener datos completos del usuario (tiendas y productos)
  getUserData: async (userId: string): Promise<{ stores: any[]; products: any[] }> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Obtener tiendas
      const storesResponse = await fetch(`${API_BASE_URL}/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!storesResponse.ok) {
        const errorText = await storesResponse.text()
        console.error("Error en respuesta de tiendas:", errorText)
        throw new Error(`Error al obtener tiendas: ${storesResponse.status} ${storesResponse.statusText}`)
      }

      const storesText = await storesResponse.text()
      console.log("Respuesta de tiendas (texto):", storesText)

      let stores = []
      try {
        stores = storesText ? JSON.parse(storesText) : []
      } catch (e) {
        console.error("Error al parsear respuesta de tiendas:", e)
        stores = []
      }

      // Obtener productos
      const productsResponse = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!productsResponse.ok) {
        const errorText = await productsResponse.text()
        console.error("Error en respuesta de productos:", errorText)
        throw new Error(`Error al obtener productos: ${productsResponse.status} ${productsResponse.statusText}`)
      }

      const productsText = await productsResponse.text()
      console.log("Respuesta de productos (texto):", productsText)

      let products = []
      try {
        products = productsText ? JSON.parse(productsText) : []
      } catch (e) {
        console.error("Error al parsear respuesta de productos:", e)
        products = []
      }

      return {
        stores,
        products: products.map((product: any) => ({
          ...product,
          isEditing: false,
        })),
      }
    } catch (error) {
      console.error("Error en AuthService.getUserData:", error)
      throw error
    }
  },
}
