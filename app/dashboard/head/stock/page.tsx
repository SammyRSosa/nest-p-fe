"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"
import { Pill, Plus } from "lucide-react"

function DepartmentStockContent() {
  const [stock, setStock] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [department, setDepartment] = useState<any>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    medicationId: "",
    quantity: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Get the department
      const deptResponse = await api.departments.getmydep()
      console.log("Department Response:", deptResponse)

      if (deptResponse && typeof deptResponse === "object" && !Array.isArray(deptResponse)) {
        setDepartment(deptResponse)

        // Get stock items for this department
        const stockResponse = await api.stockItems.findByDepartment(deptResponse.id)
        console.log("Stock Response:", stockResponse)

        let safeStock: any[] = []
        if (Array.isArray(stockResponse)) {
          safeStock = stockResponse
        } else if (stockResponse && Array.isArray(stockResponse.stocks)) {
          safeStock = stockResponse.stocks
        }

        setStock(safeStock)
      }

      // Get all medications
      const medsResponse = await api.medications.getAll()
      console.log("Medications Response:", medsResponse)

      let safeMeds: any[] = []
      if (Array.isArray(medsResponse)) {
        safeMeds = medsResponse
      }
      setMedications(safeMeds)
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar los datos",
        variant: "destructive",
      })
      setStock([])
      setMedications([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedication = async () => {
    if (!formData.medicationId || !department) {
      toast({
        title: "Error",
        description: "Por favor selecciona un medicamento",
        variant: "destructive",
      })
      return
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    try {
      await api.stockItems.create(department.id, {
        medicationId: formData.medicationId,
        quantity: formData.quantity,
      })

      toast({
        title: "Éxito",
        description: "Medicamento agregado al stock",
      })

      // Reload stock
      await loadData()
      setIsAddModalOpen(false)
      setFormData({ medicationId: "", quantity: 0 })
    } catch (error: any) {
      console.error("Error adding medication:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el medicamento",
        variant: "destructive",
      })
    }
  }

  const columns = [
    { 
      key: "medication.name", 
      label: "Medicamento",
      render: (item: any) => item.medication?.name || "N/A"
    },
    { 
      key: "medication.code", 
      label: "Código",
      render: (item: any) => item.medication?.code || "-"
    },
    { 
      key: "medication.unit", 
      label: "Unidad",
      render: (item: any) => item.medication?.unit || "unidad"
    },
    { key: "quantity", label: "Cantidad Disponible" },
    { key: "minQuantity", label: "Stock Mínimo" },
    {
      key: "status",
      label: "Estado",
      render: (item: any) => {
        const low = item.quantity <= (item.minQuantity || 0)
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              low
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {low ? "Bajo" : "Disponible"}
          </span>
        )
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pill className="h-7 w-7 text-accent" />
            <div>
              <h1 className="text-3xl font-bold">Stock del Departamento</h1>
              <p className="text-muted-foreground">
                Todos los medicamentos asignados a tu departamento
              </p>
            </div>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Medicamento
          </Button>
        </div>

        <div className="bg-card rounded-lg p-6">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Cargando stock...
            </p>
          ) : stock.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay medicamentos en el stock
            </p>
          ) : (
            <TableList
              data={stock}
              columns={columns}
              searchPlaceholder="Buscar medicamento..."
            />
          )}
        </div>
      </div>

      {/* ADD MEDICATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Agregar Medicamento</h2>

            <Select 
              value={formData.medicationId} 
              onValueChange={(value) => 
                setFormData({ ...formData, medicationId: value })
              }
            >
              <SelectTrigger className="mb-3">
                <SelectValue placeholder="Seleccionar medicamento" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med.id} value={med.id}>
                    {med.name} {med.code ? `(${med.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Cantidad"
              min="1"
              value={formData.quantity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              className="mb-3"
            />

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={handleAddMedication}
              >
                Agregar
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setFormData({ medicationId: "", quantity: 0 })
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function DepartmentStockPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <DepartmentStockContent />
    </ProtectedRoute>
  )
}