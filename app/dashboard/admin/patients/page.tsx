"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TableList } from "@/components/table-list";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Activity, UserCog, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types";

function AdminPatientsContent() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal state
  const [modalType, setModalType] = useState<"create" | "edit" | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await api.patients.getAll();
      setPatients(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los pacientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Helpers ---
  const openCreate = () => {
    resetForm();
    setSelectedPatient(null);
    setModalType("create");
  };

  const openEdit = (patient: any) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      idNumber: patient.idNumber || "",
      email: patient.email || "",
      phone: patient.phone || "",
      dateOfBirth: patient.dateOfBirth?.split("T")[0] || "",
    });
    setModalType("edit");
  };

  const closeModal = () => {
    resetForm();
    setSelectedPatient(null);
    setModalType(null);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      idNumber: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    });
  };

  const handleInput = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // --- CREATE ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.patients.create(formData);

      toast({ title: "Paciente creado correctamente" });

      closeModal();
      loadPatients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el paciente",
        variant: "destructive",
      });
    }
  };

  // --- EDIT ---
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.patients.update(selectedPatient.id, formData);

      toast({ title: "Paciente actualizado correctamente" });

      closeModal();
      loadPatients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el paciente",
        variant: "destructive",
      });
    }
  };

  // --- DELETE ---
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que desea eliminar este paciente?")) return;

    try {
      await api.patients.delete(id);
      toast({ title: "Paciente eliminado correctamente" });
      loadPatients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el paciente",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "idNumber", label: "Carnet" },
    { key: "email", label: "Correo" },
    { key: "phone", label: "Teléfono" },
    { key: "dateOfBirth", label: "Nacimiento" },
    {
      key: "actions",
      label: "Acciones",
      render: (patient: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(patient)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(patient.id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
            <p className="text-muted-foreground">
              Administración de pacientes registrados
            </p>
          </div>

          <Button className="bg-accent hover:bg-accent/90" onClick={openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pacientes"
            value={patients.length}
            icon={Users}
            description="Pacientes registrados"
          />
          <StatCard
            title="Admins"
            value={patients.filter((u) => u.role === "admin").length}
            icon={Shield}
            description="Cuentas admin"
          />
          <StatCard
            title="Doctores"
            value={patients.filter((u) => u.role === "doctor").length}
            icon={Activity}
            description="Cuentas médicas"
          />
          <StatCard
            title="Pacientes"
            value={patients.filter((u) => u.role === "patient").length}
            icon={UserCog}
            description="Usuarios activos"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Pacientes</h2>

          {loading ? (
            <p className="text-center py-6 text-muted-foreground">Cargando...</p>
          ) : (
            <TableList
              data={patients}
              columns={columns}
              searchPlaceholder="Buscar paciente..."
            />
          )}
        </div>
      </div>

      {/* ---- MODAL (Create + Edit) ---- */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {modalType === "create" ? "Nuevo Paciente" : "Editar Paciente"}
            </h2>

            <form
              className="space-y-3"
              onSubmit={modalType === "create" ? handleCreate : handleEdit}
            >
              <input
                className="input w-full"
                placeholder="Nombre"
                value={formData.firstName}
                onChange={(e) => handleInput("firstName", e.target.value)}
                required
              />
              <input
                className="input w-full"
                placeholder="Apellido"
                value={formData.lastName}
                onChange={(e) => handleInput("lastName", e.target.value)}
                required
              />
              <input
                className="input w-full"
                placeholder="Carnet"
                value={formData.idNumber}
                onChange={(e) => handleInput("idNumber", e.target.value)}
              />
              <input
                className="input w-full"
                placeholder="Correo"
                type="email"
                value={formData.email}
                onChange={(e) => handleInput("email", e.target.value)}
              />
              <input
                className="input w-full"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={(e) => handleInput("phone", e.target.value)}
              />
              <input
                className="input w-full"
                type="date"
                placeholder="Fecha de nacimiento"
                value={formData.dateOfBirth}
                onChange={(e) => handleInput("dateOfBirth", e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {modalType === "create" ? "Crear" : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AdminPatientsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <AdminPatientsContent />
    </ProtectedRoute>
  );
}
