// Tipos compartidos para toda la aplicación

// Añadir la interfaz Project
export interface Project {
  id: string
  name: string
  description?: string
  isDefault: boolean
  createdAt?: string
}

// En la interfaz Product, añadir el campo createdAt y projectId
export interface Product {
  id: string
  title: string
  price: number
  quantity: number
  isEditing: boolean
  image?: string
  storeId: string // ID del supermercado al que pertenece el producto
  projectId: string // ID del proyecto al que pertenece el producto
  createdAt?: string // Fecha y hora de creación del producto
}

// Modificar la interfaz Store para incluir el campo de imagen y projectId
export interface Store {
  id: string
  name: string
  image?: string // Imagen opcional para la tienda
  projectId: string // ID del proyecto al que pertenece la tienda
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export interface ImageSize {
  width: number
  height: number
}

// Nuevos tipos para autenticación
export interface User {
  id: string
  email: string
  password: string // En una aplicación real, nunca almacenaríamos contraseñas en texto plano
  name: string
}

export interface UserData {
  projects: Project[]
  stores: Store[]
  products: Product[]
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (token: string, newPassword: string) => Promise<boolean>
  error: string | null
}

// Añadir la interfaz ShoppingList después de AuthContextType

export interface ShoppingList {
  id: string
  name: string
  date: string
  stores: Store[]
  products: Product[]
  total: number
  projectId: string // ID del proyecto al que pertenece la lista
}

// Nuevas interfaces para ingresos y egresos
export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  projectId: string // ID del proyecto al que pertenece el gasto
  createdAt?: string
}

export interface Income {
  id: string
  description: string
  amount: number
  category: string
  date: string
  isFixed: boolean
  frequency?: string
  notes?: string
  projectId: string // ID del proyecto al que pertenece el ingreso
  createdAt?: string
}
