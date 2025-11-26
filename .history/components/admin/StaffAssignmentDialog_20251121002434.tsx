"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus, UserMinus, Crown, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Department, User } from "@/types"
import { toast } from "@/hooks/use-toast"

interface StaffAssignmentDialogProps {
  department: Department
  onClose: () => void
  onUpdate: () => void
}

export function StaffAssignmentDialog({ department, onClose, onUpdate }: StaffAssignmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>("")

  useEffect(() => {
    fetchAvailableWorkers()
  }, [department])

  const fetchAvailableWorkers = async () => {
    try {
      const allWorkers = await api.workers.getAll()
      const available = allWorkers.filter((worker: User) => 
        !department.workers.some(deptWorker => deptWorker.id === worker.id)
      )
      setAvailableWorkers(available)
    } catch (error) {
      console.error("Error fetching workers:", error)
    }
  }

  const assignWorker = async () => {
    if (!selectedWorker) return

    setLoading(true)
    try {
      await api.departments.assignStaff(department.id, [selectedWorker])
      toast({
        title: "Personal asignado",
        description: "El trabajador ha sido asignado al departamento exitosamente.",
      })
      onUpdate()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar personal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeWorker = async (workerId: string) => {
    setLoading(true)
    try {
      await api.departments.removeStaff(department.id, workerId)
      toast({
        title: "Personal removido",
        description: "El trabajador ha sido removido del departamento exitosamente.",
      })
      onUpdate()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al remover personal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const assignHead = async (headId: string) => {
    setLoading(true)
    try {
      await api.departments.setHead(department.id, headId)
      toast({
        title: "Jefe asignado",
        description: "El jefe del departamento ha sido actualizado exitosamente.",
      })
      onUpdate()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al asignar jefe",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      doctor: "default",
      nurse: "secondary",
      staff: "outline",
      head_of_department: "destructive",
    }
    
    const roleLabels: Record<string, string> = {
      doctor: "Médico",
      nurse: "Enfermero",
      staff: "Personal",
      head_of_department: "Jefe de Departamento",
    }

    return (
      <Badge variant={roleColors[role] || "outline"}>
        {roleLabels[role] || role}
      </Badge>
    )
  }

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
          {department.head ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{department.head.name}</div>
                  <div className="text-sm text-muted-foreground">{department.head.email}</div>
                  {getRoleBadge(department.head.role)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => assignHead("")}
                disabled={loading}
              >
                Remover Jefe
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">No hay un jefe asignado a este departamento.</p>
              <div className="flex items-center gap-2">
                <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar trabajador como jefe" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...department.workers, ...availableWorkers].map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} - {worker.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => assignHead(selectedWorker)}
                  disabled={!selectedWorker || loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  Asignar Jefe
                </Button>
              </div>
            </div>
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
                Personal Asignado ({department.workers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {department.workers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay personal asignado a este departamento.
                </p>
              ) : (
                <div className="space-y-3">
                  {department.workers.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">{worker.email}</div>
                        {getRoleBadge(worker.role)}
                      </div>
                      <div className="flex items-center gap-2">
                        {department.head?.id === worker.id && (
                          <Badge variant="destructive">
                            <Crown className="h-3 w-3 mr-1" />
                            Jefe
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorker(worker.id)}
                          disabled={loading || department.head?.id === worker.id}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
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
                  No hay trabajadores disponibles para asignar. Todos los trabajadores ya están asignados a este departamento.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar trabajador para asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWorkers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center gap-2">
                              <span>{worker.name}</span>
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
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Asignar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Trabajadores Disponibles:</h4>
                    <div className="grid gap-2">
                      {availableWorkers.map((worker) => (
                        <div key={worker.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span>{worker.name}</span>
                            {getRoleBadge(worker.role)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWorker(worker.id)
                              assignWorker()
                            }}
                            disabled={loading}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}