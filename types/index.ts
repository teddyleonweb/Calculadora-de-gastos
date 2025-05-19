// Tipos para la aplicación

// Tipo para los productos
export interface Product {
  id: string
  name: string
  price: number
  image?: string
  store: string
  date: string
  userId: string
  createdAt: string
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
}

// Categorías de egresos
export const EXPENSE_CATEGORIES = [
  "Alimentación",
  "Vivienda",
  "Transporte",
  "Servicios",
  "Salud",
  "Educación",
  "Entretenimiento",
  "Ropa",
  "Otros",
]

// Categorías de ingresos
export const INCOME_CATEGORIES = [
  "Salario",
  "Freelance",
  "Inversiones",
  "Alquileres",
  "Ventas",
  "Bonos",
  "Pensión",
  "Otros",
]

// Frecuencias de ingresos recurrentes
export const INCOME_FREQUENCIES = ["Diario", "Semanal", "Quincenal", "Mensual", "Anual"]

// Tipo para las tiendas
export interface Store {
  id: string
  name: string
  userId: string
}

// Tipo para los usuarios
export interface User {
  id: string
  email: string
  name?: string
}

// Tipo para las tasas de cambio
export interface ExchangeRate {
  id: string
  date: string
  rate: number
  source: string
}
