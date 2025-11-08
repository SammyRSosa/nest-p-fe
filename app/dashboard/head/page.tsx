"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Activity, Calendar } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function HeadDashboardContent() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const data = await api.patients.getAll()
      setPatients(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los pacientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "age", label: "Edad" },
    { key: "diagnosis", label: "Diagnóstico" },
    { key: "lastVisit", label: "Última Visita" },
    {
      key: "status",
      label: "Estado",
      render: (patient: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            patient.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {patient.status === "active" ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Jefe de Departamento</h1>
            <p className="text-muted-foreground">Gestión de pacientes del departamento</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Pacientes" value={patients.length} icon={Users} description="En el departamento" />
          <StatCard
            title="Pacientes Activos"
            value={patients.filter((p: any) => p.status === "active").length}
            icon={Activity}
            description="En tratamiento"
          />
          <StatCard title="Consultas Hoy" value="12" icon={Calendar} description="Programadas" />
          <StatCard title="Nuevos Esta Semana" value="5" icon={UserPlus} description="Pacientes nuevos" />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pacientes del Departamento</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <TableList data={patients} columns={columns} searchPlaceholder="Buscar paciente..." />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function HeadDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <HeadDashboardContent />
    </ProtectedRoute>
  )
}
