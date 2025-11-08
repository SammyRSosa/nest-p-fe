"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { StatCard } from "@/components/stat-card"
import { Users, ClipboardCheck, Clock, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function StaffDashboardContent() {
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
    { key: "id", label: "ID Paciente" },
    { key: "checkInTime", label: "Hora de Llegada" },
    {
      key: "status",
      label: "Estado",
      render: (patient: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            patient.checkedIn ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {patient.checkedIn ? "Registrado" : "Pendiente"}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Panel de Personal</h1>
          <p className="text-muted-foreground">Registro de asistencia y tareas administrativas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pacientes Hoy" value={patients.length} icon={Users} description="Total del día" />
          <StatCard
            title="Registrados"
            value={patients.filter((p: any) => p.checkedIn).length}
            icon={CheckCircle}
            description="Check-in completado"
          />
          <StatCard
            title="En Espera"
            value={patients.filter((p: any) => !p.checkedIn).length}
            icon={Clock}
            description="Por registrar"
          />
          <StatCard title="Tareas Completadas" value="23" icon={ClipboardCheck} description="Hoy" />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Registro de Asistencia</h2>
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

export default function StaffDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.STAFF]}>
      <StaffDashboardContent />
    </ProtectedRoute>
  )
}
