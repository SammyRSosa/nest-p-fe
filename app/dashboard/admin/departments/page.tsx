'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Crown, AlertCircle, X, Loader2, Building2, Search, Package, AlertTriangle, TrendingUp } from 'lucide-react';
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

interface StockItem {
  id: string;
  medication: { id: string; name: string };
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
}

interface ConsumptionRow {
  medicationId: string;
  medicationName: string;
  totalConsumed: number;
  currentStock: number;
  minThreshold: number;
  maxThreshold: number;
  status: 'CRITICAL' | 'OVERSTOCK' | 'OK';
}

function DepartmentsContent() {
  const { departments, loading, fetchDepartments } = useDepartments();
  const [modalType, setModalType] = useState<'create' | 'edit' | 'staff' | 'stock' | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '' });
  const [workers, setWorkers] = useState<User[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [headWorkerSelection, setHeadWorkerSelection] = useState('');

  // Stock management states
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState({ min: 0, max: 0 });

  // Consumption report states
  const [consumptionData, setConsumptionData] = useState<ConsumptionRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [loadingConsumption, setLoadingConsumption] = useState(false);
  const [stockTab, setStockTab] = useState<'inventory' | 'consumption'>('inventory');

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

  useEffect(() => {
    if (selectedDept && modalType === 'stock') {
      fetchStockItems();
      if (stockTab === 'consumption') fetchConsumption(selectedDept.id);
    }
  }, [selectedDept, modalType, stockTab]);

  const fetchWorkers = async () => {
    try {
      const data = await api.workers.getAll();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchStockItems = async () => {
    if (!selectedDept) return;
    try {
      const data = await api.stockItems.findByDepartment(selectedDept.id);
      setStockItems(data || []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    }
  };

  const fetchConsumption = async (deptId: string) => {
    setLoadingConsumption(true);
    try {
      const data = await api.reports.getMedicationConsumptionByDepartment(deptId, selectedMonth);
      setConsumptionData(data);
    } catch (err) {
      console.error('Error fetching consumption:', err);
      alert('Error al obtener el consumo de medicamentos');
    } finally {
      setLoadingConsumption(false);
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

  const openStockModal = (dept: Department) => {
    setSelectedDept(dept);
    setStockTab('inventory');
    setModalType('stock');
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

  const handleUpdateThreshold = async (stockId: string, medicationId: string) => {
    if (!selectedDept) return;

    setModalLoading(true);
    try {
      await api.stockItems.patch(stockId, {
        departmentId: selectedDept.id,
        medicationId,
        minThreshold: editingValues.min,
        maxThreshold: editingValues.max,
      });
      await fetchStockItems();
      setEditingStockId(null);
      alert('Umbrales actualizados correctamente');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al actualizar umbrales');
    } finally {
      setModalLoading(false);
    }
  };

  const startEditingThreshold = (stock: StockItem) => {
    setEditingStockId(stock.id);
    setEditingValues({ min: stock.minThreshold, max: stock.maxThreshold });
  };

  const getStockStatus = (stock: StockItem) => {
    if (stock.quantity < stock.minThreshold) return 'critical';
    if (stock.quantity > stock.maxThreshold) return 'high';
    if (stock.quantity <= stock.minThreshold + Math.ceil(stock.minThreshold * 0.2)) return 'low';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'low': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'high': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
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
            <p className="text-muted-foreground mt-2">Administra departamentos, personal e inventario</p>
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
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-accent" />
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold text-accent bg-accent/20">
                          {dept.workers?.length || 0} miembros
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-4">{dept.name}</h3>

                      {dept.headOfDepartment ? (
                        <div className="mb-4 p-3 rounded-lg bg-white/50 border border-accent/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-4 w-4 text-accent" />
                            <p className="text-xs font-semibold text-accent">JEFE</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {dept.headOfDepartment.worker.firstName} {dept.headOfDepartment.worker.lastName}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-xs font-semibold text-yellow-700">⚠️ Sin jefe asignado</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 border-accent/20 hover:bg-accent/5" onClick={() => openStaffModal(dept)}>
                          <Users className="mr-2 h-4 w-4" /> Personal
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-accent/20 hover:bg-accent/5" onClick={() => openStockModal(dept)}>
                          <Package className="mr-2 h-4 w-4" /> Stock
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-accent/20 hover:bg-accent/5" onClick={() => openEditModal(dept)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteDepartment(dept.id)}>
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

        {/* Modals (Create/Edit, Staff, Stock) */}
        {/* ... KEEP YOUR EXISTING CREATE/EDIT & STAFF MODALS ... */}

        {/* STOCK MANAGEMENT MODAL */}
        {modalType === 'stock' && selectedDept && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
            <Card className="w-full max-w-3xl my-8 shadow-2xl">
              <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="h-6 w-6" /> Gestionar Inventario - {selectedDept.name}
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant={stockTab === 'inventory' ? 'default' : 'outline'} onClick={() => setStockTab('inventory')}>Inventario</Button>
                  <Button size="sm" variant={stockTab === 'consumption' ? 'default' : 'outline'} onClick={() => setStockTab('consumption')}>Consumo</Button>
                </div>
              </div>

              <div className="p-6">
                {stockTab === 'inventory' && (
                  <>
                    {stockItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No hay medicamentos en este departamento</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {stockItems.map(stock => {
                          const status = getStockStatus(stock);
                          const isEditing = editingStockId === stock.id;
                          return (
                            <div key={stock.id} className={`border rounded-lg p-4 ${getStatusColor(status)}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{stock.medication.name}</h4>
                                  <p className="text-sm text-gray-700">Cantidad: {stock.quantity}</p>
                                </div>
                                {!isEditing ? (
                                  <Button size="sm" onClick={() => startEditingThreshold(stock)}>Editar Umbrales</Button>
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      value={editingValues.min}
                                      onChange={e => setEditingValues(prev => ({ ...prev, min: Number(e.target.value) }))}
                                      className="w-20"
                                    />
                                    <Input
                                      type="number"
                                      value={editingValues.max}
                                      onChange={e => setEditingValues(prev => ({ ...prev, max: Number(e.target.value) }))}
                                      className="w-20"
                                    />
                                    <Button size="sm" onClick={() => handleUpdateThreshold(stock.id, stock.medication.id)}>Guardar</Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {stockTab === 'consumption' && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <label className="text-sm font-medium text-gray-700">Mes:</label>
                      <input
                        type="month"
                        value={selectedMonth.slice(0, 7)}
                        onChange={(e) => setSelectedMonth(e.target.value + '-01')}
                        className="border px-2 py-1 rounded"
                      />
                      <Button onClick={() => fetchConsumption(selectedDept.id)} disabled={loadingConsumption}>
                        {loadingConsumption ? 'Cargando...' : 'Consultar'}
                      </Button>
                    </div>

                    {loadingConsumption ? (
                      <p>Cargando consumo...</p>
                    ) : consumptionData.length === 0 ? (
                      <p>No hay datos de consumo para este mes</p>
                    ) : (
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full table-auto border-collapse">
                          <thead>
                            <tr className="bg-accent/20">
                              <th className="border px-2 py-1 text-left">Medicamento</th>
                              <th className="border px-2 py-1 text-left">Total Consumido</th>
                              <th className="border px-2 py-1 text-left">Stock Actual</th>
                              <th className="border px-2 py-1 text-left">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consumptionData.map(row => (
                              <tr key={row.medicationId} className="hover:bg-gray-50">
                                <td className="border px-2 py-1">{row.medicationName}</td>
                                <td className="border px-2 py-1">{row.totalConsumed}</td>
                                <td className="border px-2 py-1">{row.currentStock}</td>
                                <td className="border px-2 py-1">
                                  {row.status === 'CRITICAL' && <span className="text-red-600 font-bold">🔴 Crítico</span>}
                                  {row.status === 'OVERSTOCK' && <span className="text-blue-600 font-bold">🔵 Exceso</span>}
                                  {row.status === 'OK' && <span className="text-green-600 font-bold">🟢 OK</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-4 flex justify-end border-t border-accent/20">
                <Button onClick={() => setModalType(null)}>Cerrar</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
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
