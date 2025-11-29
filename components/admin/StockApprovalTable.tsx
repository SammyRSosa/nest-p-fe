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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  AlertTriangle,
  Package
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStockApprovals } from "@/hooks/useMedicationStock"
import type { MedicationStock } from "@/types"
import { toast } from "@/hooks/use-toast"

interface StockApprovalTableProps {
  onUpdate?: () => void
}

export function StockApprovalTable({ onUpdate }: StockApprovalTableProps) {
  const [selectedStock, setSelectedStock] = useState<MedicationStock | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const { pendingApprovals, loading: approvalsLoading, approveStockUpdate } = useStockApprovals()

  const handleApprove = (stock: MedicationStock, approved: boolean) => {
    setSelectedStock(stock)
    setIsApprovalDialogOpen(true)
    setApprovalNotes("")
  }

  const confirmApproval = async (approved: boolean) => {
    if (!selectedStock) return

    setLoading(true)
    try {
      await approveStockUpdate(selectedStock.id, {
        approved,
        notes: approvalNotes,
      })

      toast({
        title: approved ? "Actualización Aprobada" : "Actualización Rechazada",
        description: `La actualización del stock ha sido ${approved ? 'aprobada' : 'rechazada'} exitosamente.`,
      })

      setIsApprovalDialogOpen(false)
      setSelectedStock(null)
      setApprovalNotes("")
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la aprobación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyBadge = (stock: MedicationStock) => {
    if (stock.status === 'critical') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Urgente
        </Badge>
      )
    }
    if (stock.status === 'low') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Prioridad Alta
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        Normal
      </Badge>
    )
  }

  const getDaysSinceUpdate = (lastUpdated: string) => {
    const now = new Date()
    const updated = new Date(lastUpdated)
    const diffTime = Math.abs(now.getTime() - updated.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (pendingApprovals.length === 0 && !approvalsLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin Aprobaciones Pendientes</h3>
          <p className="text-muted-foreground text-center max-w-md">
            No hay actualizaciones de stock pendientes de aprobación en este momento.
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
            <Clock className="h-5 w-5" />
            Aprobaciones Pendientes ({pendingApprovals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvalsLoading ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando aprobaciones pendientes...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cantidad Actual</TableHead>
                  <TableHead>Actualización Solicitada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Días Esperando</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stock.medicationName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {stock.medicationId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stock.departmentId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Actual: {stock.currentQuantity} {stock.unit}</div>
                        <div className="text-muted-foreground">
                          Rango: {stock.minQuantity}-{stock.maxQuantity} {stock.unit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Nueva: {stock.currentQuantity} {stock.unit}</div>
                        <div className="text-muted-foreground">
                          Por: {stock.updatedBy}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stock.status === 'critical' ? 'destructive' : 'secondary'}>
                        {stock.status === 'critical' ? 'Crítico' : stock.status === 'low' ? 'Bajo' : 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getDaysSinceUpdate(stock.lastUpdated)} días
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(stock)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleApprove(stock, true)}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprobar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleApprove(stock, false)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStock ? (
                <span>
                  {selectedStock.status === 'critical' ? 'Aprobar Actualización Urgente' : 'Aprobar Actualización de Stock'}
                </span>
              ) : (
                'Confirmar Aprobación'
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-4">
              {/* Stock Information */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Medicamento:</span>
                      <span className="font-medium">{selectedStock.medicationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cantidad Actual:</span>
                      <span className="font-medium">{selectedStock.currentQuantity} {selectedStock.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Estado:</span>
                      <Badge variant={selectedStock.status === 'critical' ? 'destructive' : 'secondary'}>
                        {selectedStock.status === 'critical' ? 'Crítico' : selectedStock.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Agrega notas sobre esta aprobación..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsApprovalDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => confirmApproval(false)}
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Rechazar"}
                </Button>
                <Button 
                  onClick={() => confirmApproval(true)}
                  disabled={loading}
                >
                  {loading ? "Procesando..." : "Aprobar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}