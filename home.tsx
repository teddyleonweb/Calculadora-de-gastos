"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProjectService } from "@/services/project-service"
import type { Project } from "@/types/project"
import ProjectSelector from "@/components/project-selector"
import FinanceManager from "@/components/finance-manager"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, Package, Wallet } from "lucide-react"
import ExchangeRateDashboard from "@/components/exchange-rate-dashboard"
import ProductList from "@/components/product-list"
import TotalSummary from "@/components/total-summary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Importar componentes Select

export default function Home() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("summary") // Pestaña por defecto

  // Definición de las pestañas con sus IDs, nombres e iconos
  const tabs = [
    { id: "summary", name: "Resumen y Gráficas", icon: TrendingUp },
    { id: "exchange", name: "Dólar Hoy", icon: DollarSign },
    { id: "products", name: "Productos", icon: Package },
    { id: "finances", name: "Finanzas", icon: Wallet },
  ]

  const loadProjects = useCallback(async () => {
    if (user) {
      try {
        const fetchedProjects = await ProjectService.getProjects(user.token)
        setProjects(fetchedProjects)
        if (fetchedProjects.length > 0 && !activeProjectId) {
          setActiveProjectId(fetchedProjects[0].id.toString())
        }
      } catch (error) {
        console.error("Error loading projects:", error)
      }
    }
  }, [user, activeProjectId])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleProjectChange = (projectId: string) => {
    setActiveProjectId(projectId)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return <TotalSummary activeProjectId={activeProjectId} />
      case "exchange":
        return <ExchangeRateDashboard />
      case "products":
        return <ProductList activeProjectId={activeProjectId} />
      case "finances":
        return <FinanceManager activeProjectId={activeProjectId} />
      default:
        return <TotalSummary activeProjectId={activeProjectId} />
    }
  }

  return (
    <main className="flex-1 p-4 md:p-6 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Bienvenido, {user?.name || user?.email}!</h1>
          <ProjectSelector
            projects={projects}
            activeProjectId={activeProjectId}
            onProjectChange={handleProjectChange}
          />
        </div>

        {/* Select desplegable para móviles */}
        <div className="md:hidden mb-4">
          <Select onValueChange={setActiveTab} value={activeTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar Pestaña" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  <div className="flex items-center">
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botones de pestañas para escritorio */}
        <div className="hidden md:flex border-b border-gray-200 mb-4 space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 font-medium flex items-center transition-colors duration-200 ${
                activeTab === tab.id ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">{renderContent()}</CardContent>
        </Card>
      </div>
    </main>
  )
}
