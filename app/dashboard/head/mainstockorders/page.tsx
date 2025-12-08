"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Check, X, Package, Clock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatCard } from "@/components/stat-card";

interface Medication {
  id: string;
  name: string;
  code?: string;
  unit?: string;
}

interface OrderItem {
  id: string;
  medicationId?: string;
  medication?: Medication;
  quantity: number;
}

interface MedicationOrder {
  id: string;
  departmentId: string;
  department: {
    id: string;
    name: string;
  };
  items?: OrderItem[];
  status?: "pending" | "accepted" | "denied";
  createdAt: Date;
}

function AlmaceneroContent() {
  const [medicationOrders, setMedicationOrders] = useState<MedicationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MedicationOrder | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchMedicationOrders = async () => {
    try {
      setLoading(true);
      const data = await api.medicationOrders.getAll();
      console.log("Fetched orders:", data);
      setMedicationOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching medication orders:", error);
      alert("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsProcessingOrder(true);
      await api.medicationOrders.respond(selectedOrder.id, { accept: true });

      await fetchMedicationOrders();
      setIsAcceptModalOpen(false);
      setSelectedOrder(null);
      alert("Orden aceptada y entrega creada exitosamente");
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Error al aceptar la orden");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const rejectOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsProcessingOrder(true);
      await api.medicationOrders.respond(selectedOrder.id, { accept: false });

      await fetchMedicationOrders();
      setIsRejectModalOpen(false);
      setSelectedOrder(null);
      setRejectionReason("");
      alert("Orden rechazada exitosamente");
    } catch (error) {
      console.error("Error rejecting order:", error);
      alert("Error al rechazar la orden");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  useEffect(() => {
    fetchMedicationOrders();
  }, []);

  const filtered = medicationOrders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || !statusFilter ? true : order.status === statusFilter;
    const matchesSearch =
      order.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.id?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: medicationOrders.length,
    pending: medicationOrders.filter((o) => !o.status || o.status === "pending").length,
    accepted: medicationOrders.filter((o) => o.status === "accepted").length,
    rejected: medicationOrders.filter((o) => o.status === "denied").length,
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";
      case "denied":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "accepted":
        return "Aceptada";
      case "denied":
        return "Rechazada";
      default:
        return "Pendiente";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Órdenes de Medicamentos</h1>
            <p className="text-muted-foreground">
              Revisar y procesar solicitudes de medicamentos de los departamentos
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Órdenes"
            value={stats.total}
            icon={Package}
            description="Todas las órdenes"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={Clock}
            description="Requieren revisión"
          />
          <StatCard
            title="Aceptadas"
            value={stats.accepted}
            icon={Check}
            description="Procesadas"
          />
          <StatCard
            title="Rechazadas"
            value={stats.rejected}
            icon={X}
            description="No aprobadas"
          />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por departamento o ID..."
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
                <SelectItem value="accepted">Aceptada</SelectItem>
                <SelectItem value="denied">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Medication Orders List */}
        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Órdenes de Medicamentos</h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No se encontraron órdenes</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-lg">
                              {order.department?.name || "Departamento desconocido"}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">ID Orden</p>
                              <p className="font-mono text-gray-700">{order.id.slice(0, 8)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">Medicamentos</p>
                              <p className="text-gray-700">{order.items?.length || 0} items</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold">Fecha</p>
                              <p className="text-gray-700">
                                {new Date(order.createdAt).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          </div>

                          {/* Order Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-3 mb-4">
                              <p className="text-sm font-semibold text-blue-900 mb-2">
                                Items solicitados:
                              </p>
                              <div className="space-y-1">
                                {order.items.map((item, index) => {
                                  const medName = item.medication?.name || "Medicamento desconocido";
                                  const medUnit = item.medication?.unit || "unidades";
                                  return (
                                    <div key={index} className="text-sm text-blue-800">
                                      <span className="font-medium">{medName}</span>
                                      {" - "}
                                      <span>
                                        {item.quantity} {medUnit}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {!order.status || order.status === "pending" ? (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsAcceptModalOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4" />
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-2"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsRejectModalOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground ml-4">
                            {order.status === "accepted" ? (
                              <span className="text-green-600 font-semibold">✓ Procesada</span>
                            ) : (
                              <span className="text-red-600 font-semibold">✗ Rechazada</span>
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

      {/* ACCEPT ORDER MODAL */}
      {isAcceptModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Check className="h-6 w-6" />
                Aceptar Orden de Medicamentos
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Confirme la entrega y cree el registro de distribución
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">
                        Departamento
                      </p>
                      <p className="text-lg font-semibold text-green-900 mt-1">
                        {selectedOrder.department?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">
                        Total Items
                      </p>
                      <p className="text-lg font-semibold text-green-900 mt-1">
                        {selectedOrder.items?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Review */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Medicamentos a entregar:</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.medication?.name || "Medicamento desconocido"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Código: {item.medication?.code || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {item.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.medication?.unit || "unidades"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                className="px-6 h-11 font-semibold"
                onClick={() => {
                  setIsAcceptModalOpen(false);
                  setSelectedOrder(null);
                }}
                disabled={isProcessingOrder}
              >
                Cancelar
              </Button>
              <Button
                className="px-8 h-11 font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2"
                onClick={acceptOrder}
                disabled={isProcessingOrder}
              >
                {isProcessingOrder ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Aceptar y Entregar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT ORDER MODAL */}
      {isRejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-600">Rechazar Orden</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              ¿Está seguro de que desea rechazar esta orden del departamento{" "}
              <span className="font-semibold">{selectedOrder.department?.name}</span>?
            </p>
            <textarea
              className="w-full p-2 border rounded-md mb-4 min-h-20 focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="Motivo del rechazo (opcional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={rejectOrder}
                disabled={isProcessingOrder}
              >
                {isProcessingOrder ? "Rechazando..." : "Rechazar"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedOrder(null);
                  setRejectionReason("");
                }}
                disabled={isProcessingOrder}
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

export default function AlmaceneroPage() {
  return <AlmaceneroContent />;
}