"use client"

import { useState, useEffect } from "react"

export default function ClientPage() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log("Client component mounted or updated")
  }, [count])

  return (
    <div>
      <h1>Client-Side Component</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
