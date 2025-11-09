"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Users, Shield, Activity, UserCog } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function AdminUsersContent() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.users.getAll() // 👈 adjust endpoint if needed
      setUsers(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return

    try {
      await api.users.delete(id)
      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  const columns = [
    { key: "username", label: "Nombre" },
    { key: "email", label: "Correo" },
    { key: "role", label: "Rol" },
    {
      key: "actions",
      label: "Acciones",
      render: (user: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              // Optionally add edit modal later
            }}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(user.id)
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administración de cuentas y roles</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Usuarios"
            value={users.length}
            icon={Users}
            description="Usuarios registrados"
          />
          <StatCard
            title="Administradores"
            value={users.filter((u: any) => u.role === "admin").length}
            icon={Shield}
            description="Usuarios con rol admin"
          />
          <StatCard
            title="Doctores"
            value={users.filter((u: any) => u.role === "doctor").length}
            icon={Activity}
            description="Cuentas médicas"
          />
          <StatCard
            title="Pacientes"
            value={users.filter((u: any) => u.role === "patient").length}
            icon={UserCog}
            description="Usuarios pacientes activos"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Usuarios</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <TableList data={users} columns={columns} searchPlaceholder="Buscar usuario..." />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminUsersContent />
    </ProtectedRoute>
  )
}
