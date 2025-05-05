// URL base de la API de WordPress
const API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://gestoreconomico.somediave.com/api.php"

export const AuthService = {
  // Iniciar sesión
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al iniciar sesión")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en login:", error)
      throw error
    }
  },

  // Registrar un nuevo usuario
  register: async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al registrarse")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en register:", error)
      throw error
    }
  },

  // Obtener el usuario actual
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        return null
      }

      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener usuario actual")
      }

      const user = await response.json()
      return user
    } catch (error) {
      console.error("Error en getCurrentUser:", error)
      return null
    }
  },

  // Obtener el token de autenticación
  getToken: async () => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      throw new Error("No hay token de autenticación")
    }
    return token
  },

  // Obtener datos del usuario (tiendas y productos)
  getUserData: async (userId: string) => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al obtener datos del usuario")
      }

      const userData = await response.json()
      return userData
    } catch (error) {
      console.error("Error en getUserData:", error)
      throw error
    }
  },
}
