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
  const [head, setHead] = useState<any>(null)

  const [stockItems, setStockItems] = useState<any[]>([])
  const [selectedStockItem, setSelectedStockItem] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const profile = await api.auth.getProfile()

      setDepartment(profile.department)
      setHead(profile.worker) // ← worker = jefe del departamento

      const stock = await api.stockItems.getAll()
      setStockItems(stock)

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error cargando datos",
        variant: "destructive",
      })
    }
  }

  const addItem = () => {
    if (!selectedStockItem || quantity <= 0) {
      return toast({
        title: "Error",
        description: "Selecciona un ítem y una cantidad válida",
        variant: "destructive",
      })
    }

    const stockItem = stockItems.find((s) => s.id === selectedStockItem)

    if (!stockItem) return

    // evitar duplicados
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
        stockItemName: stockItem.name,
        quantity,
      },
    ])
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

    try {
      await api.medicationOrders.create({
        departmentId: department.id,
        headId: head.id, // ← worker = jefe actual
        items,
      })

      toast({
        title: "Orden creada",
        description: "La orden ha sido registrada exitosamente",
      })

      router.push("/dashboard/head/medication-orders")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Nueva Orden de Medicamentos</h1>

        {/* Datos del departamento (solo lectura) */}
        <div>
          <label className="font-medium">Departamento</label>
          <Input value={department?.name || ""} disabled />
        </div>

        {/* Datos del jefe (solo lectura) */}
        <div>
          <label className="font-medium">Jefe de Departamento</label>
          <Input 
            value={
              head 
                ? `${head.firstName} ${head.lastName}` 
                : ""
            } 
            disabled 
          />
        </div>

        {/* Selector de producto */}
        <div>
          <label className="font-medium">Producto</label>
          <Select onValueChange={setSelectedStockItem}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un producto" />
            </SelectTrigger>
            <SelectContent>
              {stockItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} (Stock: {item.quantity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="font-medium">Cantidad</label>
          <Input 
            type="number" 
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <Button onClick={addItem} className="w-full">
          Agregar Item
        </Button>

        {/* Lista de items */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Items agregados</h2>

          {items.length === 0 ? (
            <p className="text-muted-foreground">No hay items agregados.</p>
          ) : (
            items.map((item) => (
              <div key={item.stockItemId} className="flex justify-between items-center border p-3 rounded-lg">
                <div>
                  <p className="font-medium">{item.stockItemName}</p>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {item.quantity}
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeItem(item.stockItemId)}
                >
                  Quitar
                </Button>
              </div>
            ))
          )}
        </div>

        <Button
          className="w-full bg-accent hover:bg-accent/80"
          onClick={saveOrder}
        >
          Guardar Orden
        </Button>
      </div>
    </DashboardLayout>
  )
}
