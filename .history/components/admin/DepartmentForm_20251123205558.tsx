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
    try {
      const allWorkers = await api.workers.getAll();
      // Filtrar solo doctores para ser jefes de departamento
      const doctorsOnly = allWorkers.filter(
        (worker: User) => worker.role === "doctor"
      );
      setDoctors(doctorsOnly);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los doctores",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("📤 Enviando datos:", data);
    
    // Validación
    if (!data.name || data.name.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del departamento es requerido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (department) {
        console.log(`🔄 Actualizando departamento ID: ${department.id}`);
        await api.departments.update(department.id, {
          name: data.name,
          headWorkerId: data.headWorkerId || undefined,
        });
        toast({
          title: "Departamento actualizado",
          description: "El departamento ha sido actualizado exitosamente.",
        });
      } else {
        console.log("🆕 Creando nuevo departamento");
        await api.departments.create({
          name: data.name,
          headWorkerId: data.headWorkerId,
        });
        toast({
          title: "Departamento creado",
          description: "El departamento ha sido creado exitosamente.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("💥 Error:", error);
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
              {...register("name", { required: "Este campo es requerido" })}
              placeholder="Ej: Urgencias, Pediatría"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="headWorkerId">Jefe del Departamento</Label>
            <Select
              value={watch("headWorkerId")}
              onValueChange={(value) => setValue("headWorkerId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar doctor como jefe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin jefe asignado</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.code || doctor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Solo los doctores pueden ser asignados como jefes de departamento
            </p>
          </div>
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