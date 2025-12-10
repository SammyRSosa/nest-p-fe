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
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select"
import { Package, TrendingUp, Clock, CheckCircle, AlertCircle, Search, Plus, Pill } from "lucide-react"
import { StatCard } from "@/components/stat-card"

interface DeliveryItem {
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

interface MedicationDelivery {
  id: string
  departmentId: string
  department: {
    id: string
    name: string
  }
  items?: DeliveryItem[]
  status?: "pending" | "delivered" | "canceled"
  createdAt: Date
}

function AlmacenHeadDepartmentContent() {
  const [deliveries, setDeliveries] = useState<MedicationDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedDelivery, setSelectedDelivery] = useState<MedicationDelivery | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadDeliveries()
  }, [])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const data = await api.medicationDeliveries.getAll()
      setDeliveries(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las entregas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "delivered":
        return {
          label: "Entregada",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          icon: CheckCircle,
          bgIcon: "bg-green-100",
          dotColor: "border-l-green-500",
        }
      case "canceled":
        return {
          label: "Cancelada",
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

  const filtered = deliveries.filter((delivery) => {
    const matchesStatus =
      statusFilter === "all" || !statusFilter ? true : delivery.status === statusFilter
    const matchesSearch =
      delivery.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
      delivery.id?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter((d) => !d.status || d.status === "pending").length,
    delivered: deliveries.filter((d) => d.status === "delivered").length,
    canceled: deliveries.filter((d) => d.status === "canceled").length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Gestión de Entregas
            </h1>
            <p className="text-muted-foreground mt-2">Monitoreo y control de entregas de medicamentos a departamentos</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="font-semibold text-accent">{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Entregas" value={stats.total} icon={Package} description="Todas las entregas" />
          <StatCard title="Pendientes" value={stats.pending} icon={Clock} description="Requieren seguimiento" />
          <StatCard title="Entregadas" value={stats.delivered} icon={CheckCircle} description="Completadas" />
          <StatCard title="Canceladas" value={stats.canceled} icon={AlertCircle} description="No procesadas" />
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
                <SelectItem value="delivered">Entregada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Entregas de Medicamentos</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando entregas...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay entregas registradas</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((delivery) => {
                const config = getStatusConfig(delivery.status)
                const Icon = config.icon

                return (
                  <Card
                    key={delivery.id}
                    className={`border-l-4 ${config.dotColor} hover:shadow-lg transition-all duration-300 ${config.color}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Section - Delivery Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`h-10 w-10 rounded-lg ${config.bgIcon} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`h-5 w-5 ${config.textColor}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {delivery.department?.name || "Departamento desconocido"}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border inline-block mt-1`}>
                                {config.label}
                              </span>
                            </div>
                          </div>

                          {/* Delivery Details Grid */}
                          <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">ID Entrega</p>
                              <p className="font-mono text-sm text-gray-700 mt-1">{delivery.id.slice(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Medicamentos</p>
                              <p className="text-sm text-gray-700 font-semibold mt-1">{delivery.items?.length || 0} items</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Fecha</p>
                              <p className="text-sm text-gray-700 mt-1">
                                {new Date(delivery.createdAt).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          </div>

                          {/* Items Summary */}
                          {delivery.items && delivery.items.length > 0 && (
                            <div className={`p-3 rounded-lg border ${config.color}`}>
                              <p className={`text-xs uppercase tracking-wide font-semibold ${config.textColor} mb-2`}>
                                Medicamentos a entregar ({delivery.items.length})
                              </p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {delivery.items.map((item, idx) => (
                                  <div key={idx} className={`flex justify-between text-xs ${config.textColor}`}>
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
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="outline"
                          className="flex-shrink-0 border-accent/20 hover:bg-accent/5"
                          onClick={() => {
                            setSelectedDelivery(delivery)
                            setIsDetailsModalOpen(true)
                          }}
                        >
                          <Pill className="mr-2 h-4 w-4" />
                          Detalles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-accent">📦 Información:</span> Las entregas pendientes requieren seguimiento. Verifica el estado de cada entrega y coordina con almacén para su distribución.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package className="h-6 w-6" />
                Detalles de Entrega
              </h2>
              <p className="text-white/80 text-sm mt-1">Información completa de la entrega de medicamentos</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Delivery Info Card */}
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">Departamento</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">{selectedDelivery.department?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">Estado</p>
                      <p className={`text-lg font-bold mt-2 ${getStatusConfig(selectedDelivery.status).textColor}`}>
                        {getStatusConfig(selectedDelivery.status).label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">ID Entrega</p>
                      <p className="font-mono text-sm text-gray-700 mt-2">{selectedDelivery.id}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">Fecha</p>
                      <p className="text-sm text-gray-700 mt-2">
                        {new Date(selectedDelivery.createdAt).toLocaleDateString("es-ES", {
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
                <h3 className="text-lg font-semibold mb-4">Medicamentos ({selectedDelivery.items?.length || 0})</h3>
                {!selectedDelivery.items || selectedDelivery.items.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Sin medicamentos en esta entrega</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedDelivery.items.map((item, idx) => (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.medication?.name || "Medicamento"}</p>
                              {item.medication?.code && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Código: {item.medication.code}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4 p-3 bg-accent/10 rounded-lg">
                              <p className="text-lg font-bold text-accent">{item.quantity}</p>
                              <p className="text-xs text-muted-foreground">{item.medication?.unit || "unidades"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end">
              <Button
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={() => {
                  setIsDetailsModalOpen(false)
                  setSelectedDelivery(null)
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

export default function AlmacenHeadDepartmentPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <AlmacenHeadDepartmentContent />
    </ProtectedRoute>
  )
}