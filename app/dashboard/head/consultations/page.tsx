"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, FileText, Plus, Edit2, Pill, Package, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";

interface Medication {
  id: string;
  name: string;
  code?: string;
  unit?: string;
}

interface Prescription {
  id: string;
  medicationId: string;
  medication?: Medication;
  quantity: number;
  instructions?: string;
}

interface Consultation {
  id: string;
  status: "pending" | "closed" | "canceled";
  diagnosis?: string | null;
  type?: "programmed" | "emergency";
  scheduledAt?: Date;
  createdAt: string;
  internalRemission?: any;
  externalRemission?: any;
  prescriptions?: Prescription[];
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    idNumber?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
  };
  mainDoctor: {
    id: string;
    firstName: string;
    lastName: string;
    code?: string;
    email?: string | null;
    role?: string;
  };
  department: {
    id: string;
    name: string;
  };
}

interface Supply {
  id: string;
  name: string;
  quantity: number;
}

function HeadConsultationsContent() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [remissions, setRemissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [supplies, setSupplies] = useState<Supply[]>([{ id: "1", name: "", quantity: 0 }]);
  const [supplyNotes, setSupplyNotes] = useState("");
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  // Prescription form states
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicationId: "",
    quantity: 0,
    instructions: "",
  });

  // Form states
  const [formData, setFormData] = useState({
    type: "emergency",
    patientId: "",
    remissionId: "",
    scheduledAt: "",
  });
  const [newStatus, setNewStatus] = useState("pending");

  const fetchConsultations = async () => {
    try {
      const data = await api.consultations.getOwn();
      setConsultations(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getAvailableRemissions = () => {
    // Obtener los IDs de remisiones que ya tienen consulta
    const remissionsWithConsultation = new Set(
      consultations
        .filter(c => c.internalRemission?.id || c.externalRemission?.id)
        .map(c => c.internalRemission?.id || c.externalRemission?.id)
    );

    // Filtrar remisiones que no tengan consulta
    return remissions.filter(remission => !remissionsWithConsultation.has(remission.id));
  };

  const fetchMedications = async () => {
    try {
      const data = await api.medications.getAll();
      setMedications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await api.patients.getAll();
      setPatients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRemissions = async () => {
    try {
      const data = await api.remissions.getOwn();
      setRemissions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id: string, status: string): Promise<void> => {
    try {
      await api.consultations.updateStatus(id, status as "pending" | "closed" | "canceled");
      fetchConsultations();
      setIsStatusModalOpen(false);
      setSelectedConsultation(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const saveDiagnosis = async () => {
    if (!selectedConsultation || !diagnosis.trim()) return;
    try {
      await api.consultations.updateStatus(selectedConsultation.id, status as "pending" | "closed" | "canceled", diagnosis);
      setIsDiagnosisModalOpen(false);
      fetchConsultations();
      setSelectedConsultation(null);
      setDiagnosis("");
    } catch (error) {
      console.error("Error saving diagnosis:", error);
    }
  };

  const addPrescription = async () => {
    if (!selectedConsultation || !prescriptionForm.medicationId || prescriptionForm.quantity <= 0) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      setIsSavingPrescription(true);
      await api.consultationPrescriptions.create({
        consultationId: selectedConsultation.id,
        medicationId: prescriptionForm.medicationId,
        quantity: prescriptionForm.quantity,
        instructions: prescriptionForm.instructions,
      });

      fetchConsultations();
      setPrescriptionForm({ medicationId: "", quantity: 0, instructions: "" });
      setIsPrescriptionModalOpen(false);
      setSelectedConsultation(null);
    } catch (error) {
      console.error("Error adding prescription:", error);
      alert("Error al agregar la prescripción");
    } finally {
      setIsSavingPrescription(false);
    }
  };

  const removePrescription = async (prescriptionId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta prescripción?")) return;

    try {
      await api.consultationPrescriptions.remove(prescriptionId);
      fetchConsultations();
    } catch (error) {
      console.error("Error removing prescription:", error);
      alert("Error al eliminar la prescripción");
    }
  };

  const requestSupplies = async () => {
    if (!selectedConsultation) return;
    try {
      const supplyData = {
        consultationId: selectedConsultation.id,
        supplies: supplies.filter((s) => s.name && s.quantity > 0),
        notes: supplyNotes,
        departmentId: selectedConsultation.department.id,
      };
      await api.consultations.update(selectedConsultation.id, { stockRequest: supplyData });
      fetchConsultations();
      setIsSupplyModalOpen(false);
      setSelectedConsultation(null);
      setSupplies([{ id: "1", name: "", quantity: 0 }]);
      setSupplyNotes("");
    } catch (error) {
      console.error("Error requesting supplies:", error);
    }
  };

  const addSupplyRow = () => {
    setSupplies([...supplies, { id: String(supplies.length + 1), name: "", quantity: 0 }]);
  };

  const updateSupply = (index: number, field: string, value: any) => {
    const updated = [...supplies];
    updated[index] = { ...updated[index], [field]: value };
    setSupplies(updated);
  };

  const removeSupply = (index: number) => {
    setSupplies(supplies.filter((_, i) => i !== index));
  };

  const handleAddConsultation = async () => {
    try {
      if (formData.type === "programmed") {
        if (!formData.remissionId || !formData.scheduledAt) {
          alert("Por favor complete todos los campos");
          return;
        }
        const remission = remissions.find((r) => r.id === formData.remissionId);
        await api.consultations.createProgrammed({
          remissionId: formData.remissionId,
          departmentId: remission.toDepartment.id,
          scheduledAt: new Date(formData.scheduledAt),
          remissionType: remission.type,
        });
      } else {
        if (!formData.patientId) {
          alert("Por favor complete todos los campos");
          return;
        }
        await api.consultations.createEmergency({
          patientId: formData.patientId,
        });
      }
      fetchConsultations();
      setIsAddModalOpen(false);
      setFormData({
        type: "emergency",
        patientId: "",
        remissionId: "",
        scheduledAt: "",
      });
    } catch (error) {
      console.error("Error creating consultation:", error);
      alert("Error al crear la consulta");
    }
  };

  useEffect(() => {
    fetchConsultations();
    fetchMedications();
    fetchPatients();
    fetchRemissions();
    setLoading(false);
  }, []);

  const filtered = consultations.filter((c) => {
    const matchesStatus = statusFilter === "all" || !statusFilter ? true : c.status === statusFilter;
    const matchesType = typeFilter === "all" || !typeFilter ? true : c.type === typeFilter;
    const patientName = c.patient
      ? `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase()
      : "";
    const mainDoctorName = c.mainDoctor
      ? `${c.mainDoctor.firstName} ${c.mainDoctor.lastName}`.toLowerCase()
      : "";
    const matchesSearch =
      patientName.includes(search.toLowerCase()) ||
      mainDoctorName.includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const stats = {
    total: consultations.length,
    pending: consultations.filter((c) => c.status === "pending").length,
    closed: consultations.filter((c) => c.status === "closed").length,
    canceled: consultations.filter((c) => c.status === "canceled").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "canceled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "closed":
        return "Cerrada";
      case "canceled":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Consultas</h1>
            <p className="text-muted-foreground">
              Supervisión y seguimiento de consultas médicas
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Consulta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Consultas"
            value={stats.total}
            icon={FileText}
            description="Todas las consultas"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={AlertCircle}
            description="Requieren atención"
          />
          <StatCard
            title="Cerradas"
            value={stats.closed}
            icon={CheckCircle}
            description="Finalizadas"
          />
          <StatCard
            title="Canceladas"
            value={stats.canceled}
            icon={Clock}
            description="Canceladas"
          />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar paciente o doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="programmed">Programada</SelectItem>
                <SelectItem value="emergency">Emergencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Consultations List */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Consultas</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron consultas</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((consultation) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {consultation.patient
                                ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
                                : consultation.externalRemission
                                  ? `${consultation.externalRemission.patient?.firstName} ${consultation.externalRemission.patient?.lastName}`
                                  : consultation.internalRemission
                                    ? `${consultation.internalRemission.patient?.firstName} ${consultation.internalRemission.patient?.lastName}`
                                    : "Consulta"}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {consultation.internalRemission || consultation.externalRemission
                                ? "Programada"
                                : "Emergencia"}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="text-xs uppercase tracking-wide">ID Consulta</p>
                              <p className="font-mono">{consultation.id.slice(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Doctor Principal</p>
                              <p>
                                {consultation.mainDoctor?.firstName} {consultation.mainDoctor?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Departamento</p>
                              <p>{consultation.department.name}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Estado</p>
                              <p className={`font-semibold ${getStatusColor(consultation.status)}`}>
                                {getStatusLabel(consultation.status)}
                              </p>
                            </div>
                            {consultation.scheduledAt && (
                              <div>
                                <p className="text-xs uppercase tracking-wide">Programada</p>
                                <p>{new Date(consultation.scheduledAt).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          {consultation.diagnosis && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                              <p className="text-xs uppercase tracking-wide text-blue-600">Diagnóstico</p>
                              <p className="text-blue-900">{consultation.diagnosis}</p>
                            </div>
                          )}

                          {/* Prescriptions Display */}
                          {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                            <div className="mt-3 p-2 bg-purple-50 rounded text-sm">
                              <p className="text-xs uppercase tracking-wide text-purple-600 font-semibold mb-2">
                                Prescripciones ({consultation.prescriptions.length})
                              </p>
                              <div className="space-y-1">
                                {consultation.prescriptions.map((prescription) => (
                                  <div
                                    key={prescription.id}
                                    className="flex items-center justify-between text-purple-900 text-xs"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {prescription.medication?.name || "Medicamento"}
                                      </span>
                                      {" - "}
                                      <span>
                                        {prescription.quantity} {prescription.medication?.unit || "unidades"}
                                      </span>
                                      {prescription.instructions && (
                                        <div className="text-purple-700 italic mt-0.5">
                                          {prescription.instructions}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => removePrescription(prescription.id)}
                                      className="text-red-600 hover:text-red-800 ml-2"
                                      title="Eliminar prescripción"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedConsultation(consultation);
                              setNewStatus(consultation.status);
                              setIsStatusModalOpen(true);
                            }}
                          >
                            Estado
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedConsultation(consultation);
                              setDiagnosis(consultation.diagnosis || "");
                              setIsDiagnosisModalOpen(true);
                            }}
                          >
                            <Pill className="mr-1 h-4 w-4" />
                            Diagnóstico
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedConsultation(consultation);
                              setPrescriptionForm({ medicationId: "", quantity: 0, instructions: "" });
                              setIsPrescriptionModalOpen(true);
                            }}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Prescripción
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATUS UPDATE MODAL */}
      {isStatusModalOpen && selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Actualizar Estado</h2>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Paciente:{" "}
                {selectedConsultation.patient
                  ? `${selectedConsultation.patient.firstName} ${selectedConsultation.patient.lastName}`
                  : "Remisión"}
              </p>
              <p className="text-sm text-muted-foreground">
                Estado actual: <span className="font-semibold">{getStatusLabel(selectedConsultation.status)}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => updateStatus(selectedConsultation.id, "pending")}
              >
                Pendiente
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => updateStatus(selectedConsultation.id, "closed")}
              >
                Cerrada
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => updateStatus(selectedConsultation.id, "canceled")}
              >
                Cancelada
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedConsultation(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIAGNOSIS MODAL */}
      {isDiagnosisModalOpen && selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Agregar/Editar Diagnóstico</h2>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Paciente:{" "}
                {selectedConsultation.patient
                  ? `${selectedConsultation.patient.firstName} ${selectedConsultation.patient.lastName}`
                  : "Remisión"}
              </p>
            </div>
            <textarea
              className="w-full p-2 border rounded-md mb-4 min-h-24 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ingrese el diagnóstico..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={saveDiagnosis}
              >
                Guardar
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setIsDiagnosisModalOpen(false);
                  setSelectedConsultation(null);
                  setDiagnosis("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIPTION MODAL */}
      {isPrescriptionModalOpen && selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Pill className="h-6 w-6" />
                Agregar Prescripción
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Medicamentos y dosificación para el paciente
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Patient Info Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Paciente</p>
                      <p className="text-lg font-semibold text-blue-900 mt-1">
                        {selectedConsultation.patient
                          ? `${selectedConsultation.patient.firstName} ${selectedConsultation.patient.lastName}`
                          : "Remisión"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Departamento</p>
                      <p className="text-lg font-semibold text-blue-900 mt-1">
                        {selectedConsultation.department.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prescription Form */}
              <div className="space-y-4">
                {/* Medication Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Medicamento <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={prescriptionForm.medicationId}
                    onValueChange={(value) =>
                      setPrescriptionForm({ ...prescriptionForm, medicationId: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-purple-400 focus:border-purple-600">
                      <SelectValue placeholder="Seleccionar medicamento del catálogo..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {medications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No hay medicamentos disponibles
                        </div>
                      ) : (
                        medications.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{med.name}</span>
                              {med.code && <span className="text-gray-500 text-sm">({med.code})</span>}
                              {med.unit && <span className="text-gray-400 text-xs ml-1">{med.unit}</span>}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {prescriptionForm.medicationId && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-700">
                        <span className="font-semibold">Medicamento seleccionado:</span>{" "}
                        {medications.find((m) => m.id === prescriptionForm.medicationId)?.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={prescriptionForm.quantity || ""}
                      onChange={(e) =>
                        setPrescriptionForm({
                          ...prescriptionForm,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Ej: 2, 10, 30..."
                      className="h-11 border-2 border-gray-200 hover:border-purple-400 focus:border-purple-600 text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      {medications.find((m) => m.id === prescriptionForm.medicationId)?.unit || "unidades"}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Instrucciones de Uso
                  </label>
                  <textarea
                    className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-purple-400 focus:border-purple-600 focus:outline-none min-h-24 text-sm resize-none"
                    placeholder="Ej: Tomar 1 comprimido cada 8 horas por 5 días&#10;Con alimentos&#10;No exceder dosis diaria"
                    value={prescriptionForm.instructions}
                    onChange={(e) =>
                      setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {prescriptionForm.instructions.length} caracteres
                  </p>
                </div>

                {/* Current Prescriptions List */}
                {selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Prescripciones actuales ({selectedConsultation.prescriptions.length})
                    </p>
                    <div className="space-y-2">
                      {selectedConsultation.prescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {prescription.medication?.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {prescription.quantity} {prescription.medication?.unit || "unidades"}
                            </p>
                            {prescription.instructions && (
                              <p className="text-xs text-gray-500 italic mt-1">
                                {prescription.instructions}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removePrescription(prescription.id)}
                            className="ml-2 p-2 hover:bg-red-100 rounded transition-colors text-red-600 hover:text-red-700"
                            title="Eliminar prescripción"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                className="px-6 h-11 font-semibold"
                onClick={() => {
                  setIsPrescriptionModalOpen(false);
                  setSelectedConsultation(null);
                  setPrescriptionForm({ medicationId: "", quantity: 0, instructions: "" });
                }}
                disabled={isSavingPrescription}
              >
                Cancelar
              </Button>
              <Button
                className="px-8 h-11 font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2"
                onClick={addPrescription}
                disabled={
                  isSavingPrescription ||
                  !prescriptionForm.medicationId ||
                  prescriptionForm.quantity <= 0
                }
              >
                {isSavingPrescription ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Agregar Prescripción
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIES REQUEST MODAL */}
      {isSupplyModalOpen && selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-semibold mb-4">Solicitar Suministros</h2>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Paciente:{" "}
                {selectedConsultation.patient
                  ? `${selectedConsultation.patient.firstName} ${selectedConsultation.patient.lastName}`
                  : "Remisión"}
              </p>
              <p className="text-sm text-muted-foreground">
                Departamento: {selectedConsultation.department.name}
              </p>
            </div>

            <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
              {supplies.map((supply, index) => (
                <div key={supply.id} className="flex gap-2 items-end">
                  <Input
                    placeholder="Nombre del suministro"
                    value={supply.name}
                    onChange={(e) => updateSupply(index, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={supply.quantity}
                    onChange={(e) => updateSupply(index, "quantity", parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  {supplies.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSupply(index)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={addSupplyRow}
            >
              + Agregar Suministro
            </Button>

            <textarea
              className="w-full p-2 border rounded-md mb-4 min-h-20 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Notas adicionales..."
              value={supplyNotes}
              onChange={(e) => setSupplyNotes(e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={requestSupplies}
              >
                Solicitar
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setIsSupplyModalOpen(false);
                  setSelectedConsultation(null);
                  setSupplies([{ id: "1", name: "", quantity: 0 }]);
                  setSupplyNotes("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONSULTATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-semibold mb-4">Nueva Consulta</h2>

            <Select
              value={formData.type}
              onValueChange={(value) => {
                setFormData({
                  type: value as "programmed" | "emergency",
                  patientId: "",
                  remissionId: "",
                  scheduledAt: "",
                });
              }}
            >
              <SelectTrigger className="mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergencia</SelectItem>
                <SelectItem value="programmed">Programada</SelectItem>
              </SelectContent>
            </Select>

            {formData.type === "emergency" ? (
              <>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Select
                  value={formData.remissionId}
                  onValueChange={(value) => setFormData({ ...formData, remissionId: value })}
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="Seleccionar remisión" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRemissions().length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No hay remisiones disponibles (todas ya tienen consulta)
                      </div>
                    ) : (
                      getAvailableRemissions().map((remission) => (
                        <SelectItem key={remission.id} value={remission.id}>
                          {remission.patient.firstName} {remission.patient.lastName} - {remission.toDepartment.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="mb-3"
                />
              </>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={handleAddConsultation}
              >
                Crear
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormData({
                    type: "emergency",
                    patientId: "",
                    remissionId: "",
                    scheduledAt: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function HeadConsultationsPage() {
  return <HeadConsultationsContent />;
}