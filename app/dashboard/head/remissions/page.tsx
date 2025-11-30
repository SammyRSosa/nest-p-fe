"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Send, FileText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";

interface Remission {
  id: string;
  type: "internal" | "external";
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  toDepartment: {
    id: string;
    name: string;
  };
  fromDepartment?: {
    id: string;
    name: string;
  };
  medicalPost?: {
    id: string;
    name: string;
  };
  consultation?: {
    id: string;
  };
  createdAt: Date;
}

function HeadRemissionsContent() {
  const [remissions, setRemissions] = useState<Remission[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [medicalPosts, setMedicalPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRemission, setSelectedRemission] = useState<Remission | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: "internal" as "internal" | "external",
    patientId: "",
    toDepartmentId: "",
    fromDepartmentId: "",
    medicalPostId: "",
  });

  const fetchRemissions = async () => {
    try {
      const data = await api.remissions.getAll();
      setRemissions(data);
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

  const fetchDepartments = async () => {
    try {
      const data = await api.departments.getAll();
      setDepartments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMedicalPosts = async () => {
    try {
      // Asumiendo que existe un endpoint para obtener posts médicos
      // Si no existe, ajusta según tu API
      const data = await api.medicalPosts?.getAll?.() || [];
      setMedicalPosts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRemission = async () => {
    try {
      if (!formData.patientId || !formData.toDepartmentId) {
        alert("Por favor complete los campos requeridos");
        return;
      }

      if (formData.type === "internal" && !formData.fromDepartmentId) {
        alert("Por favor seleccione el departamento de origen");
        return;
      }

      if (formData.type === "external" && !formData.medicalPostId) {
        alert("Por favor seleccione el post médico");
        return;
      }

      await api.remissions.create({
        type: formData.type,
        patientId: formData.patientId,
        toDepartmentId: formData.toDepartmentId,
        fromDepartmentId: formData.type === "internal" ? formData.fromDepartmentId : undefined,
        medicalPostId: formData.type === "external" ? formData.medicalPostId : undefined,
      });

      fetchRemissions();
      setIsAddModalOpen(false);
      setFormData({
        type: "internal",
        patientId: "",
        toDepartmentId: "",
        fromDepartmentId: "",
        medicalPostId: "",
      });
    } catch (error) {
      console.error("Error creating remission:", error);
      alert("Error al crear la remisión");
    }
  };

  const handleEditRemission = async () => {
    if (!selectedRemission) return;
    try {
      if (!formData.patientId || !formData.toDepartmentId) {
        alert("Por favor complete los campos requeridos");
        return;
      }

      await api.remissions.create({
        type: formData.type,
        patientId: formData.patientId,
        toDepartmentId: formData.toDepartmentId,
        fromDepartmentId: formData.type === "internal" ? formData.fromDepartmentId : undefined,
        medicalPostId: formData.type === "external" ? formData.medicalPostId : undefined,
      });

      fetchRemissions();
      setIsEditModalOpen(false);
      setSelectedRemission(null);
      setFormData({
        type: "internal",
        patientId: "",
        toDepartmentId: "",
        fromDepartmentId: "",
        medicalPostId: "",
      });
    } catch (error) {
      console.error("Error updating remission:", error);
      alert("Error al actualizar la remisión");
    }
  };

  const handleDeleteRemission = async () => {
    if (!selectedRemission) return;
    try {
      await api.remissions.delete?.(selectedRemission.id);
      fetchRemissions();
      setIsDeleteModalOpen(false);
      setSelectedRemission(null);
    } catch (error) {
      console.error("Error deleting remission:", error);
      alert("Error al eliminar la remisión");
    }
  };

  useEffect(() => {
    fetchRemissions();
    fetchPatients();
    fetchDepartments();
    fetchMedicalPosts();
    setLoading(false);
  }, []);

  const filtered = remissions.filter((r) => {
    const matchesType = typeFilter ? r.type === typeFilter : true;
    const matchesSearch =
      `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      r.toDepartment.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: remissions.length,
    internal: remissions.filter((r) => r.type === "internal").length,
    external: remissions.filter((r) => r.type === "external").length,
    withConsultation: remissions.filter((r) => r.consultation).length,
  };

  const getTypeLabel = (type: string) => {
    return type === "internal" ? "Interna" : "Externa";
  };

  const openEdit = (remission: Remission) => {
    setSelectedRemission(remission);
    setFormData({
      type: remission.type,
      patientId: remission.patient.id,
      toDepartmentId: remission.toDepartment.id,
      fromDepartmentId: remission.fromDepartment?.id || "",
      medicalPostId: remission.medicalPost?.id || "",
    });
    setIsEditModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Remisiones</h1>
            <p className="text-muted-foreground">
              Administración y seguimiento de remisiones médicas
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Remisión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Remisiones"
            value={stats.total}
            icon={FileText}
            description="Todas las remisiones"
          />
          <StatCard
            title="Remisiones Internas"
            value={stats.internal}
            icon={ArrowRight}
            description="Dentro del hospital"
          />
          <StatCard
            title="Remisiones Externas"
            value={stats.external}
            icon={Send}
            description="A otros centros"
          />
          <StatCard
            title="Con Consulta"
            value={stats.withConsultation}
            icon={FileText}
            description="Ya tienen consulta"
          />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar paciente o departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Interna</SelectItem>
                <SelectItem value="external">Externa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Remissions List */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Remisiones</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron remisiones</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((remission) => (
                <motion.div
                  key={remission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {remission.patient?.firstName || "N/A"} {remission.patient?.lastName || ""}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              remission.type === "internal"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}>
                              {getTypeLabel(remission.type)}
                            </span>
                            {remission.consultation && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Con Consulta
                              </span>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="text-xs uppercase tracking-wide">ID Remisión</p>
                              <p className="font-mono">{remission.id.slice(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Departamento Destino</p>
                              <p>{remission.toDepartment?.name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">
                                {remission.type === "internal" ? "Departamento Origen" : "Post Médico"}
                              </p>
                              <p>
                                {remission.type === "internal"
                                  ? remission.fromDepartment?.name || "N/A"
                                  : remission.medicalPost?.name || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide">Fecha de Creación</p>
                              <p>{new Date(remission.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(remission)}
                          >
                            <Edit2 className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRemission(remission);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Eliminar
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

      {/* ADD REMISSION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-semibold mb-4">Nueva Remisión</h2>

            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "internal" | "external",
                  fromDepartmentId: "",
                  medicalPostId: "",
                })
              }
            >
              <SelectTrigger className="mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Remisión Interna</SelectItem>
                <SelectItem value="external">Remisión Externa</SelectItem>
              </SelectContent>
            </Select>

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
                    {patient?.firstName || "N/A"} {patient?.lastName || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.toDepartmentId}
              onValueChange={(value) => setFormData({ ...formData, toDepartmentId: value })}
            >
              <SelectTrigger className="mb-3">
                <SelectValue placeholder="Seleccionar departamento destino" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept?.name || "N/A"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.type === "internal" ? (
              <Select
                value={formData.fromDepartmentId}
                onValueChange={(value) => setFormData({ ...formData, fromDepartmentId: value })}
              >
                <SelectTrigger className="mb-3">
                  <SelectValue placeholder="Seleccionar departamento de origen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={formData.medicalPostId}
                onValueChange={(value) => setFormData({ ...formData, medicalPostId: value })}
              >
                <SelectTrigger className="mb-3">
                  <SelectValue placeholder="Seleccionar post médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicalPosts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={handleAddRemission}
              >
                Crear
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormData({
                    type: "internal",
                    patientId: "",
                    toDepartmentId: "",
                    fromDepartmentId: "",
                    medicalPostId: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REMISSION MODAL */}
      {isEditModalOpen && selectedRemission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-semibold mb-4">Editar Remisión</h2>

            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "internal" | "external",
                  fromDepartmentId: "",
                  medicalPostId: "",
                })
              }
            >
              <SelectTrigger className="mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Remisión Interna</SelectItem>
                <SelectItem value="external">Remisión Externa</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData({ ...formData, patientId: value })}
            >
              <SelectTrigger className="mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient?.firstName || "N/A"} {patient?.lastName || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.toDepartmentId}
              onValueChange={(value) => setFormData({ ...formData, toDepartmentId: value })}
            >
              <SelectTrigger className="mb-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept?.name || "N/A"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.type === "internal" ? (
              <Select
                value={formData.fromDepartmentId}
                onValueChange={(value) => setFormData({ ...formData, fromDepartmentId: value })}
              >
                <SelectTrigger className="mb-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={formData.medicalPostId}
                onValueChange={(value) => setFormData({ ...formData, medicalPostId: value })}
              >
                <SelectTrigger className="mb-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {medicalPosts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={handleEditRemission}
              >
                Guardar
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedRemission(null);
                  setFormData({
                    type: "internal",
                    patientId: "",
                    toDepartmentId: "",
                    fromDepartmentId: "",
                    medicalPostId: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedRemission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Eliminar Remisión</h2>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Está seguro de que desea eliminar esta remisión de {selectedRemission.patient?.firstName}{" "}
              {selectedRemission.patient?.lastName}? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteRemission}
              >
                Eliminar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedRemission(null);
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

export default function HeadRemissionsPage() {
  return <HeadRemissionsContent />;
}