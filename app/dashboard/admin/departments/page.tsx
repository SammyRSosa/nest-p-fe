// 📁 page.tsx - VERSION MEJORADA
"use client"

import { useState, useEffect } from "react" // ✅ AGREGAR useEffect
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Plus, Eye, BarChart3, Package, Users, AlertTriangle } from "lucide-react"
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

  // ✅ AGREGAR useEffect PARA MANEJAR ERRORES
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])

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
      // ❌ EL TOAST DE ERROR YA SE MANEJA EN EL HOOK, NO ES NECESARIO DUPLICAR
    }
  }

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
    // ✅ PODRÍAS ABRIR UN MODAL DE EDICIÓN AQUÍ SI QUIERES
    console.log("Editando departamento:", department)
  }

  const handleDeleteDepartment = async (department: Department) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el departamento "${department.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDepartment(department.id)
        toast({
          title: "Departamento eliminado",
          description: "El departamento ha sido eliminado exitosamente.",
        })
      } catch (error) {
        console.error("Error deleting department:", error)
        // ❌ EL TOAST DE ERROR YA SE MANEJA EN EL HOOK
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
        criticalStock: 0,
        departmentsWithoutHeads: 0
      }
    }

    const totalDepartments = departments.length
    const activeDepartments = departments.filter(d => d.isActive).length
    const totalWorkers = departments.reduce((sum, d) => sum + (d.workers?.length || 0), 0)
    const criticalStock = departments.reduce((sum, d) => 
      sum + (d.medicationStock?.filter(m => m.status === 'critical').length || 0), 0
    )
    const departmentsWithoutHeads = departments.filter(d => !d.headOfDepartment).length

    return { totalDepartments, activeDepartments, totalWorkers, criticalStock, departmentsWithoutHeads }
  }

  const stats = getStats()

  const getTotalMedications = () => {
    if (!departments || !Array.isArray(departments)) return 0
    return departments.reduce((sum, d) => sum + (d.medicationStock?.length || 0), 0)
  }

  // ✅ MOSTRAR LOADING STATE
  if (loading && departments.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando departamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                <Users className="h-4 w-4 text-muted-foreground" />
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
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.criticalStock}</div>
                <p className="text-xs text-muted-foreground">
                  Medicamentos críticos
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
                  En inventario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sin Jefe</CardTitle>
                <Users className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.departmentsWithoutHeads}</div>
                <p className="text-xs text-muted-foreground">
                  Departamentos sin jefe
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
            
            {/* Placeholder for reports */}
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
        )}

        {/* View Dialog - ✅ CORREGIR REFERENCIAS A headOfDepartment */}
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
                          {selectedDepartment.headOfDepartment?.worker.name || "Sin jefe asignado"}
                        </p>
                        {selectedDepartment.headOfDepartment && (
                          <p className="text-xs text-muted-foreground">
                            {selectedDepartment.headOfDepartment.worker.role}
                          </p>
                        )}
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{worker.role}</span>
                              {selectedDepartment.headOfDepartment?.worker.id === worker.id && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                  Jefe
                                </span>
                              )}
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
                            <div className={`text-sm ${
                              medication.status === 'critical' ? 'text-red-600' :
                              medication.status === 'low' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {medication.status === 'critical' ? 'Crítico' : 
                               medication.status === 'low' ? 'Bajo' : 'Normal'}
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