"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Save, X, ShoppingCart, ImageIcon, Trash } from "lucide-react"
import type { Product, Store } from "@/types"
import ImageWithFallback from "./image-with-fallback"
import ImageUploader from "./image-uploader"

interface ProductListProps {
  products: Product[]
  stores: Store[]
  onUpdateProduct: (
    productId: string,
    data: { title: string; price: number; quantity: number; storeId: string; image?: string },
  ) => void
  onDeleteProduct: (productId: string) => void
  onAddToShoppingList: (productId: string) => void
}

export default function ProductList({
  products,
  stores,
  onUpdateProduct,
  onDeleteProduct,
  onAddToShoppingList,
}: ProductListProps) {
  const [editingProducts, setEditingProducts] = useState<Record<string, Product>>({})
  const [showImageUploader, setShowImageUploader] = useState<Record<string, boolean>>({})
  const [tempImage, setTempImage] = useState<Record<string, string | null>>({})

  // Inicializar el estado de edición para cada producto
  useEffect(() => {
    const initialEditingState: Record<string, Product> = {}
    const initialImageUploaderState: Record<string, boolean> = {}
    const initialTempImageState: Record<string, string | null> = {}

    products.forEach((product) => {
      initialEditingState[product.id] = { ...product }
      initialImageUploaderState[product.id] = false
      initialTempImageState[product.id] = product.image || null
    })

    setEditingProducts(initialEditingState)
    setShowImageUploader(initialImageUploaderState)
    setTempImage(initialTempImageState)
  }, [products])

  const startEditing = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setEditingProducts((prev) => ({
        ...prev,
        [productId]: { ...product, isEditing: true },
      }))
      setTempImage((prev) => ({
        ...prev,
        [productId]: product.image || null,
      }))
    }
  }

  const cancelEditing = (productId: string) => {
    setEditingProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], isEditing: false },
    }))
    setShowImageUploader((prev) => ({
      ...prev,
      [productId]: false,
    }))
    // Restaurar la imagen original
    const product = products.find((p) => p.id === productId)
    if (product) {
      setTempImage((prev) => ({
        ...prev,
        [productId]: product.image || null,
      }))
    }
  }

  const saveEditing = (productId: string) => {
    const editingProduct = editingProducts[productId]
    if (editingProduct) {
      onUpdateProduct(productId, {
        title: editingProduct.title,
        price: editingProduct.price,
        quantity: editingProduct.quantity,
        storeId: editingProduct.storeId,
        image: tempImage[productId] || undefined, // Incluir la imagen en la actualización
      })
      setEditingProducts((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], isEditing: false },
      }))
      setShowImageUploader((prev) => ({
        ...prev,
        [productId]: false,
      }))
    }
  }

  const handleInputChange = (productId: string, field: keyof Product, value: string | number) => {
    setEditingProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }))
  }

  const handleImageCapture = (productId: string, imageData: string) => {
    setTempImage((prev) => ({
      ...prev,
      [productId]: imageData,
    }))
    setShowImageUploader((prev) => ({
      ...prev,
      [productId]: false,
    }))
  }

  const removeImage = (productId: string) => {
    setTempImage((prev) => ({
      ...prev,
      [productId]: null,
    }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => {
        const isEditing = editingProducts[product.id]?.isEditing
        const editingProduct = editingProducts[product.id] || product
        const currentImage = isEditing ? tempImage[product.id] : product.image
        const showUploader = showImageUploader[product.id]

        return (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">
                {isEditing ? (
                  <Input
                    value={editingProduct.title}
                    onChange={(e) => handleInputChange(product.id, "title", e.target.value)}
                    className="w-full"
                  />
                ) : (
                  product.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Imagen del producto */}
              <div className="mb-4 relative">
                {isEditing ? (
                  showUploader ? (
                    <div className="mb-4">
                      <ImageUploader onCapture={(imageData) => handleImageCapture(product.id, imageData)} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowImageUploader((prev) => ({ ...prev, [product.id]: false }))}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      {currentImage ? (
                        <div className="relative">
                          <ImageWithFallback
                            src={currentImage || "/placeholder.svg"}
                            alt={editingProduct.title}
                            width={300}
                            height={200}
                            className="w-full h-40 object-cover rounded-md"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeImage(product.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-40 bg-gray-100 rounded-md">
                          <Button
                            variant="outline"
                            onClick={() => setShowImageUploader((prev) => ({ ...prev, [product.id]: true }))}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Añadir imagen
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  product.image && (
                    <ImageWithFallback
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      width={300}
                      height={200}
                      className="w-full h-40 object-cover rounded-md"
                    />
                  )
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Precio:</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => handleInputChange(product.id, "price", Number.parseFloat(e.target.value))}
                      className="w-24 text-right"
                    />
                  ) : (
                    <span>{product.price.toFixed(2)} €</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cantidad:</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editingProduct.quantity}
                      onChange={(e) => handleInputChange(product.id, "quantity", Number.parseInt(e.target.value))}
                      className="w-24 text-right"
                    />
                  ) : (
                    <span>{product.quantity}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tienda:</span>
                  {isEditing ? (
                    <Select
                      value={editingProduct.storeId}
                      onValueChange={(value) => handleInputChange(product.id, "storeId", value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar tienda" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{stores.find((s) => s.id === product.storeId)?.name || "Desconocida"}</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => cancelEditing(product.id)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => saveEditing(product.id)}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startEditing(product.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteProduct(product.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                  <Button size="sm" onClick={() => onAddToShoppingList(product.id)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Añadir
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
