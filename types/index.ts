// Tipos para la aplicación

// Categorías de ingresos
export const INCOME_CATEGORIES = [
  "Salario",
  "Inversiones",
  "Freelance",
  "Alquileres",
  "Ventas",
  "Bonificaciones",
  "Reembolsos",
  "Otros",
]

// Frecuencias de ingresos recurrentes
export const INCOME_FREQUENCIES = [
  "Diario",
  "Semanal",
  "Quincenal",
  "Mensual",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual",
]

// Categorías de egresos (gastos)
export const EXPENSE_CATEGORIES = [
  "Alimentación",
  "Vivienda",
  "Transporte",
  "Servicios",
  "Salud",
  "Educación",
  "Entretenimiento",
  "Ropa",
  "Deudas",
  "Ahorros",
  "Otros",
]

// Interfaz para ingresos
export interface Income {
  id: string
  userId: string
  description: string
  amount: number
  category: string
  date: string
  isFixed: boolean
  frequency?: string
  notes?: string
  createdAt: string
}

// Interfaz para egresos (gastos)
export interface Expense {
  id: string
  userId: string
  description: string
  amount: number
  category: string
  date: string
  createdAt: string
}

// Interfaz para el usuario
export interface User {
  id: string
  name: string
  email: string
}

// Interfaz para tiendas
export interface Store {
  id: number
  name: string
  isDefault: boolean
  image?: string
}

// Interfaz para productos
export interface Product {
  id: number
  title: string
  price: number
  quantity: number
  image?: string
  storeId: number
  createdAt: string
}

// Interfaz para listas de compras
export interface ShoppingList {
  id: number
  name: string
  total: number
  createdAt: string
  stores: { id: number; name: string }[]
  products: {
    id: number
    title: string
    price: number
    quantity: number
    image?: string
    storeId?: number
  }[]
}
