"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, AlertCircle, Mail, Phone, Stethoscope, Search, Eye, UserPlus } from "lucide-react"
import { PatientForm } from "@/components/admin/PatientForm"

interface Consultation {
  id: string
  status: "pending" | "closed" | "canceled"
  diagnosis: string | null
  createdAt: Date
}

interface ClinicHistory {
  id: string
  patient: {
    id: string
    firstName: string
    lastName: string
    idNumber: number
    email: string
    phone: number
    dateOfBirth: Date
  }
  consultations: Consultation[]
  notes: string | null
  createdAt: Date
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  idNumber: number
  email: string
  phone: number
  dateOfBirth: Date
}

function HeadClinicHistoryContent() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [clinicHistory, setClinicHistory] = useState<ClinicHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      setPatientsLoading(false)
    }
  }

  const createPatient = async (data: any) => {
    try {
      await api.patients.create(data)
      await loadPatients()
      setIsModalOpen(false)
      toast({
        title: "Éxito",
        description: "Paciente creado correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el paciente",
        variant: "destructive",
      })
    }
  }

  const loadClinicHistory = async (patientId: string) => {
    try {
      setLoading(true)
      const data = await api.clinic_histories.getByPatient(patientId)
      setClinicHistory(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el historial",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "closed":
        return {
          label: "Cerrada",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          icon: CheckCircle,
          bgIcon: "bg-green-100",
        }
      case "pending":
        return {
          label: "Pendiente",
          color: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-700",
          icon: Clock,
          bgIcon: "bg-yellow-100",
        }
      case "canceled":
        return {
          label: "Cancelada",
          color: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          icon: AlertCircle,
          bgIcon: "bg-red-100",
        }
      default:
        return {
          label: status,
          color: "bg-gray-50 border-gray-200",
          textColor: "text-gray-700",
          icon: FileText,
          bgIcon: "bg-gray-100",
        }
    }
  }

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.idNumber.toString().includes(search)
  )

  const stats = clinicHistory && clinicHistory.consultations && Array.isArray(clinicHistory.consultations)
    ? {
        total: clinicHistory.consultations.length,
        closed: clinicHistory.consultations.filter((c) => c.status === "closed").length,
        pending: clinicHistory.consultations.filter((c) => c.status === "pending").length,
        canceled: clinicHistory.consultations.filter((c) => c.status === "canceled").length,
      }
    : { total: 0, closed: 0, pending: 0, canceled: 0 }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Historial Clínico de Pacientes</h1>
          <p className="text-muted-foreground mt-2">Consulta el historial médico de tus pacientes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4">Pacientes</h2>
                <Button 
                  className="w-full mb-4 bg-accent hover:bg-accent/90"
                  onClick={() => setIsModalOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Paciente
                </Button>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {patientsLoading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 border-4 border-gray-200 border-t-accent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Cargando pacientes...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No se encontraron pacientes</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient)
                          loadClinicHistory(patient.id)
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedPatient?.id === patient.id
                            ? "bg-accent text-white border-accent"
                            : "bg-gray-50 border-gray-200 hover:border-accent hover:bg-accent/5"
                        }`}
                      >
                        <p className={`font-semibold text-sm ${selectedPatient?.id === patient.id ? "text-white" : "text-gray-900"}`}>
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className={`text-xs ${selectedPatient?.id === patient.id ? "text-white/70" : "text-muted-foreground"}`}>
                          {patient.idNumber}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Clinic History View */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Selecciona un paciente para ver su historial</p>
                </CardContent>
              </Card>
            ) : loading ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="h-12 w-12 border-4 border-gray-200 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando historial...</p>
                </CardContent>
              </Card>
            ) : !clinicHistory ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No hay información de historial</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Patient Info */}
                <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {clinicHistory.patient.firstName.charAt(0)}
                          {clinicHistory.patient.lastName.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {clinicHistory.patient.firstName} {clinicHistory.patient.lastName}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">ID: {clinicHistory.patient.idNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Nacimiento: {new Date(clinicHistory.patient.dateOfBirth).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-accent/70 flex-shrink-0" />
                          <p className="text-sm text-gray-700 break-all">{clinicHistory.patient.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-accent/70 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{clinicHistory.patient.phone}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                {clinicHistory.consultations && clinicHistory.consultations.length > 0 && (
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                          <p className="text-xs text-muted-foreground mt-1">Cerradas</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                          <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
                          <p className="text-xs text-muted-foreground mt-1">Canceladas</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Consultations */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Consultas</h3>
                  {!clinicHistory.consultations || clinicHistory.consultations.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-8 pb-8 text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Sin consultas registradas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {clinicHistory.consultations.map((consultation, idx) => {
                        const config = getStatusConfig(consultation.status)
                        const Icon = config.icon

                        return (
                          <Card key={consultation.id} className={`border-l-4 border-l-accent ${config.color}`}>
                            <CardContent className="pt-4">
                              <div className="flex gap-4">
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full ${config.bgIcon} flex items-center justify-center`}>
                                  <Icon className={`h-4 w-4 ${config.textColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-sm text-gray-900">Consulta #{idx + 1}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border`}>
                                      {config.label}
                                    </span>
                                  </div>

                                  <p className="text-xs text-muted-foreground mb-2">
                                    {new Date(consultation.createdAt).toLocaleDateString("es-ES", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>

                                  {consultation.diagnosis ? (
                                    <div className="p-2 bg-white rounded border border-accent/20 text-xs">
                                      <p className="text-accent font-semibold flex items-center gap-1 mb-1">
                                        <Stethoscope className="h-3 w-3" />
                                        Diagnóstico
                                      </p>
                                      <p className="text-gray-700">{consultation.diagnosis}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">Sin diagnóstico</p>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE PATIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nuevo Paciente</h2>
            <PatientForm
              onSubmit={createPatient}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function HeadClinicHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <HeadClinicHistoryContent />
    </ProtectedRoute>
  )
}