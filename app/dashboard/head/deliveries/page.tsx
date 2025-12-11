"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Truck, Plus, CheckCircle, AlertCircle, Clock, Search, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"
import { StatCard } from "@/components/stat-card"
import { motion } from "framer-motion"

interface DeliveryItem {
  id: string
  medication?: {
    id: string
    name: string
    code?: string
    unit?: string
  }
  quantity: number
}

interface Delivery {
  id: string
  departmentId: string
  department?: {
    id: string
    name: string
  }
  items?: DeliveryItem[]
  status?: "pending" | "delivered" | "canceled"
  createdAt: Date
  comment?: string
}

export default function DeliveriesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <DeliveriesContent />
    </ProtectedRoute>
  )
}

function DeliveriesContent() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [department, setDepartment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [items, setItems] = useState([{ medicationId: "", quantity: 1 }])
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<"pending" | "delivered" | "canceled" | "">("")
  const [comment, setComment] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const dept = await api.departments.getmydep()
      if (dept && typeof dept === "object" && !Array.isArray(dept)) {
        setDepartment(dept)

        const deliveriesData = await api.medicationDeliveries.getByDepartment(dept.id)
        const safeDeliveries = Array.isArray(deliveriesData) ? deliveriesData : []
        setDeliveries(safeDeliveries)
      }

      const medsData = await api.medications.getAll()
      const safeMeds = Array.isArray(medsData) ? medsData : []
      setMedications(safeMeds)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudieron cargar los datos",
        variant: "destructive",
      })
      setDeliveries([])
      setMedications([])
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { medicationId: "", quantity: 1 }])
  }

  const updateItem = (index: number, field: "medicationId" | "quantity", value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const validateItems = () => {
    for (const item of items) {
      if (!item.medicationId) {
        toast({
          title: "Error",
          description: "Selecciona un medicamento en cada fila",
          variant: "destructive",
        })
        return false
      }
      if (item.quantity <= 0) {
        toast({
          title: "Error",
          description: "La cantidad debe ser mayor a 0",
          variant: "destructive",
        })
        return false
      }
    }
    return true
  }

  const createDelivery = async () => {
    if (!validateItems() || !department) return

    try {
      setIsSaving(true)

      const deliveryItems = items.map((item) => ({
        medicationId: item.medicationId,
        quantity: item.quantity,
      }))

      await api.medicationDeliveries.create({
        departmentId: department.id,
        items: deliveryItems,
      })

      toast({
        title: "Éxito",
        description: "Envío registrado correctamente",
      })

      setIsAddModalOpen(false)
      setItems([{ medicationId: "", quantity: 1 }])
      loadData()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo registrar el envío",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedDelivery || !updateStatus) return

    try {
      setIsUpdating(true)
      await api.medicationDeliveries.updateStatus(
        selectedDelivery.id,
        updateStatus as "pending" | "delivered" | "canceled",
        comment || undefined
      )

      toast({
        title: "Éxito",
        description: "Estado de entrega actualizado correctamente",
      })

      await loadData()
      setIsStatusModalOpen(false)
      setUpdateStatus("")
      setComment("")
      setSelectedDelivery(null)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
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
              Envíos al Departamento
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y confirma los envíos de medicamentos recibidos
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
            title="Total Envíos"
            value={stats.total}
            icon={Truck}
            description="Todos los envíos"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={Clock}
            description="Requieren confirmación"
          />
          <StatCard
            title="Entregados"
            value={stats.delivered}
            icon={CheckCircle}
            description="Confirmados"
          />
          <StatCard
            title="Cancelados"
            value={stats.canceled}
            icon={AlertCircle}
            description="No procesados"
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
                placeholder="Buscar por ID..."
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
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Envío
            </Button>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Envíos</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando envíos...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay envíos registrados</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((delivery, idx) => {
                const config = getStatusConfig(delivery.status)
                const Icon = config.icon

                return (
                  <motion.div
                    key={delivery.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`border-l-4 ${config.dotColor} hover:shadow-lg transition-all duration-300 ${config.color}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left Section */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`h-10 w-10 rounded-lg ${config.bgIcon} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`h-5 w-5 ${config.textColor}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {delivery.department?.name || "Departamento"}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border inline-block mt-1`}
                                >
                                  {config.label}
                                </span>
                              </div>
                            </div>

                            {/* Delivery Details Grid */}
                            <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  ID Envío
                                </p>
                                <p className="font-mono text-sm text-gray-700 mt-1">
                                  {delivery.id.slice(0, 8)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Medicamentos
                                </p>
                                <p className="text-sm text-gray-700 font-semibold mt-1">
                                  {delivery.items?.length || 0} items
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Fecha
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  {new Date(delivery.createdAt).toLocaleDateString("es-ES")}
                                </p>
                              </div>
                            </div>

                            {/* Items Summary */}
                            {delivery.items && delivery.items.length > 0 && (
                              <div className={`p-3 rounded-lg border ${config.color}`}>
                                <p className={`text-xs uppercase tracking-wide font-semibold ${config.textColor} mb-2`}>
                                  Medicamentos ({delivery.items.length})
                                </p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {delivery.items.map((item, itemIdx) => (
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

                            {/* Display comment if status is not pending */}
                            {delivery.status !== "pending" && delivery.comment && (
                              <div className={`mt-3 p-3 rounded-lg border ${config.color}`}>
                                <p className={`text-xs uppercase tracking-wide font-semibold ${config.textColor} mb-1 flex items-center gap-1`}>
                                  <MessageSquare className="h-3 w-3" />
                                  Comentario
                                </p>
                                <p className={`text-sm ${config.textColor}`}>{delivery.comment}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          {delivery.status === "pending" && (
                            <Button
                              className="flex-shrink-0 bg-accent hover:bg-accent/90 text-white"
                              onClick={() => {
                                setSelectedDelivery(delivery)
                                setUpdateStatus("")
                                setComment("")
                                setIsStatusModalOpen(true)
                              }}
                            >
                              Confirmar
                            </Button>
                          )}
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
              <span className="font-semibold text-accent">📦 Información:</span> Confirma la recepción de los envíos o marca como cancelados. Puedes agregar comentarios para documentar cualquier incidencia.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* STATUS UPDATE MODAL */}
      {isStatusModalOpen && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Truck className="h-6 w-6" />
                Confirmar Envío
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Actualiza el estado de la entrega de medicamentos
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Delivery Info Card */}
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Departamento
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {selectedDelivery.department?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        ID Envío
                      </p>
                      <p className="font-mono text-sm text-gray-700 mt-2">
                        {selectedDelivery.id}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Medicamentos ({selectedDelivery.items?.length || 0})
                </h3>
                {!selectedDelivery.items || selectedDelivery.items.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Sin medicamentos en este envío</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedDelivery.items.map((item, idx) => (
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

              {/* Status Update Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  Actualizar Estado
                </h3>

                <Select value={updateStatus} onValueChange={(value) => setUpdateStatus(value as "pending" | "delivered" | "canceled" | "")}>
                  <SelectTrigger className="border-accent/20">
                    <SelectValue placeholder="Selecciona el estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivered">Entregado - Confirmado</SelectItem>
                    <SelectItem value="canceled">Cancelado - No recibido</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comentario (opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Agregar observaciones sobre este envío..."
                    className="w-full px-3 py-2 border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStatusModalOpen(false)
                  setSelectedDelivery(null)
                  setUpdateStatus("")
                  setComment("")
                }}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              {updateStatus && (
                <Button
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Actualizando..." : "Confirmar Estado"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* CREATE DELIVERY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="h-6 w-6" />
                Crear Nuevo Envío
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Registra un nuevo envío de medicamentos
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Department Info */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Departamento
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {department?.name || "Departamento"}
                </p>
              </div>

              {/* Medications */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Medicamentos a Enviar</h3>

                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <Select
                      value={item.medicationId}
                      onValueChange={(val) => updateItem(index, "medicationId", val)}
                    >
                      <SelectTrigger className="flex-1 border-accent/20">
                        <SelectValue placeholder="Selecciona medicamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {medications.map((med: any) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name} {med.code ? `(${med.code})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      placeholder="Cantidad"
                      className="w-24 border-accent/20"
                    />

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-accent/20"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Medicamento
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setItems([{ medicationId: "", quantity: 1 }])
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={createDelivery}
                disabled={items.length === 0 || isSaving}
              >
                {isSaving ? "Guardando..." : "Registrar Envío"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}