import type { User, UserData } from "../types"
import { API_CONFIG } from "../config/api"

export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(API_CONFIG.getEndpointUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al registrar usuario")
      }

      return true
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      throw error
    }
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      // Añadir manejo de errores más detallado
      console.log("Intentando iniciar sesión en:", API_CONFIG.getEndpointUrl("/auth/login"))

      const response = await fetch(API_CONFIG.getEndpointUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      const data = await response.json()

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)

      return {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          password: "", // No almacenamos la contraseña
        },
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")
      return !!token
    } catch (error) {
      return false
    }
  },

  // Cerrar sesión
  logout: async (): Promise<void> => {
    try {
      localStorage.removeItem("auth_token")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  },

  // Obtener datos del usuario
  getUserData: async (userId: string): Promise<UserData> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      // Obtener tiendas
      const storesResponse = await fetch(API_CONFIG.getEndpointUrl("/stores"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!storesResponse.ok) {
        throw new Error("Error al obtener tiendas")
      }

      const stores = await storesResponse.json()

      // Obtener productos
      const productsResponse = await fetch(API_CONFIG.getEndpointUrl("/products"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!productsResponse.ok) {
        throw new Error("Error al obtener productos")
      }

      const products = await productsResponse.json()

      // Añadir isEditing a los productos
      const productsWithEditing = products.map((product: any) => ({
        ...product,
        isEditing: false,
      }))

      return {
        stores,
        products: productsWithEditing,
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      throw error
    }
  },

  // Obtener el usuario actual
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        return null
      }

      // Decodificar el token JWT (esto es una simplificación, en producción deberías verificar el token)
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )

      const payload = JSON.parse(jsonPayload)

      return {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        password: "", // No almacenamos la contraseña en el cliente
      }
    } catch (error) {
      console.error("Error al obtener usuario actual:", error)
      return null
    }
  },
}
