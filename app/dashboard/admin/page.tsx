"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserPlus, Building2, Stethoscope, Trash2, Edit2, Search, Shield, Mail, IdCard } from "lucide-react"
import { WorkerForm } from "@/components/admin/WorkerForm"
import { useWorkers } from "@/hooks/useWorkers"
import { UserRole } from "@/types"
import { motion } from "framer-motion"

function AdminDashboardContent() {
  const { workers, loading, createWorker, updateWorker, deleteWorker } = useWorkers()
  const [modalType, setModalType] = useState<"create" | "edit" | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

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

  const handleDelete = async (workerId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este trabajador?")) {
      await deleteWorker(workerId)
    }
  }

  const filtered = workers.filter((worker) => {
    const matchesSearch =
      worker.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      worker.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      worker.code?.toLowerCase().includes(search.toLowerCase()) ||
      worker.email?.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === "all" || worker.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleConfig = (role: string) => {
    const configs: Record<string, any> = {
      doctor: {
        label: "Médico",
        icon: Stethoscope,
        color: "bg-blue-50 border-blue-200",
        textColor: "text-blue-700",
        bgIcon: "bg-blue-100",
      },
      nurse: {
        label: "Enfermero",
        icon: Shield,
        color: "bg-green-50 border-green-200",
        textColor: "text-green-700",
        bgIcon: "bg-green-100",
      },
      head_of_department: {
        label: "Jefe de Departamento",
        icon: Users,
        color: "bg-purple-50 border-purple-200",
        textColor: "text-purple-700",
        bgIcon: "bg-purple-100",
      },
      admin: {
        label: "Administrador",
        icon: Shield,
        color: "bg-red-50 border-red-200",
        textColor: "text-red-700",
        bgIcon: "bg-red-100",
      },
    }
    return configs[role] || configs.doctor
  }

  const stats = {
    total: workers.length,
    departments: new Set(
      workers.map((w) =>
        typeof w.department === "string" ? w.department : w.department?.name
      )
    ).size,
    doctors: workers.filter((w) => w.role === "doctor").length,
    nurses: workers.filter((w) => w.role === "nurse").length,
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
            <p className="text-muted-foreground mt-2">
              Gestión integral de trabajadores y departamentos
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="font-semibold text-accent">
              {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Trabajadores"
            value={stats.total}
            icon={Users}
            description="Personal activo"
          />
          <StatCard
            title="Departamentos"
            value={stats.departments}
            icon={Building2}
            description="Departamentos activos"
          />
          <StatCard
            title="Médicos"
            value={stats.doctors}
            icon={Stethoscope}
            description="Personal médico"
          />
          <StatCard
            title="Enfermeros"
            value={stats.nurses}
            icon={Shield}
            description="Personal de enfermería"
          />
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg p-6 border border-accent/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" />
            Filtros y Búsqueda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-accent/20"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="border-accent/20">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="doctor">Médico</SelectItem>
                <SelectItem value="nurse">Enfermero</SelectItem>
                <SelectItem value="head_of_department">Jefe de Departamento</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={openCreate}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Trabajador
            </Button>
          </div>
        </div>

        {/* Workers Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Trabajadores</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay trabajadores registrados</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((worker, idx) => {
                const roleConfig = getRoleConfig(worker.role)
                const RoleIcon = roleConfig.icon

                return (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`border hover:shadow-lg transition-all duration-300 ${roleConfig.color}`}>
                      <CardContent className="p-6">
                        {/* Header with Role */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`h-12 w-12 rounded-lg ${roleConfig.bgIcon} flex items-center justify-center`}>
                            <RoleIcon className={`h-6 w-6 ${roleConfig.textColor}`} />
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${roleConfig.textColor} ${roleConfig.color} border`}
                          >
                            {roleConfig.label}
                          </span>
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {worker.firstName} {worker.lastName}
                        </h3>

                        {/* Code */}
                        <div className="flex items-center gap-2 mb-4">
                          <IdCard className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-mono text-muted-foreground">
                            {worker.code}
                          </p>
                        </div>

                        {/* Email */}
                        {worker.email && (
                          <div className="flex items-center gap-2 mb-4 break-all">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">
                              {worker.email}
                            </p>
                          </div>
                        )}

                        {/* Department */}
                        {worker.department && (
                          <div className="flex items-center gap-2 mb-6">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {typeof worker.department === "string"
                                ? worker.department
                                : worker.department.name || "Departamento"}
                            </p>
                          </div>
                        )}

                        {/* Status */}
                        <div className="mb-6 p-3 rounded-lg bg-white/50">
                          <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">
                            Estado
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              worker.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {worker.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-accent/20 hover:bg-accent/5"
                            onClick={() => openEdit(worker)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDelete(worker.id)}
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
              <span className="font-semibold text-accent">👥 Información:</span> Aquí puedes gestionar todos los trabajadores del hospital. Añade nuevos trabajadores, edita su información o elimina registros según sea necesario.
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
                {modalType === "create" ? "Nuevo Trabajador" : "Editar Trabajador"}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {modalType === "create"
                  ? "Registra un nuevo miembro del equipo"
                  : "Actualiza la información del trabajador"}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <WorkerForm
                initialData={selectedWorker}
                onSubmit={async (data) => {
                  let success = false
                  if (modalType === "create") {
                    success = await createWorker(data)
                  } else if (selectedWorker) {
                    success = await updateWorker(selectedWorker.id, data)
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