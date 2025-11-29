"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Plus, Eye, BarChart3, Package } from "lucide-react"
import { DepartmentTable } from "@/components/admin/DepartmentTable"
import { DepartmentForm } from "@/components/admin/DepartmentForm"
import { useDepartments } from "@/hooks/useDepartments"
import type { Department } from "@/types"
import { toast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { UserRole } from "@/types"

function DepartmentsPageContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"list" | "reports">("list")

  const { departments, loading, error, fetchDepartments, createDepartment, updateDepartment, deleteDepartment } = useDepartments()

  const handleCreateDepartment = async (data: any) => {
    try {
      await createDepartment(data)
      setIsCreateDialogOpen(false)
      toast({
        title: "Departamento creado",
        description: "El departamento ha sido creado exitosamente.",
      })
    } catch (error) {
      console.error("Error creating department:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el departamento",
        variant: "destructive",
      })
    }
  }

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
  }

  const handleDeleteDepartment = async (department: Department) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el departamento "${department.name}"?`)) {
      try {
        await deleteDepartment(department.id)
        toast({
          title: "Departamento eliminado",
          description: "El departamento ha sido eliminado exitosamente.",
        })
      } catch (error) {
        console.error("Error deleting department:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el departamento",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setIsViewDialogOpen(true)
  }

  const getStats = () => {
    if (!departments || !Array.isArray(departments)) {
      return {
        totalDepartments: 0,
        activeDepartments: 0, 
        totalWorkers: 0,
        criticalStock: 0
      }
    }

    const totalDepartments = departments.length
    const activeDepartments = departments.filter(d => d.isActive).length
    const totalWorkers = departments.reduce((sum, d) => sum + (d.workers?.length || 0), 0)
    const criticalStock = departments.reduce((sum, d) => 
      sum + (d.medicationStock?.filter(m => m.status === 'critical').length || 0), 0
    )

    return { totalDepartments, activeDepartments, totalWorkers, criticalStock }
  }

  const stats = getStats()

  const getTotalMedications = () => {
    if (!departments || !Array.isArray(departments)) return 0
    return departments.reduce((sum, d) => sum + (d.medicationStock?.length || 0), 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Departamentos</h1>
            <p className="text-muted-foreground">
              Administra los departamentos del policlínico, personal y stock de medicamentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "reports" ? "default" : "outline"}
              onClick={() => setActiveTab("reports")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reportes
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Departamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Departamento</DialogTitle>
                </DialogHeader>
                <DepartmentForm
                  onSuccess={() => {
                    setIsCreateDialogOpen(false)
                    fetchDepartments()
                  }}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {activeTab === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Departamentos</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDepartments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeDepartments} activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personal Total</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalWorkers}</div>
                <p className="text-xs text-muted-foreground">
                  Trabajadores asignados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.criticalStock}</div>
                <p className="text-xs text-muted-foreground">
                  Medicamentos necesitan reposición
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Medicamentos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getTotalMedications()}
                </div>
                <p className="text-xs text-muted-foreground">
                  En todos los departamentos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {activeTab === "list" ? (
          <DepartmentTable
            departments={departments || []} 
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
            onView={handleViewDepartment}
            onUpdate={fetchDepartments}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Reportes de Consumo de Medicamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Genera reportes detallados del consumo de medicamentos por departamento y período.
                </p>
              </CardContent>
            </Card>
            
            {/* Import the ConsumptionReportView component */}
            <div className="mt-6">
              {/* Placeholder for consumption reports - this would be implemented with the actual component */}
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Reportes de Consumo</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Aquí se mostrarán los reportes de consumo de medicamentos por departamento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Detalles del Departamento - {selectedDepartment?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedDepartment && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-medium">{selectedDepartment.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="font-medium">
                          {selectedDepartment.isActive ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Jefe</p>
                        <p className="font-medium">
                          {selectedDepartment.head?.name || "Sin jefe asignado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Personal</p>
                        <p className="font-medium">{selectedDepartment.workers?.length || 0} trabajadores</p>
                      </div>
                    </div>
                    {selectedDepartment.description && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Descripción</p>
                        <p className="font-medium">{selectedDepartment.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Staff List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Asignado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedDepartment.workers || selectedDepartment.workers.length === 0 ? (
                      <p className="text-muted-foreground">No hay personal asignado</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDepartment.workers.map((worker) => (
                          <div key={worker.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{worker.name}</p>
                              <p className="text-sm text-muted-foreground">{worker.email}</p>
                            </div>
                            <div className="text-sm">
                              {worker.role}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medication Stock */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stock de Medicamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedDepartment.medicationStock || selectedDepartment.medicationStock.length === 0 ? (
                      <p className="text-muted-foreground">No hay medicamentos en stock</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDepartment.medicationStock.map((medication) => (
                          <div key={medication.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{medication.medicationName}</p>
                              <p className="text-sm text-muted-foreground">
                                {medication.currentQuantity} / {medication.maxQuantity} {medication.unit}
                              </p>
                            </div>
                            <div className="text-sm">
                              Estado: {medication.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function DepartmentsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT]}>
      <DepartmentsPageContent />
    </ProtectedRoute>
  )
}