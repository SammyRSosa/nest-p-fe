"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, CheckCircle, Clock, AlertCircle, Mail, Phone, Stethoscope } from "lucide-react"

interface Consultation {
  id: string
  status: "pending" | "closed" | "canceled"
  diagnosis: string | null
  createdAt: Date
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  idNumber?: number | string
  email?: string
  phone?: number | string
  dateOfBirth?: Date
}

interface ClinicHistory {
  id: string
  patient?: Patient | null
  consultations?: Consultation[] | null
  notes?: string | null
  createdAt?: Date
}

export function ClinicHistoriesDashboardContent() {
  const [clinicHistory, setClinicHistory] = useState<ClinicHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.clinic_histories.getMyOwn()
        setClinicHistory(data)
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
    load()
  }, [])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "closed":
        return { label: "Cerrada", color: "bg-green-50 border-green-200", textColor: "text-green-700", icon: CheckCircle, bgIcon: "bg-green-100", dotColor: "bg-green-500" }
      case "pending":
        return { label: "Pendiente", color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700", icon: Clock, bgIcon: "bg-yellow-100", dotColor: "bg-yellow-500" }
      case "canceled":
        return { label: "Cancelada", color: "bg-red-50 border-red-200", textColor: "text-red-700", icon: AlertCircle, bgIcon: "bg-red-100", dotColor: "bg-red-500" }
      default:
        return { label: status, color: "bg-gray-50 border-gray-200", textColor: "text-gray-700", icon: FileText, bgIcon: "bg-gray-100", dotColor: "bg-gray-500" }
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando historial...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!clinicHistory) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontró información</p>
        </div>
      </DashboardLayout>
    )
  }

  const consultations = clinicHistory.consultations ?? []

  const stats = {
    total: consultations.length,
    closed: consultations.filter((c) => c.status === "closed").length,
    pending: consultations.filter((c) => c.status === "pending").length,
    canceled: consultations.filter((c) => c.status === "canceled").length,
  }

  const patient = clinicHistory.patient

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Mi Historial Clínico</h1>
          <p className="text-muted-foreground mt-2">Registro completo de tus consultas y seguimiento médico</p>
        </div>

        {/* Patient Info Card */}
        {patient && (
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {patient.firstName?.charAt(0)}
                    {patient.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    {patient.idNumber && <p className="text-sm text-muted-foreground mt-1">ID: {patient.idNumber}</p>}
                    {patient.dateOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        Nacimiento: {new Date(patient.dateOfBirth).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-accent/70 flex-shrink-0" />
                      <p className="text-sm text-gray-700 break-all">{patient.email}</p>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-accent/70 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{patient.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {consultations.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total de Consultas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.closed}</p>
                <p className="text-sm text-muted-foreground mt-1">Cerradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground mt-1">Pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{stats.canceled}</p>
                <p className="text-sm text-muted-foreground mt-1">Canceladas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Consultations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Mis Consultas</h2>

          {consultations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay consultas registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {consultations.map((consultation, idx) => {
                const config = getStatusConfig(consultation.status)
                const Icon = config.icon

                return (
                  <Card key={consultation.id} className={`border-l-4 border-l-accent ${config.color}`}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${config.bgIcon} flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${config.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">Consulta #{idx + 1}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border`}>
                              {config.label}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {consultation.createdAt && new Date(consultation.createdAt).toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>

                          {consultation.diagnosis ? (
                            <div className="p-3 bg-white rounded-lg border border-accent/20">
                              <p className="text-xs uppercase tracking-wide text-accent font-semibold flex items-center gap-2 mb-2">
                                <Stethoscope className="h-4 w-4" />
                                Diagnóstico
                              </p>
                              <p className="text-sm text-gray-700 font-medium">{consultation.diagnosis}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Sin diagnóstico registrado aún</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-accent">🔒 Privacidad garantizada:</span> Este historial clínico es confidencial y solo visible para ti y tus médicos autorizados.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function ClinicHistoriesDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <ClinicHistoriesDashboardContent />
    </ProtectedRoute>
  )
}
