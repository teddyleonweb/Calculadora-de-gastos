import type { User } from "../types"

// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Iniciar sesión
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      console.log("Iniciando sesión con:", email)
      console.log("URL de la API:", API_BASE_URL)

      // Hacer la solicitud directamente sin usar el proxy
      const response = await fetch(`${API_BASE_URL}?path=/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Respuesta status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)
        throw new Error(`Error al iniciar sesión: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos de login:", data)

      if (!data.token || !data.user) {
        throw new Error("Respuesta de login inválida")
      }

      // Guardar el token en localStorage
      localStorage.setItem("auth_token", data.token)
      console.log("Token guardado en localStorage:", data.token.substring(0, 15) + "...")

      return {
        token: data.token,
        user: data.user,
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

      // Usar el proxy-post para métodos POST
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}?path=/auth/register`,
          method: "POST",
          data: { name, email, password },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en respuesta:", errorData)
        throw new Error(`Error al registrar usuario: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos de registro:", data)

      return {
        success: data.success || true,
        message: data.message || "Usuario registrado correctamente",
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
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
      const response = await fetch(`/api/proxy-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `${API_BASE_URL}?path=/auth/verify`,
          method: "POST",
          data: { token },
        }),
      })

      if (!response.ok) {
        console.log("Token inválido según el servidor")
        return null
      }

      const data = await response.json()
      console.log("Datos de verificación:", data)

      if (data.user) {
        return data.user
      }

      return null
    } catch (error) {
      console.error("Error al verificar token:", error)
      return null
    }
  },
}
