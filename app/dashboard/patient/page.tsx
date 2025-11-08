"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CardInfo } from "@/components/card-info"
import { StatCard } from "@/components/stat-card"
import { Calendar, FileText, Activity, Clock } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function PatientDashboardContent() {
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

  const upcomingAppointments = appointments.filter((apt: any) => new Date(apt.date) >= new Date())

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Portal de Salud</h1>
          <p className="text-muted-foreground">Historial médico y próximas consultas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Próximas Consultas"
            value={upcomingAppointments.length}
            icon={Calendar}
            description="Programadas"
          />
          <StatCard title="Historial" value="12" icon={FileText} description="Consultas previas" />
          <StatCard title="Análisis" value="3" icon={Activity} description="Resultados disponibles" />
          <StatCard title="Última Visita" value="5 días" icon={Clock} description="Hace 5 días" />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Próximas Consultas</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tiene consultas programadas</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingAppointments.map((appointment: any) => (
                <CardInfo
                  key={appointment.id}
                  title={appointment.doctorName}
                  description={`${appointment.date} - ${appointment.time}`}
                  badge={{
                    label: appointment.type,
                    variant: "default",
                  }}
                  actions={[
                    {
                      label: "Ver Detalles",
                      onClick: () => {},
                      variant: "outline",
                    },
                  ]}
                >
                  <p className="text-sm text-muted-foreground">{appointment.department}</p>
                </CardInfo>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resultados de Análisis</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/30 cursor-pointer">
              <div>
                <p className="font-medium">Análisis de Sangre</p>
                <p className="text-sm text-muted-foreground">15 de Enero, 2025</p>
              </div>
              <span className="text-sm text-accent font-medium">Ver Resultados</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/30 cursor-pointer">
              <div>
                <p className="font-medium">Radiografía de Tórax</p>
                <p className="text-sm text-muted-foreground">10 de Enero, 2025</p>
              </div>
              <span className="text-sm text-accent font-medium">Ver Resultados</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PatientDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <PatientDashboardContent />
    </ProtectedRoute>
  )
}
