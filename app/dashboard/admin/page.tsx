"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Building2, Activity } from "lucide-react"
import { WorkerForm } from "@/components/admin/WorkerForm"
import { WorkerTable } from "@/components/admin/WorkerTable"
import { useWorkers } from "@/hooks/useWorkers"
import { UserRole } from "@/types"

function AdminDashboardContent() {
  const { workers, loading, createWorker, updateWorker, deleteWorker } = useWorkers()
  const [modalType, setModalType] = useState<"create" | "edit" | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<any>(null)

  const openCreate = () => {
    setSelectedWorker(null)
    setModalType("create")
  }

  const openEdit = (worker: any) => {
    setSelectedWorker(worker)
    setModalType("edit")
  }

  const closeModal = () => {
    setSelectedWorker(null)
    setModalType(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">
              Gestión de trabajadores y departamentos
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90" onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Trabajador
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Trabajadores"
            value={workers.length}
            icon={Users}
            description="Personal activo"
          />
          <StatCard
            title="Departamentos"
            value="8"
            icon={Building2}
            description="Departamentos activos"
          />
          <StatCard
            title="Doctores"
            value={workers.filter((w) => w.role === "doctor").length}
            icon={Activity}
            description="Médicos disponibles"
          />
          <StatCard
            title="Enfermeros"
            value={workers.filter((w) => w.role === "nurse").length}
            icon={Users}
            description="Personal de enfermería"
          />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Trabajadores</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : (
            <WorkerTable data={workers} onEdit={openEdit} onDelete={deleteWorker} />
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {modalType === "create" ? "Nuevo Trabajador" : "Editar Trabajador"}
            </h2>
            <WorkerForm
              initialData={selectedWorker}
              onSubmit={async (data) => {
                let success = false;
                if (modalType === "create") {
                  success = await createWorker(data); // devuelve true/false
                } else if (selectedWorker) {
                  success = await updateWorker(selectedWorker.id, data); // devuelve true/false
                }

                if (success) {
                  closeModal(); // cerrar modal si todo salió bien
                }
                // si falló, el toast ya se mostró desde useWorkers
              }}
              onCancel={closeModal}
            />

          </div>
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
