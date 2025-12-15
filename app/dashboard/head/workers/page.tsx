"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    LogIn,
    LogOut,
    Loader2,
} from "lucide-react"
import { api } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"

interface Worker {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    role: string
    code?: string
    department?: {
        id: string
        name: string
    }
}

interface Department {
    id: string
    name: string
    workers?: Worker[]
}

interface WorkerAssignment {
    id: string;
    worker: { id: string; name: string };
    department: { id: string; name: string };
    active: boolean;
    assignedAt: Date;
    leftAt?: Date;
}

export default function HeadDepartmentStaffPage() {
    const [department, setDepartment] = useState<Department | null>(null)
    const [allWorkers, setAllWorkers] = useState<Worker[]>([])
    const [departmentWorkers, setDepartmentWorkers] = useState<Worker[]>([])
    const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [search, setSearch] = useState("")

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "doctor",
    })

    const [editFormData, setEditFormData] = useState({
        role: "",
    })

    const roles = [
        { value: "doctor", label: "Médico" },
        { value: "nurse", label: "Enfermero" },
        { value: "staff", label: "Personal" },
    ]

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [deptData, workersData] = await Promise.all([
                api.departments.getmydep(),
                api.workers.getAll(),
            ])

            setDepartment(deptData)
            setAllWorkers(workersData || [])

            // Use the workers array directly from department data
            const deptWorkers = deptData?.workers || []
            setDepartmentWorkers(deptWorkers)

            // Filter workers not in this department
            const deptWorkerIds = new Set(deptWorkers.map((w: Worker) => w.id))
            const available = workersData?.filter(
                (w: Worker) => !deptWorkerIds.has(w.id) && w.role !== "head_of_department"
            ) || []
            setAvailableWorkers(available)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Error al cargar los datos",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAddWorker = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast({
                title: "Error",
                description: "Por favor completa todos los campos",
                variant: "destructive",
            })
            return
        }

        try {
            await api.workers.create({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                departmentId: department?.id,
            })

            toast({
                title: "Trabajador agregado",
                description: "El trabajador ha sido agregado exitosamente.",
            })

            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                role: "doctor",
            })
            setIsAddModalOpen(false)
            await fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al agregar trabajador",
                variant: "destructive",
            })
        }
    }

    const handleAssignWorker = async (workerId: string) => {
        if (!department) return

        try {
            await api.workerDepartments.assign({
                workerId,
                departmentId: department.id,
            })

            toast({
                title: "Trabajador asignado",
                description: "El trabajador ha sido asignado al departamento.",
            })

            await fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al asignar trabajador",
                variant: "destructive",
            })
        }
    }

    const handleRemoveWorker = async (workerId: string) => {
        if (!confirm('¿Estás seguro de que deseas remover este trabajador?')) return;

        try {
            // Get all active assignments for this department
            const assignments = await api.workerDepartments.getById(
                department?.id || '',
            );

            const workerAssignment = assignments?.find(
                (assignment: WorkerAssignment) => assignment.worker.id === workerId,
            );

            if (!workerAssignment) {
                throw new Error('No se encontró la asignación del trabajador');
            }

            // Deactivate the assignment instead of deleting it
            await api.workerDepartments.remove(workerAssignment.id);

            toast({
                title: 'Trabajador removido',
                description: 'El trabajador ha sido removido del departamento.',
            });

            await fetchData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Error al remover trabajador',
                variant: 'destructive',
            });
        }
    };

    const handleEditRole = async () => {
        if (!selectedWorker || !editFormData.role) return

        try {
            await api.workers.update(selectedWorker.id, {
                role: editFormData.role,
            })

            toast({
                title: "Rol actualizado",
                description: "El rol del trabajador ha sido actualizado.",
            })

            setIsEditModalOpen(false)
            setSelectedWorker(null)
            await fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al actualizar rol",
                variant: "destructive",
            })
        }
    }

    const handleDeleteWorker = async (workerId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este trabajador?")) return

        try {
            await api.workers.delete(workerId)

            toast({
                title: "Trabajador eliminado",
                description: "El trabajador ha sido eliminado.",
            })

            await fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al eliminar trabajador",
                variant: "destructive",
            })
        }
    }

    const filteredDeptWorkers = departmentWorkers.filter((w) =>
        `${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

    const filteredAvailable = availableWorkers.filter((w) =>
        `${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

    const getRoleLabel = (role: string) => {
        const roleObj = roles.find((r) => r.value === role)
        return roleObj?.label || role
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "doctor":
                return "bg-blue-100 text-blue-700"
            case "nurse":
                return "bg-green-100 text-green-700"
            case "staff":
                return "bg-gray-100 text-gray-700"
            case "head_of_department":
                return "bg-purple-100 text-purple-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Cargando...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Gestión de Personal</h1>
                        <p className="text-muted-foreground">
                            {department?.name} - Administra tu equipo de trabajo
                        </p>
                    </div>
                    <Button className="bg-accent hover:bg-accent/90" onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Trabajador
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Personal Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{departmentWorkers.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">En tu departamento</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Médicos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {departmentWorkers.filter((w) => w.role === "doctor").length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Enfermeros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {departmentWorkers.filter((w) => w.role === "nurse").length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div>
                    <Input
                        placeholder="Buscar trabajador por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                {/* Department Workers */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Personal del Departamento</h2>
                    {filteredDeptWorkers.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                {departmentWorkers.length === 0
                                    ? "No hay trabajadores asignados"
                                    : "No se encontraron resultados"}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredDeptWorkers.map((worker) => (
                                <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {worker.firstName} {worker.lastName}
                                                </h3>
                                                <Badge className={`mt-2 ${getRoleBadgeColor(worker.role)}`}>
                                                    {getRoleLabel(worker.role)}
                                                </Badge>
                                            </div>

                                            <div className="text-sm space-y-1 text-muted-foreground">
                                                {worker.email && <p>Email: {worker.email}</p>}
                                                {worker.phone && <p>Teléfono: {worker.phone}</p>}
                                                {worker.code && <p>Código: {worker.code}</p>}
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedWorker(worker)
                                                        setEditFormData({ role: worker.role })
                                                        setIsEditModalOpen(true)
                                                    }}
                                                    className="flex-1"
                                                    disabled={worker.role === "head_of_department"}
                                                >
                                                    <Edit2 className="h-3 w-3 mr-1" />
                                                    Rol
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRemoveWorker(worker.id)}
                                                    className="text-red-600 hover:text-red-700 flex-1"
                                                    disabled={worker.role === "head_of_department"}
                                                >
                                                    <LogOut className="h-3 w-3 mr-1" />
                                                    Remover
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Workers */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Trabajadores Disponibles</h2>
                    {filteredAvailable.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No hay trabajadores disponibles
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAvailable.map((worker) => (
                                <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {worker.firstName} {worker.lastName}
                                                </h3>
                                                <Badge className={`mt-2 ${getRoleBadgeColor(worker.role)}`}>
                                                    {getRoleLabel(worker.role)}
                                                </Badge>
                                            </div>

                                            <div className="text-sm space-y-1 text-muted-foreground">
                                                {worker.email && <p>Email: {worker.email}</p>}
                                                {worker.phone && <p>Teléfono: {worker.phone}</p>}
                                                {worker.code && <p>Código: {worker.code}</p>}
                                                {worker.department && (
                                                    <p className="text-xs text-gray-600">
                                                        Depto: {worker.department.name}
                                                    </p>
                                                )}
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={() => handleAssignWorker(worker.id)}
                                                className="w-full bg-accent hover:bg-accent/90"
                                                disabled={worker.role === "head_of_department"}
                                            >
                                                <LogIn className="h-3 w-3 mr-1" />
                                                Asignar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Worker Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
                        <h2 className="text-xl font-semibold mb-6">Agregar Nuevo Trabajador</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre *</Label>
                                <Input
                                    placeholder="Juan"
                                    value={formData.firstName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, firstName: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Apellido *</Label>
                                <Input
                                    placeholder="Pérez"
                                    value={formData.lastName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, lastName: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    placeholder="juan@ejemplo.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Teléfono</Label>
                                <Input
                                    placeholder="+1 234 567 8900"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Rol *</Label>
                                <Select value={formData.role} onValueChange={(value) =>
                                    setFormData({ ...formData, role: value })
                                }>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAddWorker}
                                className="flex-1 bg-accent hover:bg-accent/90"
                            >
                                Agregar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {isEditModalOpen && selectedWorker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-6">
                            Cambiar Rol - {selectedWorker.firstName} {selectedWorker.lastName}
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nuevo Rol *</Label>
                                <Select value={editFormData.role} onValueChange={(value) =>
                                    setEditFormData({ role: value })
                                }>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setIsEditModalOpen(false)
                                    setSelectedWorker(null)
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleEditRole}
                                className="flex-1 bg-accent hover:bg-accent/90"
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}