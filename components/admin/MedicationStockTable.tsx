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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Package,
  MoreHorizontal,
  Edit,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import type { MedicationStock } from "@/types"
import { StockUpdateForm } from "./StockUpdateForm"

interface MedicationStockTableProps {
  stock: MedicationStock[]
  onUpdate?: () => void
  departmentId: string
}

export function MedicationStockTable({ stock, onUpdate, departmentId }: MedicationStockTableProps) {
  const [selectedMedication, setSelectedMedication] = useState<MedicationStock | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'excess':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      normal: "default",
      low: "secondary",
      critical: "destructive",
      excess: "outline",
    }
    
    const labels: Record<string, string> = {
      normal: "Normal",
      low: "Bajo",
      critical: "Crítico",
      excess: "Exceso",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    )
  }

  const getStockPercentage = (current: number, max: number) => {
    if (max === 0) return 0
    return Math.min((current / max) * 100, 100)
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500'
      case 'low':
        return 'bg-yellow-500'
      case 'normal':
        return 'bg-green-500'
      case 'excess':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleUpdate = (medication: MedicationStock) => {
    setSelectedMedication(medication)
    setIsUpdateDialogOpen(true)
  }

  if (stock.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay medicamentos</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No se han agregado medicamentos al stock de este departamento. Agrega medicamentos para comenzar a gestionar el inventario.
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
            <Package className="h-5 w-5" />
            Stock de Medicamentos ({stock.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Cantidad Actual</TableHead>
                <TableHead>Rango (Min-Max)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead>Aprobación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.medicationName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {item.medicationId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.currentQuantity}</span>
                        <span className="text-sm text-muted-foreground">{item.unit}</span>
                      </div>
                      <Progress 
                        value={getStockPercentage(item.currentQuantity, item.maxQuantity)}
                        className="w-full h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Mín: {item.minQuantity} {item.unit}</div>
                      <div>Máx: {item.maxQuantity} {item.unit}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(item.lastUpdated).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        Por: {item.updatedBy}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={item.isApproved ? "default" : "secondary"}>
                        {item.isApproved ? "Aprobado" : "Pendiente"}
                      </Badge>
                      {item.approvedAt && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdate(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Actualizar Stock
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

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar Stock - {selectedMedication?.medicationName}</DialogTitle>
          </DialogHeader>
          {selectedMedication && (
            <StockUpdateForm
              medication={selectedMedication}
              departmentId={departmentId}
              onSuccess={() => {
                setIsUpdateDialogOpen(false)
                onUpdate?.()
              }}
              onCancel={() => setIsUpdateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}