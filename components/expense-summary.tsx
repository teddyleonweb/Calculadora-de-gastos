"use client"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import type { Product, Store } from "../types"

// Registrar los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface ExpenseSummaryProps {
  products: Product[]
  stores: Store[]
  storeSubtotals: { [key: string]: number }
}

export default function ExpenseSummary({ products, stores, storeSubtotals }: ExpenseSummaryProps) {
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

  // Preparar datos para la gráfica de barras
  const barChartData = {
    labels: filteredStores.map((store) => store.name),
    datasets: [
      {
        label: "Gastos por Tienda",
        data: filteredStores.map((store) => storeSubtotals[store.id] || 0),
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
        text: "Gastos Totales por Tienda",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => "$" + value.toFixed(2),
        },
      },
    },
  }

  // Preparar datos para la gráfica de pastel
  const pieChartData = {
    labels: filteredStores.map((store) => store.name),
    datasets: [
      {
        label: "Gastos por Tienda",
        data: filteredStores.map((store) => storeSubtotals[store.id] || 0),
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
        text: "Distribución de Gastos por Tienda",
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
            return `${label}: $${value.toFixed(2)} (${percentage}%)`
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
      const expense = storeSubtotals[store.id] || 0
      if (expense > maxExpense) {
        maxExpense = expense
        storeWithMax = store.name
      }
    })

    return { store: storeWithMax, amount: maxExpense }
  }

  const highestExpense = getStoreWithHighestExpense()
  const hasDataToShow = filteredStores.length > 0

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Resumen y Gráficas de Gastos</h2>

      {/* Información destacada */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Información Destacada</h3>
        {hasDataToShow ? (
          <>
            <p className="text-gray-700">
              <span className="font-medium">Tienda con mayor gasto:</span>{" "}
              <span className="text-blue-600 font-bold">{highestExpense.store}</span> con{" "}
              <span className="text-blue-600 font-bold">${highestExpense.amount.toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mt-1">
              <span className="font-medium">Total de tiendas con productos:</span>{" "}
              <span className="text-blue-600 font-bold">{filteredStores.length}</span>
            </p>
          </>
        ) : (
          <p className="text-gray-700">
            No hay tiendas con productos para mostrar estadísticas. Agrega productos a tus tiendas para ver información
            destacada.
          </p>
        )}
      </div>

      {/* Gráficas */}
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

      {/* Tabla de resumen */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Detalle de Gastos por Tienda</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Tienda</th>
                <th className="py-2 px-4 border-b text-right">Monto Total</th>
                <th className="py-2 px-4 border-b text-right">Productos</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{store.name}</td>
                  <td className="py-2 px-4 border-b text-right font-medium">
                    ${(storeSubtotals[store.id] || 0).toFixed(2)}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {products.filter((p) => p.storeId === store.id).length}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="py-2 px-4 border-b">TOTAL</td>
                <td className="py-2 px-4 border-b text-right">
                  $
                  {Object.values(storeSubtotals)
                    .reduce((sum, subtotal) => sum + subtotal, 0)
                    .toFixed(2)}
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
