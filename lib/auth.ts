import type { NextApiRequest, NextApiResponse } from "next"
import { sign, verify } from "jsonwebtoken"
import { compare, hash } from "bcryptjs"
import { ObjectId } from "mongodb"
import clientPromise from "./mongodb"

// Tipos
export interface UserJWT {
  id: string
  email: string
  name: string
}

// Función para generar un token JWT
export const generateToken = (user: UserJWT): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido")
  }

  return sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  )
}

// Función para verificar un token JWT
export const verifyToken = (token: string): UserJWT | null => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido")
  }

  try {
    return verify(token, process.env.JWT_SECRET) as UserJWT
  } catch (error) {
    return null
  }
}

// Middleware para verificar autenticación
export const authMiddleware = async (req: NextApiRequest, res: NextApiResponse, next: () => Promise<void>) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "No autorizado" })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido" })
    }
    // Añadir el usuario al request
    ;(req as any).user = decoded

    await next()
  } catch (error) {
    console.error("Error en authMiddleware:", error)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}

// Función para hashear contraseñas
export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 12)
}

// Función para comparar contraseñas
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await compare(password, hashedPassword)
}

// Función para obtener la colección de usuarios
export const getUsersCollection = async () => {
  const client = await clientPromise
  return client.db("price-extractor").collection("users")
}

// Función para obtener un usuario por email
export const getUserByEmail = async (email: string) => {
  const usersCollection = await getUsersCollection()
  return await usersCollection.findOne({ email })
}

// Función para obtener un usuario por ID
export const getUserById = async (id: string) => {
  const usersCollection = await getUsersCollection()
  return await usersCollection.findOne({ _id: new ObjectId(id) })
}
