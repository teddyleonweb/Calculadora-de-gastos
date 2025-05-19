// Servicio de autenticación para WordPress

interface LoginResponse {
  success: boolean
  message: string
  user?: {
    id: string
    name: string
    email: string
  }
  token?: string
}

interface RegisterResponse {
  success: boolean
  message: string
  user?: {
    id: string
    name: string
    email: string
  }
  token?: string
}

interface ValidateTokenResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
  }
}

export const AuthService = {
  // Iniciar sesión
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      )

      const data = await response.json()

      if (response.ok) {
        // Guardar el token en localStorage
        if (data.token) {
          localStorage.setItem("auth_token", data.token)
        }

        return {
          success: true,
          message: "Inicio de sesión exitoso",
          user: data.user,
          token: data.token,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al iniciar sesión",
        }
      }
    } catch (error) {
      console.error("Error en el servicio de autenticación (login):", error)
      return {
        success: false,
        message: "Error de conexión. Inténtalo de nuevo más tarde.",
      }
    }
  },

  // Registrarse
  async register(name: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        },
      )

      const data = await response.json()

      if (response.ok) {
        // Guardar el token en localStorage
        if (data.token) {
          localStorage.setItem("auth_token", data.token)
        }

        return {
          success: true,
          message: "Registro exitoso",
          user: data.user,
          token: data.token,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al registrarse",
        }
      }
    } catch (error) {
      console.error("Error en el servicio de autenticación (register):", error)
      return {
        success: false,
        message: "Error de conexión. Inténtalo de nuevo más tarde.",
      }
    }
  },

  // Validar token
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/price-extractor/v1/auth/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          user: data.user,
        }
      } else {
        return {
          success: false,
        }
      }
    } catch (error) {
      console.error("Error en el servicio de autenticación (validateToken):", error)
      return {
        success: false,
      }
    }
  },
}
