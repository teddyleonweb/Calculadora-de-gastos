// Tipos para la aplicación

// Tipo para los usuarios
export interface User {
  id: string
  email: string
  password: string // En una aplicación real, nunca almacenaríamos contraseñas en texto plano
  name: string
}

// Tipo para los productos
export interface Product {
  id: string
  title: string
  price: number
  quantity: number
  isEditing: boolean
  image?: string
  storeId: string // ID del supermercado al que pertenece el producto
  createdAt?: string // Fecha y hora de creación del producto
}

// Tipo para los egresos
export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  userId: string
  createdAt: string
}

// Tipo para los ingresos
export interface Income {
  id: string
  description: string
  amount: number
  category: string
  date: string
  userId: string
  createdAt: string
  isFixed: boolean
  frequency?: string
  notes?: string
}

// Categorías de egresos predefinidas
export const EXPENSE_CATEGORIES = [
  "Alquiler",
  "Servicios",
  "Transporte",
  "Alimentación",
  "Salud",
  "Educación",
  "Entretenimiento",
  "Ropa",
  "Otros",
]

// Categorías de ingresos
export const INCOME_CATEGORIES = ["Salario", "Freelance", "Inversiones", "Negocio", "Regalos", "Otros"]

// Frecuencias de ingresos recurrentes
export const INCOME_FREQUENCIES = ["Diario", "Semanal", "Quincenal", "Mensual", "Anual"]

// Tipo para las tiendas
export interface Store {
  id: string
  name: string
  image?: string // Imagen opcional para la tienda
}

// Tipo para las tasas de cambio
export interface ExchangeRate {
  id: string
  date: string
  rate: number
  source: string
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

export interface UserData {
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
}
