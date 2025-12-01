"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Building2, Activity } from "lucide-react"
import { api } from "@/lib/api"
import { usePatients } from "@/hooks/usePatients"
import { UserRole } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { PatientTable } from "@/components/admin/PatientTable"
import { PatientForm } from "@/components/admin/PatientForm"

function AdminPatientsContent() {
  const { patients, loading, createPatient, updatePatient, deletePatient } = usePatients()
  const [modalType, setModalType] = useState<"create" | "edit" | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
          </div>
          <Button className="bg-accent hover:bg-accent/90" onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Pacientes</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <PatientTable data={patients} onEdit={openEdit} onDelete={deletePatient} />
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {modalType === "create" ? "Nuevo Paciente" : "Editar Paciente"}
            </h2>
            <PatientForm
              initialData={selectedPatient}
              onSubmit={modalType === "create" ? createPatient : (data) => updatePatient(selectedPatient.id, data)}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function AdminPatientsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <AdminPatientsContent />
    </ProtectedRoute>
  )
}
