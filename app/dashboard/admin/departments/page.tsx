'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Crown, AlertCircle, X, Loader2, Building2, Search, Mail, IdCard } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useDepartments } from '@/hooks/useDepartments';
import type { Department, User } from '@/types';
import { UserRole } from '@/types';
import { motion } from 'framer-motion';

function DepartmentsContent() {
  const { departments, loading, fetchDepartments } = useDepartments();
  const [modalType, setModalType] = useState<'create' | 'edit' | 'staff' | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '' });
  const [workers, setWorkers] = useState<User[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [headWorkerSelection, setHeadWorkerSelection] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedDept && modalType === 'staff') {
      setHeadWorkerSelection(selectedDept.headOfDepartment?.worker?.id || '');
      const assignedIds = selectedDept.workers?.map(w => w.id) || [];
      setAvailableWorkers(workers.filter(w => !assignedIds.includes(w.id)));
    }
  }, [selectedDept, modalType, workers]);

  const fetchWorkers = async () => {
    try {
      const data = await api.workers.getAll();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '' });
    setSelectedDept(null);
    setModalType('create');
  };

  const openEditModal = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({ name: dept.name });
    setModalType('edit');
  };

  const openStaffModal = (dept: Department) => {
    setSelectedDept(dept);
    setSelectedWorker('');
    setModalType('staff');
  };

  const handleSaveDepartment = async () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setModalLoading(true);
    try {
      if (selectedDept) {
        await api.departments.update(selectedDept.id, { name: formData.name, headWorkerId: selectedDept.headOfDepartment?.worker?.id || '' });
      } else {
        await api.departments.create({ name: formData.name, headWorkerId: '' });
      }
      await fetchDepartments();
      setModalType(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el departamento');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!selectedWorker || !selectedDept) return;

    setModalLoading(true);
    try {
      await api.workerDepartments.assign({
        workerId: selectedWorker,
        departmentId: selectedDept.id,
      });
      await fetchDepartments();
      setSelectedWorker('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar trabajador');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateHead = async () => {
    if (!headWorkerSelection || !selectedDept) return;

    setModalLoading(true);
    try {
      await api.departments.update(selectedDept.id, {
        name: selectedDept.name,
        headWorkerId: headWorkerSelection,
      });
      await fetchDepartments();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar jefe del departamento');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (!selectedDept) return;

    setModalLoading(true);
    try {
      const assignments = await api.workerDepartments.getById(selectedDept.id);
      const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.worker?.id === workerId) : assignments;
      
      if (assignment?.id) {
        await api.workerDepartments.remove(assignment.id);
        await fetchDepartments();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al remover trabajador');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('¿Estás seguro?')) return;

    try {
      await api.departments.delete(deptId);
      await fetchDepartments();
      setSelectedDept(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar departamento');
    }
  };

  const filteredDepts = (departments || []).filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: departments?.length || 0,
    workers: departments?.reduce((sum, d) => sum + (d.workers?.length || 0), 0) || 0,
    withHead: departments?.filter(d => d.headOfDepartment).length || 0,
    withoutHead: departments?.filter(d => !d.headOfDepartment).length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Gestión de Departamentos
            </h1>
            <p className="text-muted-foreground mt-2">Administra departamentos y asigna personal</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="font-semibold text-accent">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Departamentos" value={stats.total} icon={Building2} description="Departamentos activos" />
          <StatCard title="Personal Total" value={stats.workers} icon={Users} description="Trabajadores asignados" />
          <StatCard title="Con Jefe" value={stats.withHead} icon={Crown} description="Asignados" />
          <StatCard title="Sin Jefe" value={stats.withoutHead} icon={AlertCircle} description="Por asignar" />
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg p-6 border border-accent/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" />
            Búsqueda
          </h2>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-accent/20"
              />
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-white" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Departamento
            </Button>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Departamentos</h2>
            <p className="text-sm text-muted-foreground">{filteredDepts.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando departamentos...</p>
              </CardContent>
            </Card>
          ) : filteredDepts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay departamentos</p>
                <p className="text-sm text-muted-foreground mt-1">Crea el primer departamento</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDepts.map((dept, idx) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-accent/5 to-accent/10">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-accent" />
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold text-accent bg-accent/20">
                          {dept.workers?.length || 0} miembros
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-gray-900 mb-4">{dept.name}</h3>

                      {/* Head */}
                      {dept.headOfDepartment ? (
                        <div className="mb-4 p-3 rounded-lg bg-white/50 border border-accent/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-accent" />
                            <p className="text-xs font-semibold text-accent">JEFE</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {dept.headOfDepartment.worker.firstName} {dept.headOfDepartment.worker.lastName}
                          </p>
                          <p className="text-xs text-gray-600">{dept.headOfDepartment.worker.email}</p>
                        </div>
                      ) : (
                        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-xs font-semibold text-yellow-700">⚠️ Sin jefe asignado</p>
                        </div>
                      )}

                      {/* Workers List */}
                      {dept.workers && dept.workers.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-white/50 border border-accent/20">
                          <p className="text-xs font-semibold text-gray-600 mb-2">PERSONAL ({dept.workers.length})</p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {dept.workers.map(w => (
                              <div key={w.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <Users className="h-3 w-3" />
                                <span>{w.firstName} {w.lastName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-accent/20 hover:bg-accent/5"
                          onClick={() => openStaffModal(dept)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Gestionar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-accent/20 hover:bg-accent/5"
                          onClick={() => openEditModal(dept)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDepartment(dept.id)}
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

        {/* Info Footer */}
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-accent">🏢 Información:</span> Gestiona departamentos, asigna y remueve personal del equipo.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CREATE/EDIT MODAL */}
      {(modalType === 'create' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-md my-8 shadow-2xl">
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {modalType === 'create' ? 'Nuevo Departamento' : 'Editar Departamento'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Departamento</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Ej: Urgencias, Pediatría"
                  className="border-accent/20"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setModalType(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveDepartment} disabled={modalLoading} className="flex-1 bg-accent hover:bg-accent/90">
                  {modalLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* STAFF MANAGEMENT MODAL */}
      {modalType === 'staff' && selectedDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-xl my-8 shadow-2xl">
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="h-6 w-6" />
                Gestionar Personal - {selectedDept.name}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Head of Department Selection */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-accent" />
                  Jefe del Departamento
                </h3>
                {selectedDept.headOfDepartment && (
                  <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm font-medium text-gray-900">{selectedDept.headOfDepartment.worker.firstName} {selectedDept.headOfDepartment.worker.lastName}</p>
                    <p className="text-xs text-gray-600">{selectedDept.headOfDepartment.worker.email}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    value={headWorkerSelection}
                    onChange={(e) => setHeadWorkerSelection(e.target.value)}
                    className="flex-1 px-3 py-2 border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Selecciona un nuevo jefe</option>
                    {workers.filter(w => w.role !== "head_of_department" || w.id === selectedDept.headOfDepartment?.worker?.id).map(w => (
                      <option key={w.id} value={w.id}>
                        {w.firstName} {w.lastName} ({w.role})
                      </option>
                    ))}
                  </select>
                  <Button onClick={handleUpdateHead} disabled={!headWorkerSelection || modalLoading} className="bg-accent hover:bg-accent/90">
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
                  </Button>
                </div>
              </div>

              {/* Current Staff */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Personal Actual ({selectedDept.workers?.length || 0})</h3>
                {selectedDept.workers && selectedDept.workers.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDept.workers.map(w => (
                      <div key={w.id} className={`flex items-center justify-between p-3 border rounded-lg ${w.id === selectedDept.headOfDepartment?.worker?.id ? 'bg-accent/10 border-accent/40' : 'bg-gray-50 border-accent/20'}`}>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{w.firstName} {w.lastName}</p>
                          <p className="text-sm text-gray-600">{w.email}</p>
                        </div>
                        {w.id === selectedDept.headOfDepartment?.worker?.id && (
                          <Crown className="h-4 w-4 text-accent mr-2" />
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveWorker(w.id)}
                          disabled={modalLoading || w.id === selectedDept.headOfDepartment?.worker?.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm p-3 border border-dashed rounded">Sin personal asignado</p>
                )}
              </div>

              {/* Add Staff */}
              {availableWorkers.filter(w => w.role !== "head_of_department").length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Asignar Personal</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="flex-1 px-3 py-2 border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Selecciona un trabajador</option>
                      {availableWorkers.filter(w => w.role !== 'head_of_department').map(w => (
                        <option key={w.id} value={w.id}>
                          {w.firstName} {w.lastName}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleAssignWorker} disabled={!selectedWorker || modalLoading} className="bg-accent hover:bg-accent/90">
                      {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={() => setModalType(null)} variant="outline" className="w-full">
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function DepartmentsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT]}>
      <DepartmentsContent />
    </ProtectedRoute>
  );
}