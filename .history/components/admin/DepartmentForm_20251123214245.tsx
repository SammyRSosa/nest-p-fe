// 📁 DepartmentForm.tsx - VERSIÓN COMPLETA CORREGIDA
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
  headWorkerId: string;
}

export function DepartmentForm({
  department,
  onSuccess,
  onCancel,
}: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [allDoctors, setAllDoctors] = useState<User[]>([]);
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
      
      // Filtrar solo doctores
      const doctorsList = allWorkers.filter(
        (worker: User) => worker.role === "doctor"
      );
      setAllDoctors(doctorsList);

      // Obtener departamentos existentes para saber qué doctores ya son jefes
      const existingDepartments: Department[] = await api.departments.getAll();
      
      // Versión segura con protección contra valores undefined
      const doctorsWhoAreHeads = existingDepartments
        .map((dept: Department) => {
          // Verificar que headOfDepartment y worker existan
          if (dept.headOfDepartment?.worker?.id) {
            return dept.headOfDepartment.worker.id;
          }
          return null;
        })
        .filter((id): id is string => id !== null); // Type guard

      console.log("👑 Doctores que ya son jefes:", doctorsWhoAreHeads);
      console.log("🏢 Total departamentos:", existingDepartments.length);
      console.log("👥 Departamentos con jefe:", doctorsWhoAreHeads.length);
      
      // Filtrar doctores que NO son jefes
      const availableDoctors = doctorsList.filter(
        (doctor: User) => !doctorsWhoAreHeads.includes(doctor.id)
      );

      console.log("🩺 Todos los doctores:", doctorsList.length);
      console.log("✅ Doctores disponibles (no son jefes):", availableDoctors.length);
      
      setDoctors(availableDoctors);
      
      if (availableDoctors.length === 0 && doctorsList.length > 0) {
        toast({
          title: "Información",
          description: "Todos los doctores ya son jefes de departamento. No hay doctores disponibles para asignar.",
          variant: "default",
        });
      } else if (availableDoctors.length === 0) {
        toast({
          title: "Advertencia", 
          description: "No hay doctores disponibles. Primero crea al menos un doctor.",
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
        headWorkerId: data.headWorkerId,
      };

      console.log("🚀 Datos a enviar al backend:", requestData);
      console.log("🔍 Verificando datos:");
      console.log("   - Nombre:", requestData.name);
      console.log("   - headWorkerId:", requestData.headWorkerId);
      console.log("   - Tipo de headWorkerId:", typeof requestData.headWorkerId);

      if (department) {
        console.log(`🔄 Actualizando departamento ID: ${department.id}`);
        const result = await api.departments.update(department.id, requestData);
        console.log("✅ Departamento actualizado:", result);
        toast({
          title: "Departamento actualizado",
          description: "El departamento ha sido actualizado exitosamente.",
        });
      } else {
        console.log("🆕 Creando nuevo departamento");
        const result = await api.departments.create(requestData);
        console.log("✅ Departamento creado:", result);
        toast({
          title: "Departamento creado",
          description: "El departamento ha sido creado exitosamente.",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("💥 Error completo:", error);
      console.error("📞 Status code:", error.status);
      console.error("📝 Mensaje:", error.message);
      
      // Mejor manejo de errores específicos
      let errorMessage = "Error al guardar el departamento";
      
      if (error.status === 500) {
        errorMessage = "Error interno del servidor. Contacta al administrador.";
      } else if (error.status === 400) {
        // Error de Bad Request (como doctor ya siendo jefe)
        errorMessage = error.message || "Datos inválidos para crear el departamento";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se cargan los doctores
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

  const hasDoctorsButAllAreHeads = allDoctors.length > 0 && doctors.length === 0;
  const noDoctorsAtAll = allDoctors.length === 0;

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
              <Alert variant={hasDoctorsButAllAreHeads ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {hasDoctorsButAllAreHeads 
                    ? "Todos los doctores ya son jefes de otros departamentos. No hay doctores disponibles para asignar como jefe."
                    : "No hay doctores disponibles. Debes crear al menos un doctor antes de crear un departamento."
                  }
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
                  Solo los doctores pueden ser asignados como jefes de departamento. 
                  <span className="text-amber-600 font-medium"> Cada doctor solo puede ser jefe de un departamento.</span>
                </p>
              </>
            )}
          </div>

          {/* Información adicional */}
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

      {/* Alerta si no hay doctores */}
      {noDoctorsAtAll && (
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