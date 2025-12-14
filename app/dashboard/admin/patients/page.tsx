"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserPlus, Trash2, Edit2, Search, Mail, IdCard, Phone, Calendar  } from "lucide-react"
import { UserRole } from "@/types"
import { motion } from "framer-motion"
import { PatientForm } from "@/components/admin/PatientForm"
import { usePatients } from "@/hooks/usePatients"

function AdminDashboardContent() {
  const { patients, loading, createPatient, updatePatient, deletePatient } = usePatients()
  const [modalType, setModalType] = useState<"create" | "edit" | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [search, setSearch] = useState("")

  const openCreate = () => {
    setSelectedPatient(null)
    setModalType("create")
  }

  const openEdit = (patient: any) => {
    setSelectedPatient(patient)
    setModalType("edit")
  }

  const closeModal = () => {
    setSelectedPatient(null)
    setModalType(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este paciente?")) {
      await deletePatient(id)
    }
  }

  const filtered = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      patient.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      patient.idNumber?.toLowerCase().includes(search.toLowerCase()) ||
      patient.email?.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const stats = {
    total: patients.length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground mt-2">Gestión Pacientes</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-muted-foreground">Última actualización</p>
              <p className="font-semibold text-accent">
                {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <Button className="bg-accent hover:bg-accent/90 text-white" onClick={openCreate}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          </div>
        </div>
        {/* Filters */}
        <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg p-6 border border-accent/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" />
            Búsqueda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, Id o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-accent/20"
              />
            </div>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Pacientes</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando Pacientes...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay Pacientes registrados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((patient, idx) => {

                return (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`border hover:shadow-lg transition-all duration-300`}>
                      <CardContent className="p-6">
                        {/* Name */}
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {patient.firstName} {patient.lastName}
                        </h3>

                        {/* idNumber */}
                        <div className="flex items-center gap-2 mb-4">
                          <IdCard className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-mono text-muted-foreground">
                            {patient.idNumber}
                          </p>
                        </div>
                        
                        {/* Email */}
                        {patient.email && (
                          <div className="flex items-center gap-2 mb-4 break-all">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">
                              {patient.email}
                            </p>
                          </div>
                        )}

                        {/* Phone */}
                        <div className="flex items-center gap-2 mb-4">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-mono text-muted-foreground">
                            {patient.phone}
                          </p>
                        </div>

                        {/* DateOfBirth */}
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-mono text-muted-foreground">
                            {patient.dateOfBirth}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-accent/20 hover:bg-accent/5"
                            onClick={() => openEdit(patient)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDelete(patient.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-accent">👥 Información:</span> Aquí puedes gestionar todos los paciente. Añade nuevos pacientes, edita su información o elimina registros según sea necesario.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CREATE/EDIT MODAL */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-md my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <UserPlus className="h-6 w-6" />
                {modalType === "create" ? "Nuevo Paciente" : "Editar Paciente"}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {modalType === "create"
                  ? "Registra un nuevo Paciente"
                  : "Actualiza la información del Paciente"}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <PatientForm
                initialData={selectedPatient}
                onSubmit={async (data) => {
                  let success = false
                  if (modalType === "create") {
                    success = await createPatient(data)
                  } else if (selectedPatient) {
                    success = await updatePatient(selectedPatient.id, data)
                  }

                  if (success) {
                    closeModal()
                  }
                }}
                onCancel={closeModal}
              />
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}