"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"
import { Trash2, ShoppingCart } from "lucide-react"

export default function CreateMedicationOrderPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <CreateMedicationOrderContent />
    </ProtectedRoute>
  )
}

function CreateMedicationOrderContent() {
  const router = useRouter()
  const { toast } = useToast()

  const [department, setDepartment] = useState<any>(null)
  const [stockItems, setStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStockItem, setSelectedStockItem] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [items, setItems] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Get department (head's department)
      const dept = await api.departments.getmydep()
      
      if (dept && typeof dept === "object" && !Array.isArray(dept)) {
        setDepartment(dept)

        // Get stock items for this department
        const stock = await api.stockItems.findByDepartment(dept.id)
        
        let safeStock: any[] = []
        if (Array.isArray(stock)) {
          safeStock = stock
        } else if (stock && Array.isArray(stock.stocks)) {
          safeStock = stock.stocks
        }
        
        setStockItems(safeStock)
      }
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: error.message || "Error cargando datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    if (!selectedStockItem) {
      return toast({
        title: "Error",
        description: "Selecciona un producto",
        variant: "destructive",
      })
    }

    if (quantity <= 0) {
      return toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      })
    }

    const stockItem = stockItems.find((s) => s.id === selectedStockItem)

    if (!stockItem) {
      return toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive",
      })
    }

    // Check if exceeds available quantity
    if (quantity > stockItem.quantity) {
      return toast({
        title: "Error",
        description: `No hay suficiente stock. Disponible: ${stockItem.quantity}`,
        variant: "destructive",
      })
    }

    // Evitar duplicados
    if (items.some((i) => i.stockItemId === selectedStockItem)) {
      return toast({
        title: "Item duplicado",
        description: "Este producto ya está agregado a la orden",
        variant: "destructive",
      })
    }

    setItems([
      ...items,
      {
        stockItemId: selectedStockItem,
        medicationName: stockItem.medication?.name || "N/A",
        medicationCode: stockItem.medication?.code || "-",
        quantity,
        availableQuantity: stockItem.quantity,
      },
    ])

    // Reset form
    setSelectedStockItem("")
    setQuantity(1)
  }

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.stockItemId !== id))
  }

  const saveOrder = async () => {
    if (items.length === 0) {
      return toast({
        title: "Error",
        description: "Debes agregar al menos un item a la orden",
        variant: "destructive",
      })
    }

    if (!department) {
      return toast({
        title: "Error",
        description: "Departamento no encontrado",
        variant: "destructive",
      })
    }

    try {
      setIsSaving(true)

      // Transform items to match API expectations
      const orderItems = items.map((item) => ({
        stockItemId: item.stockItemId,
        quantity: item.quantity,
      }))

      await api.medicationOrders.create({
        departmentId: department.id,
        items: orderItems,
      })

      toast({
        title: "Éxito",
        description: "La orden ha sido creada exitosamente",
      })

      router.push("/dashboard/head/medication-orders")
    } catch (error: any) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Nueva Orden de Medicamentos</h1>
            <p className="text-muted-foreground">
              Crea una nueva orden de reposición de stock
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando datos...</p>
        ) : (
          <>
            {/* Department Info (Read-only) */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Información de la Orden</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                  <p className="text-lg font-semibold">{department?.name || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Add Item Section */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Agregar Medicamentos</h2>

              <div className="space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="text-sm font-medium block mb-2">Producto</label>
                  <Select value={selectedStockItem} onValueChange={setSelectedStockItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un medicamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-2">
                          No hay medicamentos disponibles
                        </div>
                      ) : (
                        stockItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.medication?.name || "N/A"} ({item.medication?.code || "-"}) - Stock: {item.quantity}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium block mb-2">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    placeholder="Ingresa la cantidad"
                  />
                </div>

                <Button 
                  onClick={addItem}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  Agregar Item
                </Button>
              </div>
            </div>

            {/* Items Summary */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Items de la Orden</h2>

              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay items agregados. Agrega medicamentos arriba.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.stockItemId}
                      className="flex items-center justify-between border border-secondary rounded-lg p-4 hover:bg-secondary/30 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.medicationName}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-2">
                          <div>
                            <p className="text-xs uppercase">Código</p>
                            <p>{item.medicationCode}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase">Cantidad Solicitada</p>
                            <p className="font-semibold text-foreground">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase">Stock Disponible</p>
                            <p className="font-semibold text-foreground">{item.availableQuantity}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.stockItemId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total de Items:</span>
                      <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={saveOrder}
                disabled={items.length === 0 || isSaving}
              >
                {isSaving ? "Guardando..." : "Crear Orden"}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}