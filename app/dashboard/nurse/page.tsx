"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { StatCard } from "@/components/stat-card"
import { Users, ClipboardList, CheckCircle, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function NurseDashboardContent() {
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
    { key: "room", label: "Habitación" },
    { key: "condition", label: "Condición" },
    {
      key: "priority",
      label: "Prioridad",
      render: (patient: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            patient.priority === "high"
              ? "bg-red-100 text-red-800"
              : patient.priority === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
          }`}
        >
          {patient.priority === "high" ? "Alta" : patient.priority === "medium" ? "Media" : "Baja"}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Panel de Enfermería</h1>
          <p className="text-muted-foreground">Pacientes asignados y tareas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Pacientes Asignados" value={patients.length} icon={Users} description="Bajo su cuidado" />
          <StatCard title="Tareas Pendientes" value="8" icon={ClipboardList} description="Por completar" />
          <StatCard title="Tareas Completadas" value="15" icon={CheckCircle} description="Hoy" />
          <StatCard title="Alertas" value="2" icon={AlertCircle} description="Requieren atención" />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pacientes Asignados</h2>
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

export default function NurseDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.NURSE]}>
      <NurseDashboardContent />
    </ProtectedRoute>
  )
}
