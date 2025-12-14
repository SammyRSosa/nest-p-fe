"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Package, Plus, Search, Edit2, Trash2, Eye, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { UserRole } from "@/types"
import { api } from "@/lib/api"

interface Medication {
  id: string
  name: string
  code?: string
  description?: string
  unit?: string
  createdAt?: Date
}

function MedicationsPageContent() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    unit: "",
  })

  // Fetch medications
  const fetchMedications = async () => {
    try {
      setLoading(true)
      const data = await api.medications.getAll()
      setMedications(data)
      setFilteredMedications(data)
    } catch (error) {
      console.error("Error fetching medications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los medicamentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedications()
  }, [])

  // Search medications
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMedications(medications)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = medications.filter((med) =>
      med.name.toLowerCase().includes(query) ||
      med.code?.toLowerCase().includes(query) ||
      med.description?.toLowerCase().includes(query)
    )
    setFilteredMedications(filtered)
  }, [searchQuery, medications])

  // Create medication
  const handleCreateMedication = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del medicamento es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      await api.medications.create(formData)

      toast({
        title: "Éxito",
        description: "Medicamento creado correctamente",
      })
      setFormData({ name: "", code: "", description: "", unit: "" })
      setIsCreateDialogOpen(false)
      fetchMedications()
    } catch (error: any) {
      console.error("Error creating medication:", error)
      toast({
        title: "Error",
        description: error.message || "Error al crear el medicamento",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Update medication
  const handleUpdateMedication = async () => {
    if (!selectedMedication || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del medicamento es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      await api.medications.update(selectedMedication.id, formData)

      toast({
        title: "Éxito",
        description: "Medicamento actualizado correctamente",
      })
      setFormData({ name: "", code: "", description: "", unit: "" })
      setIsEditDialogOpen(false)
      setSelectedMedication(null)
      fetchMedications()
    } catch (error: any) {
      console.error("Error updating medication:", error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el medicamento",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete medication
  const handleDeleteMedication = async (medication: Medication) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${medication.name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await api.medications.delete(medication.id)

      toast({
        title: "Éxito",
        description: "Medicamento eliminado correctamente",
      })
      fetchMedications()
    } catch (error: any) {
      console.error("Error deleting medication:", error)
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el medicamento",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (medication: Medication) => {
    setSelectedMedication(medication)
    setFormData({
      name: medication.name,
      code: medication.code || "",
      description: medication.description || "",
      unit: medication.unit || "",
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (medication: Medication) => {
    setSelectedMedication(medication)
    setIsViewDialogOpen(true)
  }

  const openCreateDialog = () => {
    setFormData({ name: "", code: "", description: "", unit: "" })
    setSelectedMedication(null)
    setIsCreateDialogOpen(true)
  }

  const getStats = () => {
    return {
      total: medications.length,
      withCode: medications.filter(m => m.code).length,
      withUnit: medications.filter(m => m.unit).length,
      withDescription: medications.filter(m => m.description).length,
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando medicamentos...</p>
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
            <h1 className="text-3xl font-bold">Gestión de Medicamentos</h1>
            <p className="text-muted-foreground">
              Administra el catálogo de medicamentos disponibles en el policlínico
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Medicamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Medicamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    placeholder="Ej: Paracetamol"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <Input
                    placeholder="Ej: PAR-001"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unidad de Medida</label>
                  <Input
                    placeholder="Ej: mg, ml, comprimidos"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Descripción adicional del medicamento"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMedication} disabled={isSaving}>
                    {isSaving ? "Creando..." : "Crear Medicamento"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medicamentos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                En el catálogo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Código</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withCode}</div>
              <p className="text-xs text-muted-foreground">
                Medicamentos catalogados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Unidad</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withUnit}</div>
              <p className="text-xs text-muted-foreground">
                Con unidad definida
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withDescription}</div>
              <p className="text-xs text-muted-foreground">
                Con descripción
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Medications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Medicamentos ({filteredMedications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMedications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {medications.length === 0
                    ? "Sin medicamentos"
                    : "Sin resultados"}
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {medications.length === 0
                    ? "No hay medicamentos en el catálogo. Comienza agregando uno."
                    : "No se encontraron medicamentos que coincidan con tu búsqueda."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium">Código</th>
                      <th className="text-left py-3 px-4 font-medium">Unidad</th>
                      <th className="text-left py-3 px-4 font-medium">Descripción</th>
                      <th className="text-right py-3 px-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedications.map((medication) => (
                      <tr key={medication.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{medication.name}</td>
                        <td className="py-3 px-4">
                          {medication.code ? (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {medication.code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {medication.unit || (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {medication.description ? (
                            <span className="line-clamp-1">{medication.description}</span>
                          ) : (
                            <span className="text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewDialog(medication)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(medication)}
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMedication(medication)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Medicamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Paracetamol"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Código</label>
                <Input
                  placeholder="Ej: PAR-001"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Unidad de Medida</label>
                <Input
                  placeholder="Ej: mg, ml, comprimidos"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <textarea
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Descripción adicional del medicamento"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateMedication} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedMedication?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedMedication && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nombre</p>
                        <p className="font-medium">{selectedMedication.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Código</p>
                        <p className="font-medium">
                          {selectedMedication.code || "Sin código"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unidad de Medida</p>
                        <p className="font-medium">
                          {selectedMedication.unit || "No especificada"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Creado</p>
                        <p className="font-medium">
                          {selectedMedication.createdAt
                            ? new Date(selectedMedication.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    {selectedMedication.description && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Descripción</p>
                        <p className="font-medium">{selectedMedication.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      openEditDialog(selectedMedication)
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function MedicationsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <MedicationsPageContent />
    </ProtectedRoute>
  )
}