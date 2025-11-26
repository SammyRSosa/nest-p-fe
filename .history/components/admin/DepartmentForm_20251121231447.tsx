"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Package } from "lucide-react";
import { api } from "@/lib/api";
import type {
  Department,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  MedicationStockRequest,
  User,
} from "@/types";
import { toast } from "@/hooks/use-toast";

interface DepartmentFormProps {
  department?: Department;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  headId: string;
  isActive: boolean;
}

export function DepartmentForm({
  department,
  onSuccess,
  onCancel,
}: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [medications, setMedications] = useState<MedicationStockRequest[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: department?.name || "",
      description: department?.description || "",
      headId: department?.headId || "",
      isActive: department?.isActive ?? true,
    },
  });

  useEffect(() => {
    fetchWorkers();
    if (department?.medicationStock) {
      const initialMedications = department.medicationStock.map((stock) => ({
        medicationId: stock.medicationId,
        medicationName: stock.medicationName,
        currentQuantity: stock.currentQuantity,
        minQuantity: stock.minQuantity,
        maxQuantity: stock.maxQuantity,
        unit: stock.unit,
      }));
      setMedications(initialMedications);
    }
  }, [department]);

  const fetchWorkers = async () => {
    try {
      const data = await api.workers.getAll();
       console.log("👥 Workers structure:", data)

       setWorkers(
        data.filter(
          (worker: User) => worker.role === "head_of_department" 
           
        )
      );
      
      
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicationId: `med_${Date.now()}`,
        medicationName: "",
        currentQuantity: 0,
        minQuantity: 10,
        maxQuantity: 100,
        unit: "unidades",
      },
    ]);
  };

  const updateMedication = (
    index: number,
    field: keyof MedicationStockRequest,
    value: any
  ) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  
  const onSubmit = async (data: FormData) => {
  console.log("🎯 Iniciando onSubmit...")
  console.log("📋 Datos del formulario:", data)
  console.log("💊 Array de medicamentos:", medications)
  
  // Validación básica
  if (!data.name || data.name.trim() === '') {
    console.log("❌ Nombre vacío")
    toast({
      title: "Error",
      description: "El nombre del departamento es requerido",
      variant: "destructive",
    })
    return
  }

  setLoading(true)
  
  try {
    // Corregir headId si es necesario
    const headId = data.headId === "no-head" ? null : data.headId
    
    const payload = {
      ...data,
      headId: headId,
      initialStock: medications,
    }

    console.log("📤 Enviando payload:", payload)

    if (department) {
      console.log(`🔄 Actualizando departamento ID: ${department.id}`)
      await api.departments.update(department.id, payload)
      toast({
        title: "Departamento actualizado",
        description: "El departamento ha sido actualizado exitosamente.",
      })
    } else {
      console.log("🆕 Creando nuevo departamento")
      await api.departments.create(payload)
      toast({
        title: "Departamento creado",
        description: "El departamento ha sido creado exitosamente.",
      })
    }
    
    console.log("✅ Operación completada exitosamente")
    onSuccess()
    
  } catch (error) {
    console.error("💥 Error completo:", error)
    console.error("📞 Stack trace:", error instanceof Error ? error.stack : 'No stack available')
    
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Error al guardar el departamento",
      variant: "destructive",
    })
  } finally {
    console.log("🏁 Finalizando onSubmit")
    setLoading(false)
  }
}

  const getAvailableWorkers = () => {
    if (!department) return workers;
    return workers.filter(
      (worker) =>
        !department.workers.some((deptWorker) => deptWorker.id === worker.id)
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Departamento *</Label>
              <Input
                id="name"
                {...register("name", { required: "Este campo es requerido" })}
                placeholder="Ej: Urgencias, Pediatría"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headId">Jefe del Departamento</Label>
             <Select
  value={watch("headId")}
  onValueChange={(value) => setValue("headId", value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar jefe" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="no-head">Sin jefe asignado</SelectItem>
    {workers.map((worker) => (
      <SelectItem key={worker.id} value={worker.id}>
        {worker.name} - {worker.role === "head_of_department" ? "Jefe de Departamento" : worker.role}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe las funciones y responsabilidades del departamento..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Departamento activo</Label>
          </div>
        </CardContent>
      </Card>

      {/* Initial Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Inicial de Medicamentos
            </span>
            <Button
              type="button"
              onClick={addMedication}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Medicamento
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay medicamentos agregados. Los medicamentos se pueden
              gestionar después de crear el departamento.
            </p>
          ) : (
            <div className="space-y-4">
              {medications.map((medication, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre del Medicamento *</Label>
                      <Input
                        value={medication.medicationName}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "medicationName",
                            e.target.value
                          )
                        }
                        placeholder="Ej: Paracetamol"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidad</Label>
                      <Select
                        value={medication.unit}
                        onValueChange={(value) =>
                          updateMedication(index, "unit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unidades">Unidades</SelectItem>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="cajas">Cajas</SelectItem>
                          <SelectItem value="frascos">Frascos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad Actual</Label>
                      <Input
                        type="number"
                        value={medication.currentQuantity}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "currentQuantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad Mínima</Label>
                      <Input
                        type="number"
                        value={medication.minQuantity}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "minQuantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad Máxima</Label>
                      <Input
                        type="number"
                        value={medication.maxQuantity}
                        onChange={(e) =>
                          updateMedication(
                            index,
                            "maxQuantity",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMedication(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : department ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
