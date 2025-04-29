// Tipos compartidos para toda la aplicación

export interface Product {
  id: string
  title: string
  price: number
  quantity: number
  isEditing: boolean
  image?: string
  storeId: string // ID del supermercado al que pertenece el producto
}

export interface Store {
  id: string
  name: string
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
