// 📁 DepartmentTable.tsx - CORREGIR EL ERROR DE onUpdate
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
  UserCheck
} from "lucide-react"
import type { Department } from "@/types"
import { DepartmentForm } from "./DepartmentForm"
import { StaffAssignmentDialog } from "./StaffAssignmentDialog"

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

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department)
    setIsEditDialogOpen(true)
    onEdit?.(department)
  }

  const handleView = (department: Department) => {
    setSelectedDepartment(department)
    onView?.(department)
  }

  const handleStaffAssignment = (department: Department) => {
    setSelectedDepartment(department)
    setIsStaffDialogOpen(true)
  }

  const handleUpdate = () => {
    onUpdate?.() // ✅ USAR OPERADOR OPTIONAL CHAINING
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
              {departmentsToShow.map((department) => (
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
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>{department.headOfDepartment.worker.firstName}{" "}{department.headOfDepartment.worker.lastName}</span>
                        <Badge variant="outline" className="text-xs">
                          {department.headOfDepartment.worker.role}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Sin jefe asignado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{department.workers?.length || 0}</span>
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
                      {department.isActive ? "Activo" : "Activo"} //activo debe ser tipo bool 
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
              ))}
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
                handleUpdate() // ✅ USAR LA FUNCIÓN CORREGIDA
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
              onUpdate={handleUpdate} // ✅ USAR LA FUNCIÓN CORREGIDA
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}