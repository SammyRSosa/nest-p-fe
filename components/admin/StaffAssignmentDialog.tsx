// 📁 StaffAssignmentDialog.tsx - ACTUALIZAR COMPONENTE
"use client";

// 📁 StaffAssignmentDialog.tsx - VERIFICAR IMPORTS
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, UserMinus, Crown, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Department, User, WorkerDepartment } from "@/types";
import { toast } from "@/hooks/use-toast";

interface StaffAssignmentDialogProps {
  department: Department;
  onClose: () => void;
  onUpdate: () => void;
}

export function StaffAssignmentDialog({
  department,
  onClose,
  onUpdate,
}: StaffAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<WorkerDepartment[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>("");

  useEffect(() => {
    fetchAvailableWorkers();
    fetchAssignments();
  }, [department]);

   useEffect(() => {
    const testEndpoints = async () => {
      try {
        console.log("🔍 Probando endpoints de la API...");
        
        // Probar workers
        const workers = await api.workers.getAll();
        console.log("✅ Workers endpoint funciona:", workers.length);
        
        // Probar departments
        const depts = await api.departments.getAll();
        console.log("✅ Departments endpoint funciona:", depts.length);
        
        // Probar workerDepartments - con manejo de error
        try {
          const assignments = await api.workerDepartments.getAll();
          console.log("✅ WorkerDepartments getAll funciona:", assignments.length);
        } catch (error) {
          console.log("❌ WorkerDepartments getAll NO funciona");
        }
        
        // Probar assign
        try {
          // Solo probar si hay workers y departments
          if (workers.length > 0 && depts.length > 0) {
            console.log("🔍 Probando endpoint assign...");
            console.log("📝 Endpoint assign disponible (verificar manualmente)");
          }
        } catch (error) {
          console.log("❌ Assign endpoint NO funciona");
        }
        
      } catch (error) {
        console.error("❌ Error probando endpoints:", error);
      }
    };
    
    testEndpoints();
  }, []); // ← Array vacío para que se ejecute solo una vez


  const fetchAvailableWorkers = async () => {
    try {
      // Primero asegurarse de tener las asignaciones actualizadas
      await fetchAssignments();

      const allWorkers = await api.workers.getAll();
      const currentWorkerIds = assignments
        .filter((assignment) => assignment.active)
        .map((assignment) => assignment.worker.id);

      const available = allWorkers.filter(
        (worker: User) => !currentWorkerIds.includes(worker.id)
      );
      setAvailableWorkers(available);
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      // Usar endpoint específico para obtener asignaciones del departamento
      const departmentAssignments = await api.workerDepartments.getById(
        department.id
      );
      setAssignments(departmentAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      // Si no existe ese endpoint, mantener el filtro pero mejorarlo:
      try {
        const data = await api.workerDepartments.getAll();
        const departmentAssignments = data.filter(
          (assignment: WorkerDepartment) =>
            assignment.department.id === department.id && assignment.active
        );
        setAssignments(departmentAssignments);
      } catch (fallbackError) {
        console.error("Error in fallback:", fallbackError);
      }
    }
  };

  const assignWorker = async () => {
  if (!selectedWorker) {
    toast({
      title: "Error",
      description: "Selecciona un trabajador para asignar",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  try {
    console.log("🔄 Asignando trabajador:", selectedWorker, "al departamento:", department.id);
    
    // 1. ASIGNAR EL TRABAJADOR
    const newAssignment = await api.workerDepartments.assign({
      workerId: selectedWorker,
      departmentId: department.id,
    });
    
    console.log("✅ Trabajador asignado:", newAssignment);
    
    toast({
      title: "Trabajador asignado",
      description: "El trabajador ha sido asignado al departamento exitosamente.",
    });
    
    // 2. ACTUALIZAR LA UI DIRECTAMENTE EN LUGAR DE REFETCH
    // Agregar la nueva asignación localmente en lugar de hacer fetch
    if (newAssignment) {
      setAssignments(prev => [...prev, newAssignment]);
    }
    
    // 3. ACTUALIZAR TRABAJADORES DISPONIBLES
    setAvailableWorkers(prev => 
      prev.filter(worker => worker.id !== selectedWorker)
    );
    
    // 4. LIMPIAR SELECTOR
    setSelectedWorker("");
    
    // 5. NOTIFICAR AL COMPONENTE PADRE
    onUpdate();
    
  } catch (error: any) {
    console.error("❌ Error asignando trabajador:", error);
    
    let errorMessage = "Error al asignar trabajador";
    if (error.message?.includes("not found")) {
      errorMessage = "Trabajador o departamento no encontrado";
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

  const removeWorker = async (assignmentId: string) => {
  setLoading(true);
  try {
    console.log("🔄 Removiendo asignación:", assignmentId);
    
    // 1. REMOVER LA ASIGNACIÓN
    await api.workerDepartments.remove(assignmentId);
    
    toast({
      title: "Trabajador removido",
      description: "El trabajador ha sido removido del departamento exitosamente.",
    });
    
    // 2. ACTUALIZAR LA UI DIRECTAMENTE
    const assignmentToRemove = assignments.find(a => a.id === assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    
    // 3. AGREGAR EL TRABAJADOR DE VUELTA A DISPONIBLES
    if (assignmentToRemove?.worker) {
      setAvailableWorkers(prev => [...prev, assignmentToRemove.worker]);
    }
    
    // 4. NOTIFICAR AL COMPONENTE PADRE
    onUpdate();
    
  } catch (error: any) {
    console.error("❌ Error removiendo trabajador:", error);
    
    let errorMessage = "Error al remover trabajador";
    if (error.message?.includes("not found")) {
      errorMessage = "Asignación no encontrada";
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
  const getRoleBadge = (role: string) => {
    const roleColors: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      doctor: "default",
      nurse: "secondary",
      staff: "outline",
    };

    const roleLabels: Record<string, string> = {
      doctor: "Médico",
      nurse: "Enfermero",
      staff: "Personal",
    };

    return (
      <Badge variant={roleColors[role] || "outline"}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const activeAssignments = assignments.filter(
    (assignment) => assignment.active
  );

  return (
    <div className="space-y-6">
      {/* Current Head */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Jefe del Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {department.headOfDepartment ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">
                    {department.headOfDepartment.worker.firstName}{" "}{department.headOfDepartment.worker.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {department.headOfDepartment.worker.email}
                  </div>
                  {getRoleBadge(department.headOfDepartment.worker.role)}
                </div>
              </div>
              <Badge variant="destructive">
                <Crown className="h-3 w-3 mr-1" />
                Jefe
              </Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No hay un jefe asignado a este departamento.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Staff Management */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Personal Actual</TabsTrigger>
          <TabsTrigger value="assign">Asignar Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal Asignado ({activeAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay personal asignado a este departamento.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        {/* ✅ NOMBRE DEL TRABAJADOR */}
                        <div className="font-medium">
                          {assignment.worker.firstName}{" "}{assignment.worker.lastName}
                          {/* ¡ESTO DEBE ESTAR PRESENTE! */}
                        </div>

                        {/* ✅ EMAIL DEL TRABAJADOR */}
                        <div className="text-sm text-muted-foreground">
                          {assignment.worker.email}{" "}
                          {/* ¡ESTO DEBE ESTAR PRESENTE! */}
                        </div>

                        {/* ✅ BADGE DEL ROL */}
                        {getRoleBadge(assignment.worker.role)}
                      </div>

                      <div className="flex items-center gap-2">
                        {department.headOfDepartment?.worker.id ===
                          assignment.worker.id && (
                          <Badge variant="destructive">
                            <Crown className="h-3 w-3 mr-1" />
                            Jefe
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorker(assignment.id)}
                          disabled={
                            loading ||
                            department.headOfDepartment?.worker.id ===
                              assignment.worker.id
                          }
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Asignar Nuevo Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableWorkers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay trabajadores disponibles para asignar. Todos los
                  trabajadores ya están asignados a este departamento.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedWorker}
                      onValueChange={setSelectedWorker}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar trabajador para asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWorkers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center gap-2">
                              <span>{worker.firstName}{" "}{worker.lastName}</span>
                              {getRoleBadge(worker.role)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={assignWorker}
                      disabled={!selectedWorker || loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Asignar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
