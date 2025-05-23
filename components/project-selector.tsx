"use client"

import { useState, useEffect } from "react"
import type { Project } from "../types"
import { Plus, X, Edit2, Check } from "lucide-react"

interface ProjectSelectorProps {
  projects: Project[]
  activeProjectId: string
  onProjectChange: (projectId: string) => void
  onAddProject: (name: string, description?: string) => void
  onDeleteProject: (projectId: string) => Promise<void>
  onUpdateProject: (projectId: string, name: string, description?: string) => void
}

export default function ProjectSelector({
  projects,
  activeProjectId,
  onProjectChange,
  onAddProject,
  onDeleteProject,
  onUpdateProject,
}: ProjectSelectorProps) {
  const [newProjectName, setNewProjectName] = useState<string>("")
  const [newProjectDescription, setNewProjectDescription] = useState<string>("")
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editProjectName, setEditProjectName] = useState<string>("")
  const [editProjectDescription, setEditProjectDescription] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [editMode, setEditMode] = useState<boolean>(false)

  // Añadir un useEffect para depurar los proyectos recibidos
  useEffect(() => {
    console.log("ProjectSelector recibió proyectos:", projects)
  }, [projects])

  const handleAddProject = async () => {
    if (newProjectName.trim() && !isAdding) {
      setIsAdding(true)
      try {
        await onAddProject(newProjectName.trim(), newProjectDescription.trim() || undefined)
        setNewProjectName("")
        setNewProjectDescription("")
        setIsAddingProject(false)
      } catch (error) {
        console.error("Error al añadir proyecto:", error)
      } finally {
        setIsAdding(false)
      }
    }
  }

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id)
    setEditProjectName(project.name)
    setEditProjectDescription(project.description || "")
  }

  const cancelEditingProject = () => {
    setEditingProjectId(null)
    setEditProjectName("")
    setEditProjectDescription("")
  }

  const saveEditingProject = (projectId: string) => {
    if (editProjectName.trim()) {
      onUpdateProject(projectId, editProjectName.trim(), editProjectDescription.trim() || undefined)
      setEditingProjectId(null)
      setEditProjectName("")
      setEditProjectDescription("")
    }
  }

  // Mostrar mensajes de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Modificar la función que maneja el botón de eliminar
  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId)
  }

  // Añadir funciones para confirmar o cancelar la eliminación
  const confirmDelete = async () => {
    if (projectToDelete) {
      setIsDeleting(true)
      try {
        await onDeleteProject(projectToDelete)
      } catch (error) {
        console.error("Error al eliminar proyecto:", error)
        setSuccessMessage("Error al eliminar proyecto. Inténtalo de nuevo.")
        setTimeout(() => setSuccessMessage(null), 3000)
      } finally {
        setIsDeleting(false)
        setProjectToDelete(null)
      }
    }
  }

  const cancelDelete = () => {
    setProjectToDelete(null)
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center border-b border-gray-200 mb-2">
        <div className="text-lg font-semibold mr-4">Proyectos:</div>
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <div key={project.id} className="relative mb-1 mr-1">
              {editingProjectId === project.id ? (
                <div className="flex flex-col bg-white border border-blue-500 rounded p-2 mb-2">
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="px-2 py-1 text-sm w-full border border-gray-300 rounded mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del proyecto"
                    autoFocus
                  />
                  <textarea
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    className="px-2 py-1 text-sm w-full border border-gray-300 rounded mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción (opcional)"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => saveEditingProject(project.id)}
                      className="p-1 text-green-600 hover:text-green-800 mr-1"
                      title="Guardar"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEditingProject}
                      className="p-1 text-gray-600 hover:text-gray-800"
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={`py-2 px-4 flex items-center gap-2 ${
                    activeProjectId === project.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } rounded-lg ${project.isDefault ? "font-semibold" : ""}`}
                  onClick={() => onProjectChange(project.id)}
                >
                  <span>{project.name}</span>
                  {project.isDefault && (
                    <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">Predeterminado</span>
                  )}
                </button>
              )}

              {/* Botones de acción para proyectos (no para el predeterminado) */}
              {!project.isDefault && !editingProjectId && editMode && (
                <div className="absolute -top-2 -right-2 flex">
                  <button
                    className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingProject(project)
                    }}
                    title="Editar proyecto"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(project.id)
                    }}
                    title="Eliminar proyecto"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div>No hay proyectos disponibles.</div>
        )}

        <div className="ml-2 mb-1 flex">
          {isAddingProject ? (
            <div className="flex flex-col border border-gray-300 rounded p-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Nombre del proyecto"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full mb-1"
                autoFocus
                disabled={isAdding}
              />
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full mb-1"
                rows={2}
                disabled={isAdding}
              />
              <div className="flex">
                <button
                  onClick={handleAddProject}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm flex items-center justify-center mr-1"
                  disabled={isAdding || !newProjectName.trim()}
                >
                  {isAdding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Añadiendo...
                    </>
                  ) : (
                    "Añadir"
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsAddingProject(false)
                    setNewProjectName("")
                    setNewProjectDescription("")
                  }}
                  className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                  disabled={isAdding}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsAddingProject(true)}
                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-lg mr-2"
              >
                <Plus size={16} className="mr-1" /> Nuevo proyecto
              </button>
              <button
                onClick={() => {
                  setEditMode(!editMode)
                  if (editMode) {
                    cancelEditingProject()
                  }
                }}
                className={`flex items-center ${
                  editMode ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } py-1 px-2 rounded-lg`}
                title={editMode ? "Salir del modo edición" : "Editar proyectos"}
              >
                <Edit2 size={16} className="mr-1" /> {editMode ? "Finalizar edición" : "Editar proyectos"}
              </button>
            </>
          )}
        </div>
      </div>
      {/* Mostrar mensajes de éxito */}
      {successMessage && (
        <div className="mt-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          {successMessage}
        </div>
      )}
      {/* Diálogo de confirmación para eliminar proyecto */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Confirmar eliminación</h3>
            <p className="mb-4">
              ¿Estás seguro de que deseas eliminar este proyecto? Los productos, tiendas y datos financieros asociados
              se moverán al proyecto predeterminado.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
