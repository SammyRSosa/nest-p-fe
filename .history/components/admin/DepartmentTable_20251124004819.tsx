// 📁 DepartmentTable.tsx - VERSIÓN CORREGIDA
"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  UserCheck,
  Crown
} from "lucide-react"
import type { Department } from "@/types"
import { DepartmentForm } from "./DepartmentForm"
import { StaffAssignmentDialog } from "./StaffAssignmentDialog"
import { DepartmentDetails } from "./DepartmentDetails" // ← NUEVO COMPONENTE

interface DepartmentTableProps {
  departments: Department[]
  onEdit?: (department: Department) => void
  onDelete?: (department: Department) => void
  onView?: (department: Department) => void
  onUpdate?: () => void
}

export function DepartmentTable({ 
  departments = [],
  onEdit, 
  onDelete, 
  onView,
  onUpdate 
}: DepartmentTableProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false) // ← NUEVO ESTADO

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department)
    setIsEditDialogOpen(true)
    onEdit?.(department)
  }

  const handleView = (department: Department) => {
    setSelectedDepartment(department)
    setIsDetailsDialogOpen(true) // ← ABRIR DIÁLOGO DE DETALLES
    onView?.(department)
  }

  const handleStaffAssignment = (department: Department) => {
    setSelectedDepartment(department)
    setIsStaffDialogOpen(true)
  }

  const handleUpdate = () => {
    onUpdate?.()
  }

  const getStockStatusBadge = (department: Department) => {
    const medicationStock = department.medicationStock || []
    const criticalStock = medicationStock.filter(item => item.status === 'critical').length
    const lowStock = medicationStock.filter(item => item.status === 'low').length
    
    if (criticalStock > 0) {
      return <Badge variant="destructive">{criticalStock} Crítico</Badge>
    }
    if (lowStock > 0) {
      return <Badge variant="secondary">{lowStock} Bajo</Badge>
    }
    return <Badge variant="default">Normal</Badge>
  }

  // ✅ NUEVA FUNCIÓN - Contar trabajadores asignados correctamente
  const getAssignedWorkersCount = (department: Department) => {
    if (department.workers && department.workers.length > 0) {
      return department.workers.length;
    }
    
    // Si no viene en workers, buscar en otra propiedad
    if (department.workers) {
      return department.workers.filter((wd: any) => wd.active !== false).length;
    }
    
    return 0;
  }

  // ✅ NUEVA FUNCIÓN - Obtener nombre del jefe
  const getHeadOfDepartmentName = (department: Department) => {
    if (!department.headOfDepartment) {
      return "Jefe no asignado";
    }
    
    const worker = department.headOfDepartment.worker;
    if (worker.firstName && worker.lastName) {
      return `${worker.firstName} ${worker.lastName}`;
    }
    
    return worker.name || "Nombre no disponible";
  }

  const departmentsToShow = departments || []

  if (departmentsToShow.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay departamentos</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No se han creado departamentos aún. Comienza creando el primer departamento para gestionar el personal y medicamentos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departamentos ({departmentsToShow.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Jefe</TableHead>
                <TableHead>Personal</TableHead>
                <TableHead>Medicamentos</TableHead>
                <TableHead>Estado Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentsToShow.map((department) => {
                const workersCount = getAssignedWorkersCount(department);
                const headName = getHeadOfDepartmentName(department);
                
                return (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{department.name}</div>
                        {department.description && (
                          <div className="text-sm text-muted-foreground">
                            {department.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {department.headOfDepartment ? (
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          <div className="flex flex-col">
                            <span className="font-medium">{headName}</span>
                            <Badge variant="outline" className="text-xs w-fit">
                              {department.headOfDepartment.worker.role}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <UserCheck className="h-4 w-4" />
                          <span>Jefe no asignado</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{workersCount} asignados</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{department.medicationStock?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStockStatusBadge(department)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={department.isActive ? "default" : "secondary"}>
                        {department.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(department)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(department)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStaffAssignment(department)}>
                            <Users className="h-4 w-4 mr-2" />
                            Gestionar personal
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete?.(department)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Departamento</DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <DepartmentForm
              department={selectedDepartment}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                handleUpdate()
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Staff Assignment Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Personal - {selectedDepartment?.name}</DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <StaffAssignmentDialog
              department={selectedDepartment}
              onClose={() => setIsStaffDialogOpen(false)}
              onUpdate={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ NUEVO: Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Detalles del Departamento: {selectedDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <DepartmentDetails 
              department={selectedDepartment}
              onClose={() => setIsDetailsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}