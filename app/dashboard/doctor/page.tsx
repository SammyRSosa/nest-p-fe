"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CardInfo } from "@/components/card-info"
import { StatCard } from "@/components/stat-card"
import { Calendar, Users, Clock, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function DoctorDashboardContent() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const data = await api.appointments.getAll()
      setAppointments(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las consultas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const todayAppointments = appointments.filter((apt: any) => apt.date === new Date().toISOString().split("T")[0])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Panel del Doctor</h1>
          <p className="text-muted-foreground">Consultas y pacientes asignados</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Consultas Hoy"
            value={todayAppointments.length}
            icon={Calendar}
            description="Programadas para hoy"
          />
          <StatCard title="Pacientes Totales" value="45" icon={Users} description="Bajo su cuidado" />
          <StatCard
            title="Pendientes"
            value={todayAppointments.filter((a: any) => a.status === "pending").length}
            icon={Clock}
            description="Por atender"
          />
          <StatCard
            title="Completadas"
            value={todayAppointments.filter((a: any) => a.status === "completed").length}
            icon={CheckCircle}
            description="Hoy"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Consultas de Hoy</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : todayAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay consultas programadas para hoy</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayAppointments.map((appointment: any) => (
                <CardInfo
                  key={appointment.id}
                  title={appointment.patientName}
                  description={`${appointment.time} - ${appointment.reason}`}
                  badge={{
                    label: appointment.status === "pending" ? "Pendiente" : "Completada",
                    variant: appointment.status === "pending" ? "default" : "secondary",
                  }}
                  actions={[
                    {
                      label: "Ver Detalles",
                      onClick: () => {},
                      variant: "outline",
                    },
                    {
                      label: "Atender",
                      onClick: () => {},
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
