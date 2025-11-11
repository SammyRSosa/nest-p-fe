"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { CardInfo } from "@/components/card-info"
import {
  Calendar,
  Stethoscope,
  Users,
  CheckCircle,
  Clock,
  PlusCircle,
  Trash2,
  Edit,
} from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"
import { Button } from "@/components/ui/button"

function DoctorDashboardContent() {
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadConsultations()
  }, [])

  const loadConsultations = async () => {
    try {
      const data = await api.consultations.getAll()
      setConsultations(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las consultas médicas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]
  const todayConsultations = consultations.filter((c: any) =>
    c.scheduledAt ? c.scheduledAt.startsWith(today) : false
  )

  const pending = consultations.filter((c) => c.status === "pending")
  const closed = consultations.filter((c) => c.status === "closed")

  // ------------ CRUD -------------
  async function handleCreateConsultation() {
    const patientId = prompt("ID del paciente:")
    const scheduledAt = prompt("Fecha y hora (YYYY-MM-DDTHH:MM):")
    const type = prompt("Tipo (regular / emergency):") || "regular"
    if (!patientId || !scheduledAt) return

    try {
      await api.consultations.create({ patientId, scheduledAt, type })
      toast({ title: "Consulta creada", description: "Consulta registrada correctamente." })
      loadConsultations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la consulta.",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteConsultation(id: string) {
    if (!confirm("¿Eliminar esta consulta?")) return
    try {
      await api.consultations.delete(id)
      toast({ title: "Eliminada", description: "Consulta eliminada correctamente." })
      loadConsultations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la consulta.",
        variant: "destructive",
      })
    }
  }

  async function handleUpdateConsultation(id: string) {
    const newDate = prompt("Nueva fecha y hora (YYYY-MM-DDTHH:MM):")
    if (!newDate) return
    try {
      await api.consultations.update(id, { scheduledAt: newDate })
      toast({ title: "Actualizada", description: "Consulta modificada correctamente." })
      loadConsultations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la consulta.",
        variant: "destructive",
      })
    }
  }

  async function handleStatusChange(id: string, status: "pending" | "closed" | "canceled") {
    try {
      await api.consultations.updateStatus(id, status)
      toast({ title: "Estado actualizado", description: `Marcada como ${status}.` })
      loadConsultations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      })
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Cargando...</p>

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Panel del Doctor</h1>
            <p className="text-muted-foreground">
              Gestiona las consultas médicas y su estado
            </p>
          </div>
          <Button onClick={handleCreateConsultation} className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Consulta
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Consultas Totales"
            value={consultations.length}
            icon={Stethoscope}
            description="Todas las consultas registradas"
          />
          <StatCard
            title="Hoy"
            value={todayConsultations.length}
            icon={Calendar}
            description="Programadas para hoy"
          />
          <StatCard
            title="Pendientes"
            value={pending.length}
            icon={Clock}
            description="En espera de atención"
          />
          <StatCard
            title="Cerradas"
            value={closed.length}
            icon={CheckCircle}
            description="Finalizadas correctamente"
          />
        </div>

        {/* Listado de Consultas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Todas las Consultas</h2>
          {consultations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay consultas registradas
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {consultations.map((consultation: any) => (
                <CardInfo
                  key={consultation.id}
                  title={
                    consultation.patient?.name ||
                    consultation.patientName ||
                    `Paciente #${consultation.patientId}`
                  }
                  description={
                    consultation.type === "emergency"
                      ? "Consulta de emergencia"
                      : consultation.scheduledAt
                        ? `Programada para ${new Date(consultation.scheduledAt).toLocaleString("es-ES")}`
                        : "Sin horario definido"
                  }
                  badge={{
                    label:
                      consultation.status === "pending"
                        ? "Pendiente"
                        : consultation.status === "closed"
                          ? "Cerrada"
                          : "Cancelada",
                    variant:
                      consultation.status === "pending"
                        ? "default"
                        : consultation.status === "closed"
                          ? "secondary"
                          : "destructive",
                  }}
                  actions={[
                    {
                      label: "Cerrar",
                      onClick: () => handleStatusChange(consultation.id, "closed"),
                      variant: "secondary",
                    },
                    {
                      label: "Cancelar",
                      onClick: () => handleStatusChange(consultation.id, "canceled"),
                      variant: "destructive",
                    },
                    {
                      label: "Editar",
                      onClick: () => handleUpdateConsultation(consultation.id),
                      icon: Edit,
                    },
                    {
                      label: "Eliminar",
                      onClick: () => handleDeleteConsultation(consultation.id),
                      icon: Trash2,
                      variant: "destructive",
                    },
                  ]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DoctorDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
      <DoctorDashboardContent />
    </ProtectedRoute>
  )
}
