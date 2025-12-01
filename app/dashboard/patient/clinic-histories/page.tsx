"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CardInfo } from "@/components/card-info"
import { StatCard } from "@/components/stat-card"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"
import { ClinicHistoriesTable } from "@/components/patient/ClinicHistoriesTable"
import { id } from "date-fns/locale"

function ClinicHistoriesDashboardContent() {
  const [clinic_histories, setClinicHistories] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadClinicHistories()
  }, [])

  const loadClinicHistories = async () => {
    try {
      const data = await api.clinic_histories.getMyOwn()
      setClinicHistories(data)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Historial Clinico</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <ClinicHistoriesTable data={clinic_histories}/>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ClinicHistoriesDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <ClinicHistoriesDashboardContent/>
    </ProtectedRoute>
  )
}
