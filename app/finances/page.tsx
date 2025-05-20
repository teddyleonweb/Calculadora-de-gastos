"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ExpenseList from "@/components/expense-list"
import IncomeList from "@/components/income-list"
import AuthGuard from "@/components/auth-guard"

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<string>("expenses")

  return (
    <AuthGuard>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Gestión de Finanzas</h1>

        <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="expenses">Egresos</TabsTrigger>
            <TabsTrigger value="incomes">Ingresos</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses">
            <ExpenseList />
          </TabsContent>
          <TabsContent value="incomes">
            <IncomeList />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </AuthGuard>
  )
}
