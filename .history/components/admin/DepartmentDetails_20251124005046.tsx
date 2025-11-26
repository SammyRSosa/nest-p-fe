"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Package, Crown, UserCheck, Activity } from "lucide-react";
import type { Department } from "@/types";

interface DepartmentDetailsProps {
  department: Department;
  onClose: () => void;
}

export function DepartmentDetails({ department, onClose }: DepartmentDetailsProps) {
  
  // ✅ Función para contar trabajadores
  const getAssignedWorkersCount = (departament: Department) => {
    if (departament.workers && departament.workers.length > 0) {
      return departament.workers.length;
    }
    if (departament.workers) {
      return departament.workers.filter((wd: any) => wd.active !== false).length;
    }
    return 0;
  };

  // ✅ Función para obtener nombre del jefe
  const getHeadOfDepartmentName = (departament: Department) => {
    if (!departament.headOfDepartment) {
      return "Jefe no asignado";
    }
    
    const worker = departament.headOfDepartment.worker;
    if (worker.firstName && worker.lastName) {
      return `${worker.firstName} ${worker.lastName}`;
    }
    
    return worker.name || "Nombre no disponible";
  };

  const workersCount = getAssignedWorkersCount(department);
  const headName = getHeadOfDepartmentName(department);

  return (
    <div className="space-y-6">
      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-sm text-muted-foreground">Nombre:</strong>
              <div className="font-medium mt-1">{department.name}</div>
            </div>
            
            <div>
              <strong className="text-sm text-muted-foreground">Estado:</strong>
              <div className="mt-1">
                <Badge variant={department.isActive ? "default" : "secondary"}>
                  <Activity className="h-3 w-3 mr-1" />
                  {department.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>

          {department.description && (
            <div>
              <strong className="text-sm text-muted-foreground">Descripción:</strong>
              <div className="mt-1 text-sm">{department.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jefe del Departamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Jefe del Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {department.headOfDepartment ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-lg">{headName}</div>
                  <div className="text-sm text-muted-foreground">
                    {department.headOfDepartment.worker.email}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="default">
                      {department.headOfDepartment.worker.role}
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-100">
                      <Crown className="h-3 w-3 mr-1" />
                      Jefe
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-amber-500" />
              <p className="font-medium">Jefe no asignado</p>
              <p className="text-sm">Este departamento no tiene un jefe asignado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Asignado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personal Asignado
            <Badge variant="outline" className="ml-2">
              {workersCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workersCount > 0 ? (
            <div className="space-y-3">
              {department.workers?.map((worker, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">
                        {worker.firstName && worker.lastName 
                          ? `${worker.firstName} ${worker.lastName}`
                          : worker.name
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {worker.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {worker.role}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>No hay personal asignado a este departamento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicamentos en Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Medicamentos en Stock
            <Badge variant="outline" className="ml-2">
              {department.medicationStock?.length || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {department.medicationStock && department.medicationStock.length > 0 ? (
            <div className="space-y-2">
              {department.medicationStock.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{med.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Stock: {med.quant} | Mínimo: {med.minStock}
                    </div>
                  </div>
                  <Badge variant={
                    med.status === 'critical' ? 'destructive' : 
                    med.status === 'low' ? 'secondary' : 'default'
                  }>
                    {med.status === 'critical' ? 'Crítico' : 
                     med.status === 'low' ? 'Bajo' : 'Normal'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p>No hay medicamentos en stock</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón de cerrar */}
      <div className="flex justify-end">
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}