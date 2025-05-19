"use client"

import { useState } from "react"

export default function DevBypass() {
  const [showBypass, setShowBypass] = useState(false)

  const handleBypass = () => {
    // Crear un token falso para desarrollo
    const fakeToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldl91c2VyIiwibmFtZSI6IkRlc2Fycm9sbGFkb3IiLCJlbWFpbCI6ImRldkBleGFtcGxlLmNvbSIsImlhdCI6MTYyMDY0NzIwMCwiZXhwIjoxOTM2MDA3MjAwfQ.3YWcTGwNTBDlqQoHG1GwNBTjN9EXLfyZpLNR6FfTmCg"
    localStorage.setItem("auth_token", fakeToken)
    window.location.href = "/"
  }

  return (
    <div className="fixed bottom-4 right-4">
      {showBypass ? (
        <div className="bg-yellow-100 p-4 rounded-lg shadow-lg">
          <p className="text-yellow-800 mb-2">Modo desarrollo</p>
          <button onClick={handleBypass} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
            Acceder sin autenticación
          </button>
          <button onClick={() => setShowBypass(false)} className="ml-2 text-yellow-800 hover:text-yellow-900">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowBypass(true)}
          className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
          title="Opciones de desarrollo"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  )
}
