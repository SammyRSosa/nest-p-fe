"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Shield, Stethoscope, UserCog, Trash2, Edit2, Search, User, Mail, Phone, Calendar } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"
import { motion } from "framer-motion"

interface UserData {
  id: string
  username: string
  role: "admin" | "doctor" | "nurse" | "head_of_department" | "patient"
  worker?: {
    id: string
    code: string
    firstName: string
    lastName: string
    email?: string
    role: string
    active: boolean
  } | null
  patient?: {
    id: string
    firstName: string
    lastName: string
    idNumber: string
    email: string
    phone: string
    dateOfBirth: string
  } | null
}

function AdminUsersContent() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await api.users.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return

    try {
      await api.users.delete(id)
      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  const getRoleConfig = (role: string) => {
    const configs: Record<string, any> = {
      admin: {
        label: "Administrador",
        icon: Shield,
        color: "bg-red-50 border-red-200",
        textColor: "text-red-700",
        bgIcon: "bg-red-100",
      },
      doctor: {
        label: "Médico",
        icon: Stethoscope,
        color: "bg-blue-50 border-blue-200",
        textColor: "text-blue-700",
        bgIcon: "bg-blue-100",
      },
      nurse: {
        label: "Enfermero",
        icon: Users,
        color: "bg-green-50 border-green-200",
        textColor: "text-green-700",
        bgIcon: "bg-green-100",
      },
      head_of_department: {
        label: "Jefe de Departamento",
        icon: UserCog,
        color: "bg-purple-50 border-purple-200",
        textColor: "text-purple-700",
        bgIcon: "bg-purple-100",
      },
      patient: {
        label: "Paciente",
        icon: User,
        color: "bg-amber-50 border-amber-200",
        textColor: "text-amber-700",
        bgIcon: "bg-amber-100",
      },
    }
    return configs[role] || configs.patient
  }

  const filtered = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.worker?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.worker?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.patient?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.patient?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.patient?.email?.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    doctors: users.filter((u) => u.role === "doctor").length,
    nurses: users.filter((u) => u.role === "nurse").length,
    patients: users.filter((u) => u.role === "patient").length,
  }

  const getUserName = (user: UserData): string => {
    if (user.worker) {
      return `${user.worker.firstName} ${user.worker.lastName}`
    }
    if (user.patient) {
      return `${user.patient.firstName} ${user.patient.lastName}`
    }
    return user.username
  }

  const getUserEmail = (user: UserData): string => {
    if (user.worker?.email) return user.worker.email
    if (user.patient?.email) return user.patient.email
    return "-"
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground mt-2">
              Administración de cuentas, roles y accesos
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Usuarios"
            value={stats.total}
            icon={Users}
            description="Cuentas registradas"
          />
          <StatCard
            title="Administradores"
            value={stats.admins}
            icon={Shield}
            description="Acceso total"
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
            icon={Users}
            description="Personal sanitario"
          />
          <StatCard
            title="Pacientes"
            value={stats.patients}
            icon={User}
            description="Usuarios activos"
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
                placeholder="Buscar por nombre, usuario o email..."
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
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="doctor">Médico</SelectItem>
                <SelectItem value="nurse">Enfermero</SelectItem>
                <SelectItem value="head_of_department">Jefe de Departamento</SelectItem>
                <SelectItem value="patient">Paciente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando usuarios...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay usuarios registrados</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((user, idx) => {
                const roleConfig = getRoleConfig(user.role)
                const RoleIcon = roleConfig.icon
                const userName = getUserName(user)
                const userEmail = getUserEmail(user)

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`border hover:shadow-lg transition-all duration-300 ${roleConfig.color}`}
                    >
                      <CardContent className="p-6">
                        {/* Header with Role */}
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`h-12 w-12 rounded-lg ${roleConfig.bgIcon} flex items-center justify-center`}
                          >
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
                          {userName}
                        </h3>

                        {/* Username */}
                        <p className="text-sm font-mono text-muted-foreground mb-4">
                          @{user.username}
                        </p>

                        {/* Email */}
                        {userEmail !== "-" && (
                          <div className="flex items-center gap-2 mb-4 break-all">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground truncate">
                              {userEmail}
                            </p>
                          </div>
                        )}

                        {/* Worker-specific info */}
                        {user.worker && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="inline-block px-2 py-1 rounded-lg bg-white/50 text-xs font-medium text-gray-700">
                              {user.worker.active ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        )}

                        {/* Patient-specific info */}
                        {user.patient && (
                          <div className="space-y-2 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="text-muted-foreground">{user.patient.phone}</p>
                            </div>
                            {user.patient.dateOfBirth && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                  {new Date(user.patient.dateOfBirth).toLocaleDateString(
                                    "es-ES"
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status Indicator */}
                        <div className="mb-6 p-3 rounded-lg bg-white/50">
                          <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">
                            Estado
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              user.worker?.active !== false
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.worker?.active !== false ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-accent/20 hover:bg-accent/5"
                            disabled
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDelete(user.id)}
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
              <span className="font-semibold text-accent">👥 Información:</span> Aquí puedes gestionar todos los usuarios del sistema. Visualiza información de trabajadores y pacientes, y gestiona sus permisos según sea necesario.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminUsersContent />
    </ProtectedRoute>
  )
}