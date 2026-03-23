"use client"
import { useState } from "react"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import type { Product, Store } from "../types"
import { ChevronDown, ChevronRight } from "lucide-react"

// Registrar los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

// Modificar la interfaz ExpenseSummaryProps para incluir las tasas de cambio
interface ExpenseSummaryProps {
  products: Product[]
  stores: Store[]
  storeSubtotals: { [key: string]: number }
  exchangeRates: { bcv: string; parallel: string } // Añadir las tasas de cambio
}

export default function ExpenseSummary({ products, stores, storeSubtotals, exchangeRates }: ExpenseSummaryProps) {
  // Estado para controlar qué tiendas están expandidas
  const [expandedStores, setExpandedStores] = useState<{ [key: string]: boolean }>({})
  // Estado para controlar qué moneda mostrar en las gráficas
  const [currencyView, setCurrencyView] = useState<"usd" | "bcv" | "parallel">("usd")

  // Función para convertir dólares a bolívares
  const convertToBolivares = (dollarAmount: number, rate: string): number => {
    const rateValue = Number.parseFloat(rate.replace(",", "."))
    if (isNaN(rateValue) || rateValue === 0) return 0
    return dollarAmount * rateValue
  }

  // Función para alternar la expansión de una tienda
  const toggleStoreExpansion = (storeId: string) => {
    setExpandedStores((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }))
  }

  // Filtrar la tienda "Total" para las gráficas
  const filteredStores = stores.filter((store) => {
    // Excluir la tienda "Total"
    if (store.name === "Total") return false

    // Verificar si la tienda tiene productos
    const hasProducts = products.some((p) => p.storeId === store.id)

    // Verificar si la tienda tiene un subtotal mayor que 0
    const hasExpense = (storeSubtotals[store.id] || 0) > 0

    // Solo incluir tiendas que tengan productos y gastos
    return hasProducts && hasExpense
  })

  // Obtener los datos según la moneda seleccionada
  const getAmountByCurrency = (storeId: string): number => {
    const usdAmount = storeSubtotals[storeId] || 0

    if (currencyView === "bcv") {
      return convertToBolivares(usdAmount, exchangeRates.bcv)
    } else if (currencyView === "parallel") {
      return convertToBolivares(usdAmount, exchangeRates.parallel)
    }

    return usdAmount // USD por defecto
  }

  // Obtener el símbolo de la moneda actual
  const getCurrencySymbol = (): string => {
    return currencyView === "usd" ? "$" : "Bs."
  }

  // Preparar datos para la gráfica de barras
  const barChartData = {
    labels: filteredStores.map((store) => store.name),
    datasets: [
      {
        label: `Gastos por Tienda (${currencyView.toUpperCase()})`,
        data: filteredStores.map((store) => getAmountByCurrency(store.id)),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Opciones para la gráfica de barras
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Gastos Totales por Tienda (${currencyView.toUpperCase()})`,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${getCurrencySymbol()}${value.toFixed(2)}`,
        },
      },
    },
  }

  // Preparar datos para la gráfica de pastel
  const pieChartData = {
    labels: filteredStores.map((store) => store.name),
    datasets: [
      {
        label: `Gastos por Tienda (${currencyView.toUpperCase()})`,
        data: filteredStores.map((store) => getAmountByCurrency(store.id)),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Opciones para la gráfica de pastel
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Distribución de Gastos por Tienda (${currencyView.toUpperCase()})`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${getCurrencySymbol()}${value.toFixed(2)} (${percentage}%)`
          },
        },
      },
    },
  }

  // Calcular la tienda con mayor gasto
  const getStoreWithHighestExpense = () => {
    let maxExpense = 0
    let storeWithMax = ""

    filteredStores.forEach((store) => {
      const expense = getAmountByCurrency(store.id)
      if (expense > maxExpense) {
        maxExpense = expense
        storeWithMax = store.name
      }
    })

    return { store: storeWithMax, amount: maxExpense }
  }

  // Calcular los productos con mayor gasto (agregando por nombre de producto)
  const getTopProducts = () => {
    const productTotals: { [key: string]: { name: string; total: number; quantity: number } } = {}

    products.forEach((product) => {
      const productTotal = product.price * product.quantity
      const key = product.title.toLowerCase().trim()

      if (productTotals[key]) {
        productTotals[key].total += productTotal
        productTotals[key].quantity += product.quantity
      } else {
        productTotals[key] = {
          name: product.title,
          total: productTotal,
          quantity: product.quantity,
        }
      }
    })

    // Convertir a array y ordenar por total descendente
    return Object.values(productTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10 productos
  }

  const topProducts = getTopProducts()

  // Obtener monto de producto según moneda
  const getProductAmountByCurrency = (usdAmount: number): number => {
    if (currencyView === "bcv") {
      return convertToBolivares(usdAmount, exchangeRates.bcv)
    } else if (currencyView === "parallel") {
      return convertToBolivares(usdAmount, exchangeRates.parallel)
    }
    return usdAmount
  }

  // Datos para gráfica de productos más costosos
  const topProductsChartData = {
    labels: topProducts.map((p) => p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name),
    datasets: [
      {
        label: `Gasto por Producto (${currencyView.toUpperCase()})`,
        data: topProducts.map((p) => getProductAmountByCurrency(p.total)),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  }

  // Opciones para gráfica horizontal de productos
  const topProductsChartOptions = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Top 10 Productos con Mayor Gasto (${currencyView.toUpperCase()})`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0
            const product = topProducts[context.dataIndex]
            return `${getCurrencySymbol()}${value.toFixed(2)} (${product.quantity} unidades)`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${getCurrencySymbol()}${value.toFixed(0)}`,
        },
      },
    },
  }

  // Datos para gráfica de pastel de productos
  const productsPieChartData = {
    labels: topProducts.slice(0, 6).map((p) => p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name),
    datasets: [
      {
        label: `Distribución por Producto (${currencyView.toUpperCase()})`,
        data: topProducts.slice(0, 6).map((p) => getProductAmountByCurrency(p.total)),
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(16, 185, 129, 0.6)",
          "rgba(245, 158, 11, 0.6)",
          "rgba(239, 68, 68, 0.6)",
          "rgba(139, 92, 246, 0.6)",
          "rgba(236, 72, 153, 0.6)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(236, 72, 153, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Opciones para gráfica de pastel de productos
  const productsPieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
      },
      title: {
        display: true,
        text: `Distribución Top 6 Productos (${currencyView.toUpperCase()})`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${getCurrencySymbol()}${value.toFixed(2)} (${percentage}%)`
          },
        },
      },
    },
  }

  const highestExpense = getStoreWithHighestExpense()
  const hasDataToShow = filteredStores.length > 0
  const hasProductsToShow = topProducts.length > 0

  // Calcular el total general según la moneda seleccionada
  const calculateGrandTotal = (): number => {
    const usdTotal = Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0)

    if (currencyView === "bcv") {
      return convertToBolivares(usdTotal, exchangeRates.bcv)
    } else if (currencyView === "parallel") {
      return convertToBolivares(usdTotal, exchangeRates.parallel)
    }

    return usdTotal
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Resumen y Gráficas de Gastos</h2>

      {/* Selector de moneda */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setCurrencyView("usd")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              currencyView === "usd"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            USD ($)
          </button>
          <button
            type="button"
            onClick={() => setCurrencyView("bcv")}
            className={`px-4 py-2 text-sm font-medium ${
              currencyView === "bcv"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border-t border-b border-gray-300"
            }`}
          >
            BCV (Bs.)
          </button>
          <button
            type="button"
            onClick={() => setCurrencyView("parallel")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              currencyView === "parallel"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Paralelo (Bs.)
          </button>
        </div>
      </div>

      {/* Información destacada */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Información Destacada</h3>
        {hasDataToShow ? (
          <>
            <p className="text-gray-700">
              <span className="font-medium">Tienda con mayor gasto:</span>{" "}
              <span className="text-blue-600 font-bold">{highestExpense.store}</span> con{" "}
              <span className="text-blue-600 font-bold">
                {getCurrencySymbol()}
                {highestExpense.amount.toFixed(2)}
              </span>
            </p>
            <p className="text-gray-700 mt-1">
              <span className="font-medium">Total de tiendas con productos:</span>{" "}
              <span className="text-blue-600 font-bold">{filteredStores.length}</span>
            </p>
            <p className="text-gray-700 mt-1">
              <span className="font-medium">Total general:</span>{" "}
              <span className="text-blue-600 font-bold">
                {getCurrencySymbol()}
                {calculateGrandTotal().toFixed(2)}
              </span>
              {currencyView !== "usd" && (
                <span className="text-sm ml-2">
                  ($
                  {Object.values(storeSubtotals)
                    .reduce((sum, subtotal) => sum + subtotal, 0)
                    .toFixed(2)}
                  )
                </span>
              )}
            </p>
          </>
        ) : (
          <p className="text-gray-700">
            No hay tiendas con productos para mostrar estadísticas. Agrega productos a tus tiendas para ver información
            destacada.
          </p>
        )}
      </div>

      {/* Gráficas por Tienda */}
      {hasDataToShow ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg text-center my-6">
          <p className="text-lg text-yellow-700">No hay tiendas con productos para mostrar en las gráficas.</p>
          <p className="text-sm text-yellow-600 mt-2">
            Agrega productos a tus tiendas para visualizar las estadísticas.
          </p>
        </div>
      )}

      {/* Sección de Productos con Mayor Gasto */}
      {hasProductsToShow && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-center border-t pt-6">Productos con Mayor Gasto</h3>
          
          {/* Información destacada de productos */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">Top 3 Productos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topProducts.slice(0, 3).map((product, index) => (
                <div key={index} className={`p-3 rounded-lg ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' : index === 1 ? 'bg-gray-100 border-2 border-gray-400' : 'bg-orange-100 border-2 border-orange-400'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}`}>
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm truncate" title={product.name}>{product.name}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {getCurrencySymbol()}{getProductAmountByCurrency(product.total).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.quantity} unidades | ${product.total.toFixed(2)} USD
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficas de productos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <Bar data={topProductsChartData} options={topProductsChartOptions} />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <Pie data={productsPieChartData} options={productsPieChartOptions} />
            </div>
          </div>

          {/* Tabla de productos con mayor gasto */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Detalle de Productos con Mayor Gasto</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="py-2 px-4 border-b text-left">#</th>
                    <th className="py-2 px-4 border-b text-left">Producto</th>
                    <th className="py-2 px-4 border-b text-right">Cantidad</th>
                    <th className="py-2 px-4 border-b text-right">USD</th>
                    <th className="py-2 px-4 border-b text-right">BCV (Bs.)</th>
                    <th className="py-2 px-4 border-b text-right">Paralelo (Bs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${index < 3 ? 'bg-green-50' : ''}`}>
                      <td className="py-2 px-4 border-b font-bold text-gray-500">{index + 1}</td>
                      <td className="py-2 px-4 border-b font-medium">{product.name}</td>
                      <td className="py-2 px-4 border-b text-right">{product.quantity}</td>
                      <td className="py-2 px-4 border-b text-right font-medium text-blue-600">
                        ${product.total.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        Bs. {convertToBolivares(product.total, exchangeRates.bcv).toFixed(2)}
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        Bs. {convertToBolivares(product.total, exchangeRates.parallel).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-bold">
                    <td className="py-2 px-4 border-b" colSpan={2}>TOTAL TOP 10</td>
                    <td className="py-2 px-4 border-b text-right">
                      {topProducts.reduce((sum, p) => sum + p.quantity, 0)}
                    </td>
                    <td className="py-2 px-4 border-b text-right text-blue-700">
                      ${topProducts.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      Bs. {convertToBolivares(topProducts.reduce((sum, p) => sum + p.total, 0), exchangeRates.bcv).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      Bs. {convertToBolivares(topProducts.reduce((sum, p) => sum + p.total, 0), exchangeRates.parallel).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de resumen */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Detalle de Gastos por Tienda</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Tienda</th>
                <th className="py-2 px-4 border-b text-right">USD</th>
                <th className="py-2 px-4 border-b text-right">BCV (Bs.)</th>
                <th className="py-2 px-4 border-b text-right">Paralelo (Bs.)</th>
                <th className="py-2 px-4 border-b text-right">Productos</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store) => (
                <>
                  <tr
                    key={store.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleStoreExpansion(store.id)}
                  >
                    <td className="py-2 px-4 border-b flex items-center">
                      {expandedStores[store.id] ? (
                        <ChevronDown className="inline-block mr-2 h-4 w-4" />
                      ) : (
                        <ChevronRight className="inline-block mr-2 h-4 w-4" />
                      )}
                      {store.name}
                    </td>
                    <td className="py-2 px-4 border-b text-right font-medium">
                      ${(storeSubtotals[store.id] || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      Bs. {convertToBolivares(storeSubtotals[store.id] || 0, exchangeRates.bcv).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      Bs. {convertToBolivares(storeSubtotals[store.id] || 0, exchangeRates.parallel).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      {products.filter((p) => p.storeId === store.id).length}
                    </td>
                  </tr>
                  {expandedStores[store.id] && (
                    <tr>
                      <td colSpan={5} className="p-0 border-b">
                        <div className="bg-gray-50 p-3 pl-10">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="py-1 px-3 text-left text-sm">Producto</th>
                                <th className="py-1 px-3 text-right text-sm">Precio</th>
                                <th className="py-1 px-3 text-right text-sm">Cantidad</th>
                                <th className="py-1 px-3 text-right text-sm">USD</th>
                                <th className="py-1 px-3 text-right text-sm">BCV (Bs.)</th>
                                <th className="py-1 px-3 text-right text-sm">Paralelo (Bs.)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products
                                .filter((p) => p.storeId === store.id)
                                .map((product) => (
                                  <tr key={product.id} className="border-b border-gray-200">
                                    <td className="py-1 px-3 text-sm">{product.title}</td>
                                    <td className="py-1 px-3 text-right text-sm">${product.price.toFixed(2)}</td>
                                    <td className="py-1 px-3 text-right text-sm">{product.quantity}</td>
                                    <td className="py-1 px-3 text-right text-sm font-medium">
                                      ${(product.price * product.quantity).toFixed(2)}
                                    </td>
                                    <td className="py-1 px-3 text-right text-sm">
                                      Bs.{" "}
                                      {convertToBolivares(product.price * product.quantity, exchangeRates.bcv).toFixed(
                                        2,
                                      )}
                                    </td>
                                    <td className="py-1 px-3 text-right text-sm">
                                      Bs.{" "}
                                      {convertToBolivares(
                                        product.price * product.quantity,
                                        exchangeRates.parallel,
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="py-2 px-4 border-b">TOTAL</td>
                <td className="py-2 px-4 border-b text-right">
                  $
                  {Object.values(storeSubtotals)
                    .reduce((sum, subtotal) => sum + subtotal, 0)
                    .toFixed(2)}
                </td>
                <td className="py-2 px-4 border-b text-right">
                  Bs.{" "}
                  {convertToBolivares(
                    Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0),
                    exchangeRates.bcv,
                  ).toFixed(2)}
                </td>
                <td className="py-2 px-4 border-b text-right">
                  Bs.{" "}
                  {convertToBolivares(
                    Object.values(storeSubtotals).reduce((sum, subtotal) => sum + subtotal, 0),
                    exchangeRates.parallel,
                  ).toFixed(2)}
                </td>
                <td className="py-2 px-4 border-b text-right">{products.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
