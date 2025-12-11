"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"
import { Pill, Plus, AlertCircle, CheckCircle, Search, Package, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { motion } from "framer-motion"

interface StockItem {
  id: string
  medication?: {
    id: string
    name: string
    code?: string
    unit?: string
    description?: string
  }
  quantity: number
  minQuantity?: number
}

function DepartmentStockContent() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [department, setDepartment] = useState<any>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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

      const deptResponse = await api.departments.getmydep()
      if (deptResponse && typeof deptResponse === "object" && !Array.isArray(deptResponse)) {
        setDepartment(deptResponse)

        const stockResponse = await api.stockItems.findByDepartment(deptResponse.id)
        let safeStock: any[] = []
        if (Array.isArray(stockResponse)) {
          safeStock = stockResponse
        } else if (stockResponse && Array.isArray(stockResponse.stocks)) {
          safeStock = stockResponse.stocks
        }
        setStock(safeStock)
      }

      const medsResponse = await api.medications.getAll()
      let safeMeds: any[] = []
      if (Array.isArray(medsResponse)) {
        safeMeds = medsResponse
      }
      setMedications(safeMeds)
    } catch (error: any) {
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

      await loadData()
      setIsAddModalOpen(false)
      setFormData({ medicationId: "", quantity: 0 })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el medicamento",
        variant: "destructive",
      })
    }
  }

  const filtered = stock.filter((item) => {
    const matchesSearch = item.medication?.name
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||
      item.medication?.code?.toLowerCase().includes(search.toLowerCase())

    const isLow = item.quantity <= (item.minQuantity || 0)
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "low" ? isLow : !isLow

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: stock.length,
    available: stock.filter((s) => s.quantity > (s.minQuantity || 0)).length,
    lowStock: stock.filter((s) => s.quantity <= (s.minQuantity || 0)).length,
    totalQuantity: stock.reduce((sum, s) => sum + s.quantity, 0),
  }

  const getStockStatus = (item: StockItem) => {
    const isLow = item.quantity <= (item.minQuantity || 0)
    return isLow
      ? {
          label: "Stock Bajo",
          color: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          icon: AlertCircle,
          bgIcon: "bg-red-100",
          dotColor: "border-l-red-500",
        }
      : {
          label: "Disponible",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          icon: CheckCircle,
          bgIcon: "bg-green-100",
          dotColor: "border-l-green-500",
        }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Stock del Departamento
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona los medicamentos asignados a {department?.name || "tu departamento"}
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
            title="Total Medicamentos"
            value={stats.total}
            icon={Package}
            description="Tipos diferentes"
          />
          <StatCard
            title="Disponibles"
            value={stats.available}
            icon={CheckCircle}
            description="Stock normal"
          />
          <StatCard
            title="Stock Bajo"
            value={stats.lowStock}
            icon={AlertCircle}
            description="Requieren atención"
          />
          <StatCard
            title="Unidades Totales"
            value={stats.totalQuantity}
            icon={TrendingUp}
            description="Cantidad total"
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
                placeholder="Buscar por nombre o código..."
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
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="low">Stock Bajo</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Medicamento
            </Button>
          </div>
        </div>

        {/* Stock List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Medicamentos</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando stock...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  {search || statusFilter !== "all"
                    ? "No se encontraron medicamentos"
                    : "No hay medicamentos en el stock"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || statusFilter !== "all"
                    ? "Intenta ajustar los filtros"
                    : "Agrega medicamentos al stock"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, idx) => {
                const config = getStockStatus(item)
                const Icon = config.icon

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`border-l-4 ${config.dotColor} hover:shadow-lg transition-all duration-300 ${config.color}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left Section - Stock Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`h-10 w-10 rounded-lg ${config.bgIcon} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`h-5 w-5 ${config.textColor}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {item.medication?.name || "Medicamento"}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border inline-block mt-1`}
                                >
                                  {config.label}
                                </span>
                              </div>
                            </div>

                            {/* Stock Details Grid */}
                            <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Código
                                </p>
                                <p className="font-mono text-sm text-gray-700 mt-1">
                                  {item.medication?.code || "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Unidad
                                </p>
                                <p className="text-sm text-gray-700 font-semibold mt-1">
                                  {item.medication?.unit || "unidad"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Disponible
                                </p>
                                <p className="text-sm font-bold mt-1 text-accent">
                                  {item.quantity} {item.medication?.unit || "unidades"}
                                </p>
                              </div>
                            </div>

                            {/* Stock Level Bar */}
                            <div className={`p-3 rounded-lg border ${config.color}`}>
                              <div className="flex items-center justify-between mb-2">
                                <p className={`text-xs uppercase tracking-wide font-semibold ${config.textColor}`}>
                                  Nivel de Stock
                                </p>
                                {item.minQuantity && (
                                  <p className={`text-xs font-semibold ${config.textColor}`}>
                                    Mínimo: {item.minQuantity}
                                  </p>
                                )}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    item.quantity <= (item.minQuantity || 0)
                                      ? "bg-red-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      (item.quantity / ((item.minQuantity || 0) * 2)) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Description */}
                            {item.medication?.description && (
                              <p className="text-sm text-gray-600 mt-3">
                                {item.medication.description}
                              </p>
                            )}
                          </div>

                          {/* Right Section - Quantity Display */}
                          <div className="flex flex-col items-center justify-center flex-shrink-0 p-4 bg-accent/10 rounded-lg">
                            <p className="text-3xl font-bold text-accent">{item.quantity}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.medication?.unit || "unidades"}
                            </p>
                          </div>
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
              <span className="font-semibold text-accent">💊 Información:</span> Mantén un control regular del stock. Los medicamentos con stock bajo requieren atención inmediata para evitar desabastecimiento.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ADD MEDICATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="h-6 w-6" />
                Agregar Medicamento
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Añade un nuevo medicamento al stock del departamento
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Medicamento
                </label>
                <Select
                  value={formData.medicationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, medicationId: value })
                  }
                >
                  <SelectTrigger className="border-accent/20">
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
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Cantidad
                </label>
                <Input
                  type="number"
                  placeholder="Ingresa la cantidad"
                  min="1"
                  value={formData.quantity || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="border-accent/20"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setFormData({ medicationId: "", quantity: 0 })
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={handleAddMedication}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
          </Card>
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