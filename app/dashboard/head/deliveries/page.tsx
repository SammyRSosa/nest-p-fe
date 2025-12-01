"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Truck, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"

export default function DeliveriesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <DeliveriesContent />
    </ProtectedRoute>
  )
}

function DeliveriesContent() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [department, setDepartment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [items, setItems] = useState([{ medicationId: "", quantity: 1 }])
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get department
      const dept = await api.departments.getmydep()
      if (dept && typeof dept === "object" && !Array.isArray(dept)) {
        setDepartment(dept)

        // Get deliveries for this department
        const deliveriesData = await api.medicationDeliveries.getByDepartment(dept.id)
        const safeDeliveries = Array.isArray(deliveriesData) ? deliveriesData : []
        setDeliveries(safeDeliveries)
      }

      // Get all medications
      const medsData = await api.medications.getAll()
      const safeMeds = Array.isArray(medsData) ? medsData : []
      setMedications(safeMeds)
    } catch (err: any) {
      console.error("Error loading data:", err)
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
      console.error("Error creating delivery:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo registrar el envío",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 bg-yellow-100",
    approved: "text-blue-600 bg-blue-100",
    completed: "text-green-600 bg-green-100",
    rejected: "text-red-600 bg-red-100",
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      approved: "Aprobado",
      completed: "Completado",
      rejected: "Rechazado",
    }
    return labels[status] || status
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl font-bold">Envíos a Departamento</h1>
              <p className="text-muted-foreground">
                Gestiona los envíos de medicamentos al departamento
              </p>
            </div>
          </div>
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Envío
          </Button>
        </div>

        {/* Deliveries List */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Cargando envíos...</p>
            ) : deliveries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay envíos registrados</p>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery: any) => (
                  <div
                    key={delivery.id}
                    className="border rounded-lg p-4 hover:bg-secondary/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {delivery.department?.name || "N/A"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Solicitado por:{" "}
                          {delivery.requestedBy
                            ? `${delivery.requestedBy.firstName} ${delivery.requestedBy.lastName}`
                            : "N/A"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[delivery.status?.toLowerCase()] ||
                          "text-gray-600 bg-gray-100"
                        }`}
                      >
                        {getStatusLabel(delivery.status?.toLowerCase() || "")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Medicamentos</p>
                        <div className="space-y-1">
                          {delivery.items?.map((item: any, idx: number) => (
                            <p key={idx}>
                              {item.medication?.name || "N/A"} x{item.quantity}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Fecha</p>
                        <p>
                          {delivery.createdAt
                            ? new Date(delivery.createdAt).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ADD DELIVERY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-semibold mb-4">Crear Nuevo Envío</h2>

            <div className="space-y-4 mb-6">
              {/* Department Info */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                <p className="text-lg font-semibold">{department?.name || "N/A"}</p>
              </div>

              {/* Medications */}
              <div className="space-y-3">
                <h3 className="font-semibold">Medicamentos a Enviar</h3>

                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <Select
                      value={item.medicationId}
                      onValueChange={(val) => updateItem(index, "medicationId", val)}
                    >
                      <SelectTrigger className="flex-1">
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
                      className="w-24"
                    />

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Medicamento
                </Button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setItems([{ medicationId: "", quantity: 1 }])
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={createDelivery}
                disabled={items.length === 0 || isSaving}
              >
                {isSaving ? "Guardando..." : "Registrar Envío"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}