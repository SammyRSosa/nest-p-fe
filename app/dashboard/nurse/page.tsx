"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, FileText, Eye, Heart, TrendingUp, Calendar, User, Stethoscope } from "lucide-react";
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

function NurseConsultationsContent() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);

  const fetchConsultations = async () => {
    try {
      const data = await api.consultations.getByNurse();
      setConsultations(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConsultations();
    setLoading(false);
  }, []);

  const filtered = consultations.filter((c) => {
    const matchesStatus = statusFilter === "all" || !statusFilter ? true : c.status === statusFilter;
    const patientName = c.patient
      ? `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase()
      : "";
    const mainDoctorName = c.mainDoctor
      ? `${c.mainDoctor.firstName} ${c.mainDoctor.lastName}`.toLowerCase()
      : "";
    const matchesSearch =
      patientName.includes(search.toLowerCase()) ||
      mainDoctorName.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: consultations.length,
    pending: consultations.filter((c) => c.status === "pending").length,
    closed: consultations.filter((c) => c.status === "closed").length,
    upcomingScheduled: consultations.filter(
      (c) => c.type === "programmed" && new Date(c.scheduledAt || 0) > new Date()
    ).length,
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

  const getStatusBg = (status: string) => {
    switch (status) {
      case "closed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      case "canceled":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Panel de Enfermería
            </h1>
            <p className="text-muted-foreground mt-1">
              Seguimiento y monitoreo de consultas asignadas
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="font-semibold">{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Consultas"
            value={stats.total}
            icon={FileText}
            description="En seguimiento"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={AlertCircle}
            description="Requieren atención"
          />
          <StatCard
            title="Finalizadas"
            value={stats.closed}
            icon={CheckCircle}
            description="Completadas"
          />
          <StatCard
            title="Próximas"
            value={stats.upcomingScheduled}
            icon={Calendar}
            description="Programadas"
          />
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Filtros y Búsqueda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar paciente o doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-purple-200 focus:ring-purple-500"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-purple-200">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Consultas Asignadas</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando consultas...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="pt-12 pb-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No se encontraron consultas</p>
                <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((consultation, idx) => (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
                    consultation.status === "pending"
                      ? "border-l-yellow-500 hover:border-l-yellow-600"
                      : consultation.status === "closed"
                      ? "border-l-green-500 hover:border-l-green-600"
                      : "border-l-red-500 hover:border-l-red-600"
                  } ${getStatusBg(consultation.status)}`}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Main Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                                {consultation.patient?.firstName?.charAt(0)}{consultation.patient?.lastName?.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {consultation.patient
                                    ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
                                    : "Consulta de Remisión"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  ID: {consultation.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(consultation.status)} ${getStatusBg(consultation.status)} border`}>
                                {getStatusLabel(consultation.status)}
                              </span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                {consultation.internalRemission || consultation.externalRemission
                                ? "Programada"
                                : "Emergencia"}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedConsultation(consultation);
                              setIsDetailsModalOpen(true);
                            }}
                            className="border-purple-300 hover:bg-purple-50"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Button>
                        </div>

                        {/* Grid Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-t border-b">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Doctor</p>
                            <p className="font-medium text-sm mt-1">
                              {consultation.mainDoctor?.firstName} {consultation.mainDoctor?.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Departamento</p>
                            <p className="font-medium text-sm mt-1">{consultation.department.name}</p>
                          </div>
                          {consultation.scheduledAt && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Programada</p>
                              <p className="font-medium text-sm mt-1">
                                {new Date(consultation.scheduledAt).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Creada</p>
                            <p className="font-medium text-sm mt-1">
                              {new Date(consultation.createdAt).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>

                        {/* Diagnosis Section */}
                        {consultation.diagnosis && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold flex items-center gap-2 mb-2">
                              <Stethoscope className="h-4 w-4" />
                              Diagnóstico
                            </p>
                            <p className="text-sm text-blue-900">{consultation.diagnosis}</p>
                          </div>
                        )}

                        {/* Prescriptions Section */}
                        {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                          <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                            <button
                              onClick={() => setExpandedConsultationId(
                                expandedConsultationId === consultation.id ? null : consultation.id
                              )}
                              className="w-full flex items-center justify-between"
                            >
                              <p className="text-xs uppercase tracking-wide text-pink-600 font-semibold flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                Medicamentos ({consultation.prescriptions.length})
                              </p>
                              <span className="text-pink-600">
                                {expandedConsultationId === consultation.id ? "▼" : "▶"}
                              </span>
                            </button>
                            {expandedConsultationId === consultation.id && (
                              <div className="mt-3 space-y-2">
                                {consultation.prescriptions.map((prescription) => (
                                  <div
                                    key={prescription.id}
                                    className="p-2 bg-white rounded border border-pink-100"
                                  >
                                    <p className="font-medium text-sm text-pink-900">
                                      {prescription.medication?.name || "Medicamento"}
                                    </p>
                                    <p className="text-xs text-pink-700 mt-1">
                                      <span className="font-semibold">Cantidad:</span> {prescription.quantity} {prescription.medication?.unit || "unidades"}
                                    </p>
                                    {prescription.instructions && (
                                      <p className="text-xs text-pink-600 italic mt-2 p-2 bg-pink-100 rounded">
                                        {prescription.instructions}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <User className="h-6 w-6" />
                Detalles de Consulta
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Información completa del paciente y consulta
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="text-sm uppercase tracking-wide font-bold text-blue-700 mb-4">Información del Paciente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Nombre Completo</p>
                      <p className="font-semibold text-blue-900 mt-1">
                        {selectedConsultation.patient?.firstName} {selectedConsultation.patient?.lastName}
                      </p>
                    </div>
                    {selectedConsultation.patient?.idNumber && (
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Número de ID</p>
                        <p className="font-semibold text-blue-900 mt-1">{selectedConsultation.patient.idNumber}</p>
                      </div>
                    )}
                    {selectedConsultation.patient?.dateOfBirth && (
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Fecha de Nacimiento</p>
                        <p className="font-semibold text-blue-900 mt-1">
                          {new Date(selectedConsultation.patient.dateOfBirth).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    )}
                    {selectedConsultation.patient?.email && (
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Email</p>
                        <p className="font-semibold text-blue-900 mt-1 truncate">{selectedConsultation.patient.email}</p>
                      </div>
                    )}
                    {selectedConsultation.patient?.phone && (
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">Teléfono</p>
                        <p className="font-semibold text-blue-900 mt-1">{selectedConsultation.patient.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Consultation Info */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6">
                  <h3 className="text-sm uppercase tracking-wide font-bold text-purple-700 mb-4">Información de Consulta</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-purple-600 font-semibold">ID Consulta</p>
                      <p className="font-mono font-semibold text-purple-900 mt-1">{selectedConsultation.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-semibold">Estado</p>
                      <p className={`font-semibold mt-1 ${getStatusColor(selectedConsultation.status)}`}>
                        {getStatusLabel(selectedConsultation.status)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-semibold">Tipo</p>
                      <p className="font-semibold text-purple-900 mt-1">
                        {selectedConsultation.type === "programmed" ? "Programada" : "Emergencia"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-semibold">Departamento</p>
                      <p className="font-semibold text-purple-900 mt-1">{selectedConsultation.department.name}</p>
                    </div>
                    {selectedConsultation.scheduledAt && (
                      <div>
                        <p className="text-xs text-purple-600 font-semibold">Fecha Programada</p>
                        <p className="font-semibold text-purple-900 mt-1">
                          {new Date(selectedConsultation.scheduledAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-purple-600 font-semibold">Fecha de Creación</p>
                      <p className="font-semibold text-purple-900 mt-1">
                        {new Date(selectedConsultation.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Info */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <h3 className="text-sm uppercase tracking-wide font-bold text-green-700 mb-4">Doctor Principal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-green-600 font-semibold">Nombre</p>
                      <p className="font-semibold text-green-900 mt-1">
                        {selectedConsultation.mainDoctor?.firstName} {selectedConsultation.mainDoctor?.lastName}
                      </p>
                    </div>
                    {selectedConsultation.mainDoctor?.code && (
                      <div>
                        <p className="text-xs text-green-600 font-semibold">Código</p>
                        <p className="font-semibold text-green-900 mt-1">{selectedConsultation.mainDoctor.code}</p>
                      </div>
                    )}
                    {selectedConsultation.mainDoctor?.role && (
                      <div>
                        <p className="text-xs text-green-600 font-semibold">Rol</p>
                        <p className="font-semibold text-green-900 mt-1">{selectedConsultation.mainDoctor.role}</p>
                      </div>
                    )}
                    {selectedConsultation.mainDoctor?.email && (
                      <div>
                        <p className="text-xs text-green-600 font-semibold">Email</p>
                        <p className="font-semibold text-green-900 mt-1 truncate">{selectedConsultation.mainDoctor.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Diagnosis */}
              {selectedConsultation.diagnosis && (
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="pt-6">
                    <h3 className="text-sm uppercase tracking-wide font-bold text-yellow-700 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Diagnóstico
                    </h3>
                    <p className="text-yellow-900 leading-relaxed">{selectedConsultation.diagnosis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Prescriptions */}
              {selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0 && (
                <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                  <CardContent className="pt-6">
                    <h3 className="text-sm uppercase tracking-wide font-bold text-pink-700 mb-4 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Medicamentos Prescritos ({selectedConsultation.prescriptions.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedConsultation.prescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className="p-4 bg-white rounded-lg border border-pink-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-pink-900">
                                {prescription.medication?.name || "Medicamento"}
                              </p>
                              <p className="text-sm text-pink-700 mt-2">
                                <span className="font-semibold">Cantidad:</span> {prescription.quantity} {prescription.medication?.unit || "unidades"}
                              </p>
                              {prescription.instructions && (
                                <div className="mt-3 p-3 bg-pink-50 rounded border border-pink-200">
                                  <p className="text-xs font-semibold text-pink-600 mb-1">Instrucciones:</p>
                                  <p className="text-sm text-pink-900 whitespace-pre-wrap">
                                    {prescription.instructions}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <Button
                className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedConsultation(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function NurseConsultationsPage() {
  return <NurseConsultationsContent />;
}