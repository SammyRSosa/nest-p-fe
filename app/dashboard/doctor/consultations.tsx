"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CardInfo } from "@/components/card-info"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"

export default function ConsultationsPage() {
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
        description: error.message || "No se pudieron cargar las consultas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: any) => {
    try {
      await api.consultations.updateStatus(id, newStatus)
      toast({
        title: "Estado actualizado",
        description: `La consulta ha sido marcada como ${newStatus}.`,
      })
      loadConsultations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
      <DashboardLayout>
        <h1 className="text-2xl font-bold mb-4">Consultas</h1>
        {loading ? (
          <p>Cargando consultas...</p>
        ) : consultations.length === 0 ? (
          <p>No hay consultas registradas.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {consultations.map((c) => (
              <CardInfo
                key={c.id}
                title={`Paciente: ${c.patient?.name || "N/A"}`}
                description={`Departamento: ${c.department?.name || "N/A"}`}
                badge={{
                  label: c.status,
                  variant:
                    c.status === "pending"
                      ? "default"
                      : c.status === "closed"
                      ? "secondary"
                      : "destructive",
                }}
                actions={[
                  {
                    label: "Cerrar",
                    onClick: () => handleUpdateStatus(c.id, "closed"),
                  },
                  {
                    label: "Cancelar",
                    onClick: () => handleUpdateStatus(c.id, "canceled"),
                    variant: "destructive",
                  },
                ]}
              />
            ))}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
