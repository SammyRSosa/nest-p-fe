"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Check, X, Package, Clock, AlertCircle, Eye, TrendingUp, Search, MessageSquare, TrendingDown } from "lucide-react";
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

interface StockLevel {
  medicationId: string;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
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
  requestedAt: Date;
  respondedAt?: Date;
  comment?: string;
}

function AlmaceneroContent() {
  const [medicationOrders, setMedicationOrders] = useState<MedicationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MedicationOrder | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [departmentStockLevels, setDepartmentStockLevels] = useState<Map<string, StockLevel>>(new Map());
  const [loadingStocks, setLoadingStocks] = useState(false);

  const fetchMedicationOrders = async () => {
    try {
      setLoading(true);
      const data = await api.medicationOrders.getAll();
      setMedicationOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching medication orders:", error);
      alert("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStockLevels = async (departmentId: string) => {
    try {
      setLoadingStocks(true);
      const stockItems = await api.stockItems.findByDepartment(departmentId);
      
      const stockMap = new Map<string, StockLevel>();
      if (Array.isArray(stockItems)) {
        stockItems.forEach((item: any) => {
          stockMap.set(item.medication.id, {
            medicationId: item.medication.id,
            quantity: item.quantity,
            minThreshold: item.minThreshold,
            maxThreshold: item.maxThreshold,
          });
        });
      }
      
      setDepartmentStockLevels(stockMap);
    } catch (error) {
      console.error("Error fetching stock levels:", error);
    } finally {
      setLoadingStocks(false);
    }
  };

  const openDetailsModal = async (order: MedicationOrder) => {
    setSelectedOrder(order);
    await fetchDepartmentStockLevels(order.department.id);
    setIsDetailsModalOpen(true);
  };

  const acceptOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsProcessingOrder(true);
      await api.medicationOrders.respond(selectedOrder.id, { accept: true });

      await fetchMedicationOrders();
      setIsAcceptModalOpen(false);
      setIsDetailsModalOpen(false);
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
      await api.medicationOrders.respond(selectedOrder.id, {
        accept: false,
        comment: rejectionReason || undefined,
      });

      await fetchMedicationOrders();
      setIsRejectModalOpen(false);
      setIsDetailsModalOpen(false);
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
    denied: medicationOrders.filter((o) => o.status === "denied").length,
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "accepted":
        return {
          label: "Aceptada",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-700",
          bgIcon: "bg-green-100",
          icon: Check,
          dotColor: "border-l-green-500",
        };
      case "denied":
        return {
          label: "Rechazada",
          color: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          bgIcon: "bg-red-100",
          icon: X,
          dotColor: "border-l-red-500",
        };
      default:
        return {
          label: "Pendiente",
          color: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-700",
          bgIcon: "bg-yellow-100",
          icon: Clock,
          dotColor: "border-l-yellow-500",
        };
    }
  };

  const getStockStatusIndicator = (stock: StockLevel | undefined) => {
    if (!stock) return { label: "Sin dato", color: "text-gray-600", bgColor: "bg-gray-100", icon: AlertCircle };
    
    if (stock.quantity < stock.minThreshold) {
      return { label: "Crítico", color: "text-red-600", bgColor: "bg-red-100", icon: TrendingDown };
    }
    if (stock.quantity > stock.maxThreshold) {
      return { label: "Excedido", color: "text-blue-600", bgColor: "bg-blue-100", icon: TrendingUp };
    }
    return { label: "Normal", color: "text-green-600", bgColor: "bg-green-100", icon: Check };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              Gestión de Órdenes de Medicamentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Revisar y procesar solicitudes de medicamentos de los departamentos
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="font-semibold text-accent">
              {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
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
            value={stats.denied}
            icon={X}
            description="No aprobadas"
          />
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg p-6 border border-accent/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" />
            Filtros y Búsqueda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por departamento o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-accent/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-accent/20">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="accepted">Aceptada</SelectItem>
                <SelectItem value="denied">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Órdenes de Medicamentos</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-12 w-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando órdenes...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No hay órdenes registradas</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta ajustar los filtros</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((order, idx) => {
                const config = getStatusConfig(order.status);
                const Icon = config.icon;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`border-l-4 ${config.dotColor} hover:shadow-lg transition-all duration-300 ${config.color}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left Section - Order Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`h-10 w-10 rounded-lg ${config.bgIcon} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`h-5 w-5 ${config.textColor}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {order.department?.name || "Departamento desconocido"}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${config.textColor} ${config.color} border inline-block mt-1`}
                                >
                                  {config.label}
                                </span>
                              </div>
                            </div>

                            {/* Order Details Grid */}
                            <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  ID Orden
                                </p>
                                <p className="font-mono text-sm text-gray-700 mt-1">
                                  {order.id.slice(0, 8)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Medicamentos
                                </p>
                                <p className="text-sm text-gray-700 font-semibold mt-1">
                                  {order.items?.length || 0} items
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                                  Fecha
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  {new Date(order.requestedAt).toLocaleDateString("es-ES")}
                                </p>
                              </div>
                            </div>

                            {/* Items Summary */}
                            {order.items && order.items.length > 0 && (
                              <div className={`p-3 rounded-lg border ${config.color}`}>
                                <p className={`text-xs uppercase tracking-wide font-semibold ${config.textColor} mb-2`}>
                                  Medicamentos solicitados ({order.items.length})
                                </p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {order.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className={`flex justify-between text-xs ${config.textColor}`}>
                                      <span className="font-medium">
                                        {item.medication?.name || "Medicamento"}
                                      </span>
                                      <span className="font-semibold">
                                        {item.quantity} {item.medication?.unit || "unidades"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Display comment if order is denied */}
                            {order.status === "denied" && order.comment && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-1 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Motivo del rechazo
                                </p>
                                <p className="text-sm text-red-900">{order.comment}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              className="border-accent/20 hover:bg-accent/5"
                              onClick={() => openDetailsModal(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Detalles
                            </Button>
                            {!order.status || order.status === "pending" ? (
                              <>
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
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground text-center py-2">
                                {order.status === "accepted" ? (
                                  <span className="text-green-600 font-semibold">✓ Procesada</span>
                                ) : (
                                  <span className="text-red-600 font-semibold">✗ Rechazada</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-accent">📋 Información:</span> Revisa cuidadosamente cada orden antes de aceptar. Las órdenes aceptadas crearán automáticamente registros de distribución.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-accent/70 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package className="h-6 w-6" />
                Detalles de Orden
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Información completa de la solicitud de medicamentos
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Order Info Card */}
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Departamento Solicitante
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {selectedOrder.department?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Estado
                      </p>
                      <p className={`text-lg font-bold mt-2 ${getStatusConfig(selectedOrder.status).textColor}`}>
                        {getStatusConfig(selectedOrder.status).label}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        ID Orden
                      </p>
                      <p className="font-mono text-sm text-gray-700 mt-2">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent font-semibold">
                        Fecha de Solicitud
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {new Date(selectedOrder.requestedAt).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items List with Stock Levels */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Medicamentos Solicitados ({selectedOrder.items?.length || 0})
                </h3>
                {loadingStocks ? (
                  <Card>
                    <CardContent className="pt-8 pb-8 text-center">
                      <div className="h-8 w-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Cargando niveles de stock...</p>
                    </CardContent>
                  </Card>
                ) : !selectedOrder.items || selectedOrder.items.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-8 pb-8 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Sin medicamentos en esta orden</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => {
                      const stock = departmentStockLevels.get(item.medication?.id || "");
                      const stockStatus = getStockStatusIndicator(stock);
                      const StockIcon = stockStatus.icon;

                      return (
                        <Card key={idx} className="hover:shadow-md transition-shadow border-l-4 border-l-accent">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {/* Medication Name and Code */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {item.medication?.name || "Medicamento"}
                                  </p>
                                  {item.medication?.code && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Código: {item.medication.code}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Requested Quantity and Current Stock */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Requested Quantity */}
                                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                                  <p className="text-xs uppercase tracking-wide text-accent font-semibold mb-1">
                                    Cantidad Solicitada
                                  </p>
                                  <p className="text-2xl font-bold text-accent">
                                    {item.quantity}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.medication?.unit || "unidades"}
                                  </p>
                                </div>

                                {/* Current Stock Level */}
                                <div className={`p-3 rounded-lg border ${stockStatus.bgColor}`}>
                                  <p className={`text-xs uppercase tracking-wide ${stockStatus.color} font-semibold mb-1`}>
                                    Stock Actual
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className={`text-2xl font-bold ${stockStatus.color}`}>
                                      {stock?.quantity ?? "—"}
                                    </p>
                                    <StockIcon className={`h-5 w-5 ${stockStatus.color}`} />
                                  </div>
                                  <p className={`text-xs mt-1 ${stockStatus.color}`}>
                                    {stock ? `Rango: ${stock.minThreshold} - ${stock.maxThreshold}` : "Sin dato"}
                                  </p>
                                </div>
                              </div>

                              {/* Stock Status Badge */}
                              {stock && (
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${stockStatus.bgColor}`}></div>
                                  <span className={`text-sm font-semibold ${stockStatus.color}`}>
                                    Estado: {stockStatus.label}
                                  </span>
                                </div>
                              )}

                              {/* Alert if stock is low */}
                              {stock && stock.quantity < stock.minThreshold && (
                                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Stock crítico: {stock.quantity} de {stock.minThreshold} mínimo
                                </div>
                              )}

                              {/* Alert if stock insufficient for order */}
                              {stock && stock.quantity  + item.quantity > stock.maxThreshold && (
                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 font-medium flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  Stock insuficiente: se necesitan {stock.maxThreshold} pero hay {stock.quantity + item.quantity}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Display comment if order is denied */}
              {selectedOrder.status === "denied" && selectedOrder.comment && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Motivo del rechazo
                    </p>
                    <p className="text-sm text-red-900">{selectedOrder.comment}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Cerrar
              </Button>
              {!selectedOrder.status || selectedOrder.status === "pending" ? (
                <>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setIsAcceptModalOpen(true);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Aceptar Orden
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setIsRejectModalOpen(true);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rechazar Orden
                  </Button>
                </>
              ) : null}
            </div>
          </Card>
        </div>
      )}

      {/* ACCEPT ORDER MODAL */}
      {isAcceptModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md my-8 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Check className="h-6 w-6" />
                Aceptar Orden
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Confirme la aceptación de la orden de medicamentos
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">
                        Departamento
                      </p>
                      <p className="font-semibold text-green-900 mt-1">
                        {selectedOrder.department?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-green-600 font-semibold">
                        Total de Items
                      </p>
                      <p className="font-semibold text-green-900 mt-1">
                        {selectedOrder.items?.length || 0} medicamentos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-gray-700">
                ¿Está seguro de que desea <span className="font-semibold">aceptar esta orden</span>? Se creará automáticamente un registro de distribución.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAcceptModalOpen(false);
                  setSelectedOrder(null);
                }}
                disabled={isProcessingOrder}
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                onClick={acceptOrder}
                disabled={isProcessingOrder}
              >
                {isProcessingOrder ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Aceptar Orden
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
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <X className="h-6 w-6" />
                Rechazar Orden
              </h2>
              <p className="text-red-100 text-sm mt-1">
                Indique el motivo del rechazo (opcional)
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-red-900">
                    Se rechazará la orden del departamento{" "}
                    <span className="font-semibold">{selectedOrder.department?.name}</span>
                  </p>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 min-h-24 resize-none"
                  placeholder="Explica por qué se rechaza esta orden..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedOrder(null);
                  setRejectionReason("");
                }}
                disabled={isProcessingOrder}
              >
                Cancelar
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                onClick={rejectOrder}
                disabled={isProcessingOrder}
              >
                {isProcessingOrder ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Rechazar Orden
                  </>
                )}
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