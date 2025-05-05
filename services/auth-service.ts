import type { User } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Iniciar sesión
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      console.log("Iniciando sesión con:", email)
      console.log("URL de la API:", API_BASE_URL)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Respuesta status:", response.status)
      console.log("Respuesta headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al iniciar sesión: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Respuesta de login (texto):", responseText)

      try {
        const data = JSON.parse(responseText)
        console.log("Datos de login:", data)

        if (!data.token || !data.user) {
          throw new Error("Respuesta de login inválida")
        }

        return {
          token: data.token,
          user: data.user,
        }
      } catch (parseError) {
        console.error("Error al parsear JSON de login:", parseError)
        throw new Error("Error al procesar la respuesta del servidor")
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  },

  // Registrar usuario
  register: async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Registrando usuario:", name, email)

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al registrar usuario: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log("Respuesta de registro (texto):", responseText)

      try {
        const data = JSON.parse(responseText)
        console.log("Datos de registro:", data)

        return {
          success: data.success || true,
          message: data.message || "Usuario registrado correctamente",
        }
      } catch (parseError) {
        console.error("Error al parsear JSON de registro:", parseError)
        return {
          success: true,
          message: "Usuario registrado correctamente",
        }
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      throw error
    }
  },

  // Obtener datos del usuario
  getUserData: async (userId: string): Promise<{ stores: any[]; products: any[] }> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Obteniendo datos del usuario:", userId)

      // Intentar obtener tiendas
      let stores: any[] = []
      try {
        const storesResponse = await fetch(`${API_BASE_URL}/stores`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        if (storesResponse.ok) {
          const storesText = await storesResponse.text()
          console.log("Respuesta de tiendas (texto):", storesText)

          if (storesText.trim()) {
            try {
              const storesData = JSON.parse(storesText)
              stores = Array.isArray(storesData) ? storesData : []
            } catch (parseError) {
              console.error("Error al parsear JSON de tiendas:", parseError)
            }
          }
        } else {
          console.error("Error al obtener tiendas:", storesResponse.status, storesResponse.statusText)
        }
      } catch (storesError) {
        console.error("Error al obtener tiendas:", storesError)
      }

      // Intentar obtener productos
      let products: any[] = []
      try {
        const productsResponse = await fetch(`${API_BASE_URL}/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        if (productsResponse.ok) {
          const productsText = await productsResponse.text()
          console.log("Respuesta de productos (texto):", productsText)

          if (productsText.trim()) {
            try {
              const productsData = JSON.parse(productsText)
              products = Array.isArray(productsData) ? productsData : []
            } catch (parseError) {
              console.error("Error al parsear JSON de productos:", parseError)
            }
          }
        } else {
          console.error("Error al obtener productos:", productsResponse.status, productsResponse.statusText)
        }
      } catch (productsError) {
        console.error("Error al obtener productos:", productsError)
      }

      return {
        stores,
        products,
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      throw error
    }
  },

  // Verificar token
  verifyToken: async (token: string): Promise<User | null> => {
    try {
      console.log("Verificando token")

      // Intentar decodificar el token JWT localmente
      try {
        const base64Url = token.split(".")[1]
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join(""),
          )

          const payload = JSON.parse(jsonPayload)
          console.log("Token decodificado:", payload)

          // Verificar si el token ha expirado
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log("Token expirado")
            return null
          }

          // Devolver usuario del token
          if (payload.id && payload.email) {
            return {
              id: payload.id,
              name: payload.name || "Usuario",
              email: payload.email,
            }
          }
        }
      } catch (decodeError) {
        console.error("Error al decodificar token:", decodeError)
      }

      // Si no se pudo decodificar localmente, intentar verificar con el servidor
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        console.log("Token inválido según el servidor")
        return null
      }

      const responseText = await response.text()
      console.log("Respuesta de verificación (texto):", responseText)

      try {
        const data = JSON.parse(responseText)
        console.log("Datos de verificación:", data)

        if (data.user) {
          return data.user
        }
      } catch (parseError) {
        console.error("Error al parsear JSON de verificación:", parseError)
      }

      return null
    } catch (error) {
      console.error("Error al verificar token:", error)
      return null
    }
  },
}
