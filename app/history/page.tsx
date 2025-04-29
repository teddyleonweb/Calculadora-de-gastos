"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/auth-context"
import { ShoppingListService } from "../../services/shopping-list-service"
import Header from "../../components/header"
import Footer from "../../components/footer"
import { Calendar, Trash2, ShoppingCart } from "lucide-react"
import type { ShoppingList } from "../../types"
import AuthGuard from "../../components/auth-guard"

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadShoppingLists()
    }
  }, [user])

  const loadShoppingLists = () => {
    if (!user) return

    setIsLoading(true)
    try {
      const lists = ShoppingListService.getShoppingLists(user.id)
      setShoppingLists(lists)
    } catch (error) {
      console.error("Error al cargar las listas:", error)
      setErrorMessage("Error al cargar las listas de compras")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteList = (listId: string) => {
    if (!user) return

    if (window.confirm("¿Está seguro de eliminar esta lista?")) {
      try {
        const success = ShoppingListService.deleteShoppingList(user.id, listId)
        if (success) {
          setShoppingLists(shoppingLists.filter((list) => list.id !== listId))
          setSuccessMessage("Lista eliminada correctamente")

          // Ocultar el mensaje después de 3 segundos
          setTimeout(() => {
            setSuccessMessage(null)
          }, 3000)
        }
      } catch (error) {
        console.error("Error al eliminar la lista:", error)
        setErrorMessage("Error al eliminar la lista")
      }
    }
  }

  const handleLoadList = (listId: string) => {
    if (!user) return

    try {
      const success = ShoppingListService.loadShoppingList(user.id, listId)
      if (success) {
        router.push("/")
      } else {
        setErrorMessage("Error al cargar la lista")
      }
    } catch (error) {
      console.error("Error al cargar la lista:", error)
      setErrorMessage("Error al cargar la lista")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <AuthGuard>
      <Header />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Historial de Listas</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <ShoppingCart size={18} />
            <span>Volver a la lista actual</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{successMessage}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : shoppingLists.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay listas de compras guardadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shoppingLists.map((list) => (
              <div key={list.id} className="border rounded-lg shadow-sm overflow-hidden bg-white">
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{list.name}</h3>
                  <div className="flex items-center text-gray-500 mb-2">
                    <Calendar size={16} className="mr-2" />
                    <span className="text-sm">{formatDate(list.date)}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Total:</span>{" "}
                    <span className="font-semibold">${list.total.toFixed(2)}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Productos:</span> <span>{list.products.length}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Tiendas:</span>{" "}
                    <span>{list.stores.filter((store) => store.id !== "total").length}</span>
                  </div>
                </div>
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => handleLoadList(list.id)}
                    className="flex-1 py-2 text-center bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    Cargar
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="flex-1 py-2 text-center bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </AuthGuard>
  )
}
