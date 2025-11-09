"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Building2, Activity } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function AdminDashboardContent() {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Edit target
  const [selectedWorker, setSelectedWorker] = useState<any>(null)

  // Form state (used for both modals)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    departmentId: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    loadWorkers()
  }, [])

  const loadWorkers = async () => {
    try {
      const data = await api.workers.getAll()
      setWorkers(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los trabajadores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ---------- Create ----------
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newWorker = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        departmentId: formData.departmentId || undefined,
      }

      await api.workers.create(newWorker)
      toast({ title: "Éxito", description: "Trabajador creado correctamente" })

      setIsCreateModalOpen(false)
      resetForm()
      loadWorkers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el trabajador",
        variant: "destructive",
      })
    }
  }

  // ---------- Edit ----------
  const openEditModal = (worker: any) => {
    setSelectedWorker(worker)
    setFormData({
      firstName: worker.firstName || "",
      lastName: worker.lastName || "",
      role: worker.role || "",
      departmentId: worker.department?.id || "",
    })
    setIsEditModalOpen(true)
  }

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updatedWorker = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        departmentId: formData.departmentId || undefined,
      }

      await api.workers.update(selectedWorker.id, updatedWorker)
      toast({ title: "Éxito", description: "Trabajador actualizado correctamente" })

      setIsEditModalOpen(false)
      resetForm()
      setSelectedWorker(null)
      loadWorkers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el trabajador",
        variant: "destructive",
      })
    }
  }

  // ---------- Delete ----------
  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este trabajador?")) return
    try {
      await api.workers.delete(id)
      toast({ title: "Éxito", description: "Trabajador eliminado correctamente" })
      loadWorkers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el trabajador",
        variant: "destructive",
      })
    }
  }

  // ---------- Helpers ----------
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      role: "",
      departmentId: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const columns = [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "role", label: "Rol" },
    { key: "code", label: "Codigo" },
    {
      key: "department",
      label: "Departamento",
      render: (worker: any) => worker.department?.name || "Sin departamento",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (worker: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              openEditModal(worker)
            }}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(worker.id)
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestión de trabajadores y departamentos
            </p>
          </div>
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => {
              resetForm()
              setIsCreateModalOpen(true)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Trabajador
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Trabajadores"
            value={workers.length}
            icon={Users}
            description="Personal activo"
          />
          <StatCard
            title="Departamentos"
            value="8"
            icon={Building2}
            description="Departamentos activos"
          />
          <StatCard
            title="Doctores"
            value={workers.filter((w) => w.role === "doctor").length}
            icon={Activity}
            description="Médicos disponibles"
          />
          <StatCard
            title="Enfermeros"
            value={workers.filter((w) => w.role === "nurse").length}
            icon={Users}
            description="Personal de enfermería"
          />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Trabajadores</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <TableList
              data={workers}
              columns={columns}
              searchPlaceholder="Buscar trabajador..."
            />
          )}
        </div>
      </div>

      {/* -------- CREATE MODAL -------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nuevo Trabajador</h2>
            <form onSubmit={handleCreateWorker} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
                className="input w-full"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
                className="input w-full"
              />
              <select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                required
                className="input w-full"
              >
                <option value="">Selecciona rol</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Enfermero</option>
                <option value="head_of_department">Jefe de Departamento</option>
                <option value="staff">Staff</option>
              </select>
              <input
                type="text"
                placeholder="ID del Departamento (opcional)"
                value={formData.departmentId}
                onChange={(e) =>
                  handleInputChange("departmentId", e.target.value)
                }
                className="input w-full"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------- EDIT MODAL -------- */}
      {isEditModalOpen && selectedWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Editar Trabajador</h2>
            <form onSubmit={handleEditWorker} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
                className="input w-full"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
                className="input w-full"
              />
              <select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                required
                className="input w-full"
              >
                <option value="">Selecciona rol</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Enfermero</option>
                <option value="head_of_department">Jefe de Departamento</option>
                <option value="staff">Staff</option>
              </select>
              <input
                type="text"
                placeholder="ID del Departamento"
                value={formData.departmentId}
                onChange={(e) =>
                  handleInputChange("departmentId", e.target.value)
                }
                className="input w-full"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setSelectedWorker(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
