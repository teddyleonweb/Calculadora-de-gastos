import type { Project } from "../types"
import { API_CONFIG } from "../config/api"

export const ProjectService = {
  // Obtener todos los proyectos del usuario
  getProjects: async (userId: string): Promise<Project[]> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log("Solicitando proyectos a la API...")
      const response = await fetch(API_CONFIG.getUrlWithTimestamp(API_CONFIG.getEndpointUrl("/projects")), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error(`Error en la respuesta: ${response.status} ${response.statusText}`)
        throw new Error(`Error al obtener proyectos: ${response.status} ${response.statusText}`)
      }

      const projects = await response.json()
      console.log(`Proyectos obtenidos de la API:`, projects)
      return projects
    } catch (error) {
      console.error("Error al obtener proyectos:", error)
      return []
    }
  },

  // Añadir un nuevo proyecto
  addProject: async (userId: string, name: string, description?: string): Promise<Project> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const response = await fetch(API_CONFIG.getEndpointUrl("/projects"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al añadir proyecto")
      }

      const project = await response.json()

      return project
    } catch (error) {
      console.error("Error al añadir proyecto:", error)
      throw error
    }
  },

  // Actualizar un proyecto
  updateProject: async (
    userId: string,
    projectId: string,
    name: string,
    description?: string,
    isDefault?: boolean,
  ): Promise<Project> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      const data: any = { name }

      if (description !== undefined) {
        data.description = description
      }

      if (isDefault !== undefined) {
        data.isDefault = isDefault
      }

      const response = await fetch(API_CONFIG.getEndpointUrl(`/projects/${projectId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar proyecto")
      }

      const project = await response.json()

      return project
    } catch (error) {
      console.error("Error al actualizar proyecto:", error)
      throw error
    }
  },

  // Eliminar un proyecto
  deleteProject: async (userId: string, projectId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        throw new Error("No autorizado")
      }

      console.log(`Eliminando proyecto con ID: ${projectId}`)

      const response = await fetch(API_CONFIG.getEndpointUrl(`/projects/${projectId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error(`Error al eliminar proyecto: ${response.status} ${response.statusText}`)
        return false
      }

      return true
    } catch (error) {
      console.error("Error al eliminar proyecto:", error)
      return false
    }
  },
}
