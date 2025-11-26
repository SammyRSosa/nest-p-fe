"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Package } from "lucide-react"
import type { MedicationStock } from "@/types"
import { useMedicationStock } from "@/hooks/useMedicationStock"
import { toast } from "@/hooks/use-toast"

interface StockUpdateFormProps {
  medication: MedicationStock
  departmentId: string
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  newQuantity: number
  reason: string
  requiresApproval: boolean
  updateType: "addition" | "subtraction" | "adjustment"
}

export function StockUpdateForm({ medication, departmentId, onSuccess, onCancel }: StockUpdateFormProps) {
  const [loading, setLoading] = useState(false)
  const { updateStock } = useMedicationStock(departmentId)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      newQuantity: 0,
      reason: "",
      requiresApproval: false,
      updateType: "adjustment",
    },
  })

  const updateType = watch("updateType")
  const newQuantity = watch("newQuantity")
  const requiresApproval = watch("requiresApproval")

  const calculateFinalQuantity = () => {
    switch (updateType) {
      case "addition":
        return medication.currentQuantity + newQuantity
      case "subtraction":
        return Math.max(0, medication.currentQuantity - newQuantity)
      case "adjustment":
        return newQuantity
      default:
        return medication.currentQuantity
    }
  }

  const getNewStatus = (finalQuantity: number) => {
    if (finalQuantity <= medication.minQuantity) {
      return finalQuantity <= medication.minQuantity * 0.5 ? "critical" : "low"
    }
    if (finalQuantity >= medication.maxQuantity) {
      return "excess"
    }
    return "normal"
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const finalQuantity = calculateFinalQuantity()
      
      await updateStock({
        medicationId: medication.medicationId,
        newQuantity: finalQuantity,
        reason: data.reason,
        requiresApproval: data.requiresApproval,
      })

      toast({
        title: "Stock actualizado",
        description: data.requiresApproval 
          ? "La actualización del stock ha sido enviada para aprobación."
          : "El stock ha sido actualizado exitosamente.",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el stock",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const finalQuantity = calculateFinalQuantity()
  const newStatus = getNewStatus(finalQuantity)
  const quantityChange = finalQuantity - medication.currentQuantity

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
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Estado Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad Actual</Label>
              <div className="text-2xl font-bold">
                {medication.currentQuantity} {medication.unit}
              </div>
            </div>
            <div>
              <Label>Estado Actual</Label>
              <div className="mt-2">
                {getStatusBadge(medication.status)}
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Rango: {medication.minQuantity} - {medication.maxQuantity} {medication.unit}
          </div>
        </CardContent>
      </Card>

      {/* Update Type */}
      <div className="space-y-2">
        <Label>Tipo de Actualización</Label>
        <Select 
          value={updateType} 
          onValueChange={(value: "addition" | "subtraction" | "adjustment") => 
            setValue("updateType", value)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="addition">Adición (+)</SelectItem>
            <SelectItem value="subtraction">Sustracción (-)</SelectItem>
            <SelectItem value="adjustment">Ajuste Directo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quantity Input */}
      <div className="space-y-2">
        <Label>
          {updateType === "addition" && "Cantidad a Agregar"}
          {updateType === "subtraction" && "Cantidad a Quitar"}
          {updateType === "adjustment" && "Nueva Cantidad"}
        </Label>
        <Input
          type="number"
          {...register("newQuantity", { 
            required: "Este campo es requerido",
            min: updateType === "adjustment" ? 0 : 1,
            max: updateType === "subtraction" ? medication.currentQuantity : undefined
          })}
          placeholder={updateType === "adjustment" ? "Ej: 50" : "Ej: 10"}
        />
        {errors.newQuantity && (
          <p className="text-sm text-red-500">{errors.newQuantity.message}</p>
        )}
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad Final</Label>
              <div className="text-2xl font-bold">
                {finalQuantity} {medication.unit}
              </div>
              <div className={`text-sm ${quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {quantityChange >= 0 ? '+' : ''}{quantityChange} {medication.unit}
              </div>
            </div>
            <div>
              <Label>Nuevo Estado</Label>
              <div className="mt-2">
                {getStatusBadge(newStatus)}
              </div>
            </div>
          </div>
          
          {(newStatus === 'critical' || newStatus === 'low') && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {newStatus === 'critical' 
                  ? "⚠️ ¡Alerta Crítica! El stock estará por debajo del nivel mínimo crítico."
                  : "⚠️ ¡Alerta! El stock estará por debajo del nivel mínimo."
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">Motivo de la Actualización *</Label>
        <Textarea
          id="reason"
          {...register("reason", { required: "Este campo es requerido" })}
          placeholder="Describe el motivo de esta actualización de stock..."
          rows={3}
        />
        {errors.reason && (
          <p className="text-sm text-red-500">{errors.reason.message}</p>
        )}
      </div>

      {/* Approval Requirement */}
      <div className="flex items-center space-x-2">
        <Switch
          id="requiresApproval"
          checked={requiresApproval}
          onCheckedChange={(checked) => setValue("requiresApproval", checked)}
        />
        <Label htmlFor="requiresApproval">
          Requiere aprobación de la dirección
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar Stock"}
        </Button>
      </div>
    </form>
  )
}