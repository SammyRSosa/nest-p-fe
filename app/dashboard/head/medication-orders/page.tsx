"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Pill, Package, Clock, CheckCircle, Plus, Search, Eye, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"
import { motion } from "framer-motion"

interface OrderItem {
  id: string
  medicationId?: string
  medication?: {
    id: string
    name: string
    code?: string
    unit?: string
  }
  quantity: number
}

interface MedicationOrder {
  id: string
  departmentId: string
  department: {
    id: string
    name: string
  }
  head?: {
    worker?: {
      firstName: string
      lastName: string
    }
  }
  items?: OrderItem[]
  status?: "pending" | "accepted" | "denied"
  requestedAt: Date
  respondedAt?: Date
  comment?: string
}

function MedicationOrdersContent() {
  const [orders, setOrders] = useState<MedicationOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<MedicationOrder | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.medicationOrders.getAll()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las órdenes",
        variant: "destructive",
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = () => {
    router.push("/dashboard/head/medication-orders/create")
  }

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "accepted":
        return {
          label: "Aceptada",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          icon: CheckCircle,
          bgIcon: "bg-green-100",
          dotColor: "border-l-green-500",
        }
      case "denied":
        return {
          label: "Rechazada",
          color: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          icon: AlertCircle,
          bgIcon: "bg-red-100",
          dotColor: "border-l-red-500",
        }
      default:
        return {
          label: "Pendiente",
          color: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-700",
          icon: Clock,
          bgIcon: "bg-yellow-100",
          dotColor: "border-l-yellow-500",
        }
    }
  }

  const filtered = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || !statusFilter ? true : order.status === statusFilter
    const matchesSearch =
      order.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.id?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => !o.status || o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    denied: orders.filter((o) => o.status === "denied").length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Órdenes de Medicamentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona todas las órdenes de medicamentos de tu departamento
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
            title="Total Órdenes"
            value={stats.total}
            icon={Pill}
            description="Todas las órdenes"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={Clock}
            description="Requieren revisión"
          />
          <StatCard
            title="Aceptadas"
            value={stats.accepted}
            icon={CheckCircle}
            description="Aprobadas"
          />
          <StatCard
            title="Rechazadas"
            value={stats.denied}
            icon={AlertCircle}
            description="No aprobadas"
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
                placeholder="Buscar por departamento o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-accent/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-accent/20">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="accepted">Aceptada</SelectItem>
                <SelectItem value="denied">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={handleCreateOrder}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Órdenes</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando órdenes...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay órdenes registradas</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((order, idx) => {
                const config = getStatusConfig(order.status)
                const Icon = config.icon

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`border-l-4 ${config.dotColor} hover:shadow-lg transition-all duration-300 ${config.color}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left Section - Order Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`h-10 w-10 rounded-lg ${config.bgIcon} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`h-5 w-5 ${config.textColor}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {order.department?.name || "Departamento desconocido"}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border inline-block mt-1`}
                                >
                                  {config.label}
                                </span>
                              </div>
                            </div>

                            {/* Order Details Grid */}
                            <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  ID Orden
                                </p>
                                <p className="font-mono text-sm text-gray-700 mt-1">
                                  {order.id.slice(0, 8)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Medicamentos
                                </p>
                                <p className="text-sm text-gray-700 font-semibold mt-1">
                                  {order.items?.length || 0} items
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Fecha Solicitud
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  {new Date(order.requestedAt).toLocaleDateString("es-ES")}
                                </p>
                              </div>
                            </div>

                            {/* Items Summary */}
                            {order.items && order.items.length > 0 && (
                              <div className={`p-3 rounded-lg border ${config.color}`}>
                                <p className={`text-xs uppercase tracking-wide font-semibold ${config.textColor} mb-2`}>
                                  Medicamentos solicitados ({order.items.length})
                                </p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {order.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className={`flex justify-between text-xs ${config.textColor}`}>
                                      <span className="font-medium">
                                        {item.medication?.name || "Medicamento"}
                                      </span>
                                      <span className="font-semibold">
                                        {item.quantity} {item.medication?.unit || "unidades"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Display comment if order is denied */}
                            {order.status === "denied" && order.comment && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-1">
                                  Motivo del rechazo
                                </p>
                                <p className="text-sm text-red-900">{order.comment}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <Button
                            variant="outline"
                            className="flex-shrink-0 border-accent/20 hover:bg-accent/5"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsDetailsModalOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Detalles
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
              <span className="font-semibold text-accent">📋 Información:</span> Crea nuevas órdenes de medicamentos según las necesidades de tu departamento. Monitorea el estado de tus órdenes y revisa los comentarios de rechazos.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package className="h-6 w-6" />
                Detalles de Orden
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Información completa de la solicitud de medicamentos
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Info Card */}
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Departamento
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {selectedOrder.department?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Estado
                      </p>
                      <p className={`text-lg font-bold mt-2 ${getStatusConfig(selectedOrder.status).textColor}`}>
                        {getStatusConfig(selectedOrder.status).label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        ID Orden
                      </p>
                      <p className="font-mono text-sm text-gray-700 mt-2">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Fecha de Solicitud
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {new Date(selectedOrder.requestedAt).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Medicamentos Solicitados ({selectedOrder.items?.length || 0})
                </h3>
                {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Sin medicamentos en esta orden</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {item.medication?.name || "Medicamento"}
                              </p>
                              {item.medication?.code && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Código: {item.medication.code}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4 p-3 bg-accent/10 rounded-lg">
                              <p className="text-lg font-bold text-accent">{item.quantity}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.medication?.unit || "unidades"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Display comment if order is denied */}
              {selectedOrder.status === "denied" && selectedOrder.comment && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-2">
                      Motivo del rechazo
                    </p>
                    <p className="text-sm text-red-900">{selectedOrder.comment}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end">
              <Button
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={() => {
                  setIsDetailsModalOpen(false)
                  setSelectedOrder(null)
                }}
              >
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function MedicationOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <MedicationOrdersContent />
    </ProtectedRoute>
  )
}