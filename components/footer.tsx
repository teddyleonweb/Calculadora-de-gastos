"use client"

import { useEffect, useState } from "react"

export default function Footer() {
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    // Verificar si ya existe un footer con este ID
    const existingFooter = document.getElementById("unique-footer")
    if (existingFooter && existingFooter !== document.querySelector("[data-footer-instance]")) {
      setShouldRender(false)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <footer id="unique-footer" data-footer-instance className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} MyMoney - by Somedia</p>
      </div>
    </footer>
  )
}
