"use client" // <--- FIX: ADDED THIS DIRECTIVE

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    LogIn,
    LogOut,
    Loader2,
    Activity,
    Calendar,
    TrendingUp,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { api } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// --- Interfaces ---

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

interface SuccessRateData {
    doctorId: string;
    totalConsultations: number;
    successfulConsultations: number;
    failedConsultations: number;
    successRate: number;
    period: {
        startDate?: string;
        endDate?: string;
    };
    details: Array<{
        consultationId: string;
        consultationDate: string;
        patientName: string;
        returnedWithin3Months: boolean;
        // The SuccessRateData interface provided in the user's previous context
        // contained a 'successful' boolean property that is missing here.
        // Assuming success is the OPPOSITE of 'returnedWithin3Months' for now,
        // but it is safer to ask the backend to include a unique patient ID.
        // For the fix, we will infer the 'successful' property.
    }>;
}

export default function HeadDepartmentStaffPage() {
    // --- Existing State ---
    const [department, setDepartment] = useState<Department | null>(null)
    const [allWorkers, setAllWorkers] = useState<Worker[]>([])
    const [departmentWorkers, setDepartmentWorkers] = useState<Worker[]>([])
    const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [search, setSearch] = useState("")

    // --- New State for Stats ---
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
    const [statsLoading, setStatsLoading] = useState(false)
    const [statsData, setStatsData] = useState<SuccessRateData | null>(null)
    const [statsDateRange, setStatsDateRange] = useState({
        start: "",
        end: ""
    })

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

            const deptWorkers = deptData?.workers || []
            setDepartmentWorkers(deptWorkers)

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

    // --- Stats Handlers ---

    const handleOpenStats = (worker: Worker) => {
        setSelectedWorker(worker)
        // Default to last 3 months
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);

        const dateToInput = (d: Date) => d.toISOString().split('T')[0];

        setStatsDateRange({
            start: dateToInput(start),
            end: dateToInput(end)
        })

        setIsStatsModalOpen(true)
        fetchStats(worker.id, dateToInput(start), dateToInput(end))
    }

    // Inside HeadDepartmentStaffPage.tsx
    const fetchStats = async (doctorId: string, start?: string, end?: string) => {
        setStatsLoading(true);
        try {
            const data: SuccessRateData = await api.reports.getDoctorSuccessRate(doctorId, start, end);

            // === START OF FRONTEND CLEANUP ===
            // This logic filters out same-day, same-patient *subsequent* consultations,
            // which were causing the previous backend issue. We only keep the FIRST consultation of the day per patient.

            // NOTE: Using patientName for uniqueness is highly discouraged. A 'patientId' should be used.
            const seenPatients: { [date: string]: Set<string> } = {};

            const cleanedDetails = data.details.filter(detail => {
                const dateKey = detail.consultationDate.split('T')[0]; // YYYY-MM-DD

                if (!seenPatients[dateKey]) {
                    seenPatients[dateKey] = new Set();
                }

                // Check if this patient already had a consultation recorded on this date
                if (seenPatients[dateKey].has(detail.patientName)) {
                    // If yes, discard this redundant consultation for the same success rate window
                    return false;
                } else {
                    // If no, record it and keep this consultation
                    seenPatients[dateKey].add(detail.patientName);
                    return true;
                }
            });

            // Recalculate summary metrics based on the cleaned data
            const totalConsultations = cleanedDetails.length;
            // FIX: Corrected the filter to check the boolean property
            const successfulConsultations = cleanedDetails.filter(r => !r.returnedWithin3Months).length; 
            const failedConsultations = totalConsultations - successfulConsultations;

            const successRate = totalConsultations > 0
                ? parseFloat(((successfulConsultations / totalConsultations) * 100).toFixed(2))
                : 0;

            // Apply the cleaned data to the state
            const cleanedData: SuccessRateData = {
                ...data,
                totalConsultations,
                successfulConsultations,
                failedConsultations,
                successRate,
                details: cleanedDetails,
            };

            setStatsData(cleanedData);

            // === END OF FRONTEND CLEANUP ===
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las estadísticas",
                variant: "destructive"
            });
        } finally {
            setStatsLoading(false);
        }
    }

    const handleDateFilterChange = () => {
        if (selectedWorker) {
            fetchStats(selectedWorker.id, statsDateRange.start, statsDateRange.end);
        }
    }

    // --- Worker Actions ---

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
            toast({ title: "Trabajador asignado", description: "El trabajador ha sido asignado al departamento." })
            await fetchData()
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Error al asignar trabajador", variant: "destructive" })
        }
    }

    const handleRemoveWorker = async (workerId: string) => {
        if (!confirm('¿Estás seguro de que deseas remover este trabajador?')) return;
        try {
            const assignments = await api.workerDepartments.getById(department?.id || '');
            const workerAssignment = assignments?.find((assignment: WorkerAssignment) => assignment.worker.id === workerId);
            if (!workerAssignment) throw new Error('No se encontró la asignación');

            await api.workerDepartments.remove(workerAssignment.id);
            toast({ title: 'Trabajador removido', description: 'El trabajador ha sido removido del departamento.' });
            await fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Error al remover trabajador', variant: "destructive" });
        }
    };

    const handleEditRole = async () => {
        if (!selectedWorker || !editFormData.role) return
        try {
            await api.workers.update(selectedWorker.id, { role: editFormData.role })
            toast({ title: "Rol actualizado", description: "El rol del trabajador ha sido actualizado." })
            setIsEditModalOpen(false)
            setSelectedWorker(null)
            await fetchData()
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Error al actualizar rol", variant: "destructive" })
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
            case "doctor": return "bg-blue-100 text-blue-700"
            case "nurse": return "bg-green-100 text-green-700"
            case "staff": return "bg-gray-100 text-gray-700"
            case "head_of_department": return "bg-purple-100 text-purple-700"
            default: return "bg-gray-100 text-gray-700"
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

                {/* Stats Summary */}
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
                            <CardTitle className="text-sm font-medium text-muted-foreground">Médicos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {departmentWorkers.filter((w) => w.role === "doctor").length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Enfermeros</CardTitle>
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

                {/* Department Workers Grid */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Personal del Departamento</h2>
                    {filteredDeptWorkers.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                {departmentWorkers.length === 0 ? "No hay trabajadores asignados" : "No se encontraron resultados"}
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
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {/* SHOW STATS BUTTON IF DOCTOR */}
                                                {worker.role === 'doctor' && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                                        onClick={() => handleOpenStats(worker)}
                                                    >
                                                        <Activity className="h-4 w-4 mr-2" />
                                                        Ver Efectividad
                                                    </Button>
                                                )}

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
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Workers Grid */}
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
                                                <h3 className="font-semibold text-lg">{worker.firstName} {worker.lastName}</h3>
                                                <Badge className={`mt-2 ${getRoleBadgeColor(worker.role)}`}>{getRoleLabel(worker.role)}</Badge>
                                            </div>
                                            <div className="text-sm space-y-1 text-muted-foreground">
                                                {worker.email && <p>Email: {worker.email}</p>}
                                                {worker.department && <p className="text-xs text-gray-600">Depto: {worker.department.name}</p>}
                                            </div>
                                            <Button size="sm" onClick={() => handleAssignWorker(worker.id)} className="w-full bg-accent hover:bg-accent/90" disabled={worker.role === "head_of_department"}>
                                                <LogIn className="h-3 w-3 mr-1" /> Asignar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Modals --- */}

            {/* STATS MODAL */}
            <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Activity className="h-6 w-6 text-accent" />
                            Efectividad del Médico
                        </DialogTitle>
                        <CardDescription>
                            Análisis de reingresos para {selectedWorker?.firstName} {selectedWorker?.lastName}
                        </CardDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Filters */}
                        <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border">
                            <div className="space-y-2">
                                <Label>Fecha Inicio</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        type="date"
                                        className="pl-8"
                                        value={statsDateRange.start}
                                        onChange={(e) => setStatsDateRange({ ...statsDateRange, start: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Fecha Fin</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        type="date"
                                        className="pl-8"
                                        value={statsDateRange.end}
                                        onChange={(e) => setStatsDateRange({ ...statsDateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleDateFilterChange} disabled={statsLoading}>
                                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
                            </Button>
                        </div>

                        {statsLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            </div>
                        ) : statsData ? (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold text-accent">{statsData.successRate}%</div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" /> Tasa de Éxito
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold">{statsData.totalConsultations}</div>
                                            <p className="text-sm text-muted-foreground">Total Consultas</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-green-50 border-green-200">
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold text-green-700">{statsData.successfulConsultations}</div>
                                            <p className="text-sm text-green-600 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Exitosas (No volvieron)
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-red-50 border-red-200">
                                        <CardContent className="pt-6">
                                            <div className="text-2xl font-bold text-red-700">{statsData.failedConsultations}</div>
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <XCircle className="h-3 w-3" /> Reingresos (&lt;3 meses)
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Progress Bar Visual */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Efectividad del Tratamiento</span>
                                        <span>{statsData.successRate}%</span>
                                    </div>
                                    <Progress value={statsData.successRate} className="h-3" />
                                    <p className="text-xs text-muted-foreground">
                                        * Basado en pacientes que no regresaron por la misma causa en 90 días.
                                    </p>
                                </div>

                                {/* Detailed Table */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 px-4 py-2 font-semibold text-sm border-b">Detalle Reciente</div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 font-medium">Fecha Consulta</th>
                                                    <th className="px-4 py-2 font-medium">Paciente</th>
                                                    <th className="px-4 py-2 font-medium">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {statsData.details.map((detail, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            {new Date(detail.consultationDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-2">{detail.patientName}</td>
                                                        <td className="px-4 py-2">
                                                            {detail.returnedWithin3Months ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    Reingresó
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Exitoso
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {statsData.details.length === 0 && (
                                            <div className="p-4 text-center text-gray-500">No hay datos en este rango.</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                No se encontraron datos de efectividad para este médico en el rango seleccionado.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>


            {/* ADD WORKER MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Nuevo Trabajador</DialogTitle>
                        <CardDescription>Crea un nuevo usuario y asígnalo a tu departamento.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstName" className="text-right">Nombre</Label>
                            <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastName" className="text-right">Apellido</Label>
                            <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Teléfono</Label>
                            <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Rol</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} disabled={formData.role === "head_of_department"}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seleccionar Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAddWorker} className="bg-accent hover:bg-accent/90">
                            Crear y Asignar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* EDIT ROLE MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Rol de {selectedWorker?.firstName} {selectedWorker?.lastName}</DialogTitle>
                        <CardDescription>Actualiza el rol del trabajador en el sistema.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">Nuevo Rol</Label>
                            <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ role: value })} disabled={selectedWorker?.role === "head_of_department"}>
                                <SelectTrigger className="col-span-3" id="edit-role">
                                    <SelectValue placeholder="Seleccionar Rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleEditRole} disabled={selectedWorker?.role === "head_of_department"}>
                            Guardar Cambios
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}