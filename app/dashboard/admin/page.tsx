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
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este trabajador?")) return

    try {
      await api.workers.delete(id)
      toast({
        title: "Éxito",
        description: "Trabajador eliminado correctamente",
      })
      loadWorkers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el trabajador",
        variant: "destructive",
      })
    }
  }

  const columns = [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "role", label: "Rol" },
    { key: "email", label: "Email" },
    { key: "department", label: "Departamento" },
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
            <p className="text-muted-foreground">Gestión de trabajadores y departamentos</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Trabajador
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Trabajadores" value={workers.length} icon={Users} description="Personal activo" />
          <StatCard title="Departamentos" value="8" icon={Building2} description="Departamentos activos" />
          <StatCard
            title="Doctores"
            value={workers.filter((w: any) => w.role === "doctor").length}
            icon={Activity}
            description="Médicos disponibles"
          />
          <StatCard
            title="Enfermeros"
            value={workers.filter((w: any) => w.role === "nurse").length}
            icon={Users}
            description="Personal de enfermería"
          />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Trabajadores</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <TableList data={workers} columns={columns} searchPlaceholder="Buscar trabajador..." />
          )}
        </div>
      </div>
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
