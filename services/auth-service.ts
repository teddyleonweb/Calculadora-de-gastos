import type { User, UserData } from "../types"

// Función para generar un ID único
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Función para obtener usuarios del localStorage
const getUsers = (): User[] => {
  const usersJson = localStorage.getItem("users")
  return usersJson ? JSON.parse(usersJson) : []
}

// Función para guardar usuarios en localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem("users", JSON.stringify(users))
}

// Función para obtener datos de usuario específico
const getUserData = (userId: string): UserData => {
  const userDataJson = localStorage.getItem(`userData_${userId}`)
  if (userDataJson) {
    return JSON.parse(userDataJson)
  }

  // Si no hay datos, inicializar solo con la tienda "Total"
  return {
    stores: [{ id: "total", name: "Total" }],
    products: [],
  }
}

// Función para guardar datos de usuario específico
const saveUserData = (userId: string, data: UserData) => {
  localStorage.setItem(`userData_${userId}`, JSON.stringify(data))
}

// Servicio de autenticación
export const AuthService = {
  // Registrar un nuevo usuario
  register: async (name: string, email: string, password: string): Promise<boolean> => {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 500))

    const users = getUsers()

    // Verificar si el email ya está registrado
    if (users.some((user) => user.email === email)) {
      throw new Error("El correo electrónico ya está registrado")
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: generateId(),
      name,
      email,
      password, // En una aplicación real, hashearíamos la contraseña
    }

    // Guardar el usuario
    users.push(newUser)
    saveUsers(users)

    // Inicializar datos del usuario solo con la tienda "Total"
    saveUserData(newUser.id, {
      stores: [{ id: "total", name: "Total" }],
      products: [],
    })

    return true
  },

  // Iniciar sesión
  login: async (email: string, password: string): Promise<User> => {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 500))

    const users = getUsers()

    // Buscar usuario por email y contraseña
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      throw new Error("Credenciales incorrectas")
    }

    return user
  },

  // Obtener datos del usuario actual
  getUserData,

  // Guardar datos del usuario actual
  saveUserData,
}
