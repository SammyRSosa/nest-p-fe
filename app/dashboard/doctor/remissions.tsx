"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { CardInfo } from "@/components/card-info"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"

export default function RemissionsPage() {
  const [remissions, setRemissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadRemissions()
  }, [])

  const loadRemissions = async () => {
    try {
      const data = await api.remissions.getAll()
      setRemissions(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las remisiones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRemission = async () => {
    try {
      const patientId = prompt("ID del paciente:")
      const toDepartmentId = prompt("ID del departamento destino:")
      if (!patientId || !toDepartmentId) return

      await api.remissions.create({
        patientId,
        toDepartmentId,
        type: "internal", // o external según el caso
      })

      toast({ title: "Remisión creada exitosamente" })
      loadRemissions()
    } catch (error: any) {
      toast({
        title: "Error al crear remisión",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
      <DashboardLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Remisiones</h1>
          <Button onClick={handleCreateRemission}>Nueva Remisión</Button>
        </div>

        {loading ? (
          <p>Cargando remisiones...</p>
        ) : remissions.length === 0 ? (
          <p>No hay remisiones registradas.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {remissions.map((r) => (
              <CardInfo
                key={r.id}
                title={`Paciente: ${r.patient?.name || "N/A"}`}
                description={`Departamento destino: ${r.toDepartment?.name || "N/A"}`}
                badge={{
                  label: r.type === "internal" ? "Interna" : "Externa",
                  variant: r.type === "internal" ? "default" : "secondary",
                }}
                actions={[
                  {
                    label: "Crear consulta",
                    onClick: () => handleCreateConsultationFromRemission(r.id),
                  },
                ]}
              />
            ))}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )

  async function handleCreateConsultationFromRemission(remissionId: string) {
    try {
      const scheduledAt = prompt("Fecha y hora (YYYY-MM-DDTHH:mm):")
      if (!scheduledAt) return
      await api.consultations.create({
        remissionId,
        type: "programmed",
        scheduledAt,
      })
      toast({ title: "Consulta creada desde remisión" })
    } catch (error: any) {
      toast({
        title: "Error al crear consulta",
        description: error.message,
        variant: "destructive",
      })
    }
  }
}
