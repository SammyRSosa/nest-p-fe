// 📁 DepartmentForm.tsx - JEFE OBLIGATORIO
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Department, User } from "@/types";
import { toast } from "@/hooks/use-toast";

interface DepartmentFormProps {
  department?: Department;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  headWorkerId: string; // ✅ OBLIGATORIO
}

export function DepartmentForm({
  department,
  onSuccess,
  onCancel,
}: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: department?.name || "",
      headWorkerId: department?.headOfDepartment?.worker?.id || "",
    },
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setFetchingDoctors(true);
    try {
      const allWorkers = await api.workers.getAll();
      // Filtrar solo doctores para ser jefes de departamento
      const doctorsOnly = allWorkers.filter(
        (worker: User) => worker.role === "doctor"
      );
      console.log("🩺 Doctores disponibles:", doctorsOnly);
      setDoctors(doctorsOnly);
      
      if (doctorsOnly.length === 0) {
        toast({
          title: "Advertencia",
          description: "No hay doctores disponibles para asignar como jefe",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los doctores",
        variant: "destructive",
      });
    } finally {
      setFetchingDoctors(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("📤 Enviando datos del formulario:", data);
    
    // Validación
    if (!data.name || data.name.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del departamento es requerido",
        variant: "destructive",
      });
      return;
    }

    // ✅ VALIDAR QUE SE HAYA SELECCIONADO UN JEFE
    if (!data.headWorkerId || data.headWorkerId.trim() === "") {
      toast({
        title: "Error",
        description: "Debes seleccionar un doctor como jefe del departamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        name: data.name,
        headWorkerId: data.headWorkerId, // ✅ OBLIGATORIO
      };

      console.log("🚀 Datos a enviar al backend:", requestData);

      if (department) {
        console.log(`🔄 Actualizando departamento ID: ${department.id}`);
        await api.departments.update(department.id, requestData);
        toast({
          title: "Departamento actualizado",
          description: "El departamento ha sido actualizado exitosamente.",
        });
      } else {
        console.log("🆕 Creando nuevo departamento");
        await api.departments.create(requestData);
        toast({
          title: "Departamento creado",
          description: "El departamento ha sido creado exitosamente.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("💥 Error completo:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al guardar el departamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ MOSTRAR ALERTA SI NO HAY DOCTORES DISPONIBLES
  if (fetchingDoctors) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando doctores disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {department ? "Editar Departamento" : "Crear Departamento"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Departamento *</Label>
            <Input
              id="name"
              {...register("name", { 
                required: "Este campo es requerido",
                minLength: {
                  value: 2,
                  message: "El nombre debe tener al menos 2 caracteres"
                }
              })}
              placeholder="Ej: Urgencias, Pediatría"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="headWorkerId">
              Jefe del Departamento *
              <span className="text-red-500 ml-1">*</span>
            </Label>
            
            {doctors.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay doctores disponibles. Debes crear al menos un doctor antes de crear un departamento.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select
                  value={watch("headWorkerId")}
                  onValueChange={(value) => setValue("headWorkerId", value)}
                  required
                >
                  <SelectTrigger className={errors.headWorkerId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecciona un doctor como jefe" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {doctor.email} • {doctor.code || "Sin código"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.headWorkerId && (
                  <p className="text-sm text-red-500">{errors.headWorkerId.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Solo los doctores pueden ser asignados como jefes de departamento
                </p>
              </>
            )}
          </div>

          {/* ✅ INFORMACIÓN ADICIONAL */}
          {doctors.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Doctores disponibles:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {doctors.map((doctor) => (
                  <li key={doctor.id} className="flex justify-between">
                    <span>{doctor.name}</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                      {doctor.code || "Sin código"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || doctors.length === 0}
        >
          {loading ? "Guardando..." : department ? "Actualizar" : "Crear Departamento"}
        </Button>
      </div>

      {/* ✅ ALERTA SI NO HAY DOCTORES */}
      {doctors.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No puedes crear un departamento sin doctores disponibles. 
            Primero crea al menos un doctor en la sección de trabajadores.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}