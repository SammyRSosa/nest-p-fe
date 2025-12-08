"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // ✅ Importar useRouter
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Pill, Package, Clock, CheckCircle, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/types"

function MedicationOrdersContent() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter() // ✅ Inicializar router

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await api.medicationOrders.getAll()
      setOrders(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las órdenes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = () => {
    // ✅ CORRECTO: Usar router directamente, no dentro de toast
    router.push("/dashboard/head/medication-orders/create")
  }

  const handleRespondOrder = async (orderId: string, accept: boolean) => {
    try {
      await api.medicationOrders.respond(orderId, { accept })
      toast({
        title: accept ? "Orden aceptada" : "Orden rechazada",
        description: `La orden ha sido ${accept ? 'aceptada' : 'rechazada'} exitosamente`,
      })
      loadOrders()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la orden",
        variant: "destructive",
      })
    }
  }

  // ... (el resto de tu código se mantiene igual)
  const columns = [
    { key: "department.name", label: "Departamento" },
    { key: "head.user.firstName", label: "Solicitado por" },
    { 
      key: "items", 
      label: "Items", 
      render: (order: any) => (
        <span>{order.items.length} items</span>
      )
    },
    { 
      key: "status", 
      label: "Estado",
      render: (order: any) => {
        const statusConfig = {
          pending: { class: "bg-yellow-100 text-yellow-800", text: "Pendiente" },
          accepted: { class: "bg-green-100 text-green-800", text: "Aceptada" },
          denied: { class: "bg-red-100 text-red-800", text: "Rechazada" }
        }
        
        const status = order.status as keyof typeof statusConfig
        const config = statusConfig[status] || statusConfig.pending
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
            {config.text}
          </span>
        )
      },
    },
    { key: "requestedAt", label: "Fecha Solicitud" },
    {
      key: "actions",
      label: "Acciones",
      render: (order: any) => (
        <div className="flex gap-2">
          {/* {order.status === "pending" && (
            <>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => handleRespondOrder(order.id, true)}
              >
                Aceptar
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleRespondOrder(order.id, false)}
              >
                Rechazar
              </Button>
            </>
          )} */}
          <Button variant="outline" size="sm">
            Ver
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Órdenes de Medicamentos</h1>
            <p className="text-muted-foreground">Gestión de órdenes de medicamentos del departamento</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90" onClick={handleCreateOrder}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Órdenes" 
            value={orders.length} 
            icon={Pill} 
            description="Este mes" 
          />
          <StatCard
            title="Pendientes"
            value={orders.filter((o: any) => o.status === "pending").length}
            icon={Clock}
            description="Por aprobar"
          />
          <StatCard 
            title="Aceptadas" 
            value={orders.filter((o: any) => o.status === "accepted").length} 
            icon={CheckCircle} 
            description="Este mes" 
          />
          <StatCard 
            title="Rechazadas" 
            value={orders.filter((o: any) => o.status === "denied").length} 
            icon={Package} 
            description="Este mes" 
          />
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Órdenes</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando órdenes...</p>
          ) : (
            <TableList 
              data={orders} 
              columns={columns} 
              searchPlaceholder="Buscar órdenes..." 
            />
          )}
        </div>
      </div>
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