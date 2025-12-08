"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Plus, Trash2, Send, FileText, ArrowRight, AlertCircle, Building2, Edit2 } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";

interface MedicalPost {
  id: string;
  name: string;
  createdAt?: Date;
}

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
  const [medicalPosts, setMedicalPosts] = useState<MedicalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRemission, setSelectedRemission] = useState<Remission | null>(null);
  const [selectedMedicalPost, setSelectedMedicalPost] = useState<MedicalPost | null>(null);
  const [isAddRemissionModalOpen, setIsAddRemissionModalOpen] = useState(false);
  const [isDeleteRemissionModalOpen, setIsDeleteRemissionModalOpen] = useState(false);
  const [isManageMedicalPostsModalOpen, setIsManageMedicalPostsModalOpen] = useState(false);
  const [isAddMedicalPostModalOpen, setIsAddMedicalPostModalOpen] = useState(false);
  const [isDeleteMedicalPostModalOpen, setIsDeleteMedicalPostModalOpen] = useState(false);
  const [newPostName, setNewPostName] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);

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
      const data = await api.medicalPosts.getAll();
      setMedicalPosts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMedicalPost = async () => {
    if (!newPostName.trim()) {
      alert("Por favor ingrese el nombre del post médico");
      return;
    }

    try {
      setIsSavingPost(true);
      await api.medicalPosts.create(newPostName);
      fetchMedicalPosts();
      setNewPostName("");
      alert("Post médico creado exitosamente");
    } catch (error) {
      console.error("Error creating medical post:", error);
      alert("Error al crear el post médico");
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeleteMedicalPost = async () => {
    if (!selectedMedicalPost) return;

    try {
      await api.medicalPosts.remove(selectedMedicalPost.id);
      fetchMedicalPosts();
      setIsDeleteMedicalPostModalOpen(false);
      setSelectedMedicalPost(null);
      alert("Post médico eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting medical post:", error);
      alert("Error al eliminar el post médico");
    }
  };

  const handleAddRemission = async () => {
    try {
      if (!formData.patientId || !formData.toDepartmentId) {
        alert("Por favor complete los campos requeridos");
        return;
      }

      if (formData.type === "internal") {
        if (!formData.fromDepartmentId) {
          alert("Por favor seleccione el departamento de origen");
          return;
        }
        await api.remissions.createInternal({
          patientId: formData.patientId,
          fromDepartmentId: formData.fromDepartmentId,
          toDepartmentId: formData.toDepartmentId,
        });
      } else {
        if (!formData.medicalPostId) {
          alert("Por favor seleccione el post médico");
          return;
        }
        await api.remissions.createExternal({
          patientId: formData.patientId,
          toDepartmentId: formData.toDepartmentId,
          medicalPostId: formData.medicalPostId,
        });
      }

      fetchRemissions();
      setIsAddRemissionModalOpen(false);
      resetForm();
      alert("Remisión creada exitosamente");
    } catch (error) {
      console.error("Error creating remission:", error);
      alert("Error al crear la remisión");
    }
  };

  const handleDeleteRemission = async () => {
    if (!selectedRemission) return;
    try {
      await api.remissions.delete(selectedRemission.id);
      fetchRemissions();
      setIsDeleteRemissionModalOpen(false);
      setSelectedRemission(null);
      alert("Remisión eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting remission:", error);
      alert("Error al eliminar la remisión");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "internal",
      patientId: "",
      toDepartmentId: "",
      fromDepartmentId: "",
      medicalPostId: "",
    });
  };

  useEffect(() => {
    Promise.all([
      fetchRemissions(),
      fetchPatients(),
      fetchDepartments(),
      fetchMedicalPosts(),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = remissions.filter((r) => {
    const matchesType = typeFilter === "all" || !typeFilter ? true : r.type === typeFilter;
    const matchesSearch =
      `${r.patient?.firstName || ""} ${r.patient?.lastName || ""}`.toLowerCase().includes(search.toLowerCase()) ||
      r.toDepartment?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (r.fromDepartment?.name?.toLowerCase().includes(search.toLowerCase())) ||
      (r.medicalPost?.name?.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const stats = {
    total: remissions.length,
    internal: remissions.filter((r) => r.type === "internal").length,
    external: remissions.filter((r) => r.type === "external").length,
    withConsultation: remissions.filter((r) => r.consultation).length,
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
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsManageMedicalPostsModalOpen(true)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Posts Médicos
            </Button>
            <Button className="bg-accent hover:bg-accent/90" onClick={() => setIsAddRemissionModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Remisión
            </Button>
          </div>
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
                <SelectItem value="all">Todos</SelectItem>
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
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg">
                              {remission.patient?.firstName || "N/A"} {remission.patient?.lastName || ""}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              remission.type === "internal"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}>
                              {remission.type === "internal" ? "Interna" : "Externa"}
                            </span>
                            {remission.consultation && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                Con Consulta
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">ID</p>
                              <p className="font-mono text-gray-700">{remission.id.slice(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">Departamento Destino</p>
                              <p className="text-gray-700">{remission.toDepartment?.name || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">
                                {remission.type === "internal" ? "Origen" : "Post Médico"}
                              </p>
                              <p className="text-gray-700">
                                {remission.type === "internal"
                                  ? remission.fromDepartment?.name || "N/A"
                                  : remission.medicalPost?.name || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">Fecha</p>
                              <p className="text-gray-700">
                                {new Date(remission.createdAt).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRemission(remission);
                            setIsDeleteRemissionModalOpen(true);
                          }}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      {isAddRemissionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h2 className="text-xl font-semibold mb-4">Nueva Remisión</h2>

            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  type: value as "internal" | "external",
                  patientId: formData.patientId,
                  toDepartmentId: formData.toDepartmentId,
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
                  {departments.filter(d => d.id !== formData.toDepartmentId).map((dept) => (
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
                  setIsAddRemissionModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE MEDICAL POSTS MODAL */}
      {isManageMedicalPostsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Gestionar Posts Médicos
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Agregar y administrar los posts médicos externos
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Add New Post */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Post Médico</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre del post médico"
                    value={newPostName}
                    onChange={(e) => setNewPostName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAddMedicalPost}
                    disabled={isSavingPost || !newPostName.trim()}
                  >
                    {isSavingPost ? "Guardando..." : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Medical Posts List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Posts Médicos Registrados ({medicalPosts.length})
                </h3>
                {medicalPosts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay posts médicos registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {medicalPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{post.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {post.id}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedMedicalPost(post);
                                setIsDeleteMedicalPostModalOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsManageMedicalPostsModalOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE REMISSION CONFIRMATION MODAL */}
      {isDeleteRemissionModalOpen && selectedRemission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-600">Eliminar Remisión</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Está seguro de que desea eliminar la remisión de{" "}
              <span className="font-semibold">
                {selectedRemission.patient?.firstName} {selectedRemission.patient?.lastName}
              </span>
              ? Esta acción no se puede deshacer.
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
                  setIsDeleteRemissionModalOpen(false);
                  setSelectedRemission(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MEDICAL POST CONFIRMATION MODAL */}
      {isDeleteMedicalPostModalOpen && selectedMedicalPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-600">Eliminar Post Médico</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Está seguro de que desea eliminar el post médico{" "}
              <span className="font-semibold">{selectedMedicalPost.name}</span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteMedicalPost}
              >
                Eliminar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteMedicalPostModalOpen(false);
                  setSelectedMedicalPost(null);
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