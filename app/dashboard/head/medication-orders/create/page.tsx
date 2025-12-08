"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { UserRole } from "@/types";
import { Trash2, ShoppingCart, Plus } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  code?: string;
  unit?: string;
}

interface StockItem {
  id: string;
  quantity: number;
  medication: Medication;
  department?: { id: string; name: string };
}

interface OrderItem {
  medicationId: string;
  medicationName: string;
  medicationCode: string;
  medicationUnit: string;
  quantity: number;
  availableQuantity: number;
}

export default function CreateMedicationOrderPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
      <CreateMedicationOrderContent />
    </ProtectedRoute>
  );
}

function CreateMedicationOrderContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [department, setDepartment] = useState<any>(null);
  const [allMedications, setAllMedications] = useState<Medication[]>([]);
  const [departmentStock, setDepartmentStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Get department
      const deptData = await api.departments.getmydep();
      if (deptData && typeof deptData === "object" && !Array.isArray(deptData)) {
        setDepartment(deptData);

        // Get stock items for department
        const stockData = await api.stockItems.findByDepartment(deptData.id);
        const safeStock = Array.isArray(stockData) ? stockData : [];
        setDepartmentStock(safeStock);
      }

      // Get all medications
      const medsData = await api.medications.getAll();
      const safeMeds = Array.isArray(medsData) ? medsData : [];
      setAllMedications(safeMeds);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: error.message || "Error cargando datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMedicationStock = (medicationId: string): number => {
    const stockItem = departmentStock.find(
      (s) => s.medication?.id === medicationId
    );
    return stockItem?.quantity || 0;
  };

  const getMedicationInfo = (medicationId: string): Medication | null => {
    return allMedications.find((m) => m.id === medicationId) || null;
  };

  const handleAddItem = () => {
    if (!selectedMedicationId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un medicamento",
        variant: "destructive",
      });
      return;
    }

    const qty = parseInt(quantityInput);
    if (!quantityInput || qty <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    const availableStock = getMedicationStock(selectedMedicationId);
    

    const medicationInfo = getMedicationInfo(selectedMedicationId);
    if (!medicationInfo) {
      toast({
        title: "Error",
        description: "Medicamento no encontrado",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    if (items.some((i) => i.medicationId === selectedMedicationId)) {
      toast({
        title: "Item duplicado",
        description: "Este medicamento ya está en la orden",
        variant: "destructive",
      });
      return;
    }

    const newItem: OrderItem = {
      medicationId: selectedMedicationId,
      medicationName: medicationInfo.name,
      medicationCode: medicationInfo.code || "-",
      medicationUnit: medicationInfo.unit || "unidades",
      quantity: qty,
      availableQuantity: availableStock,
    };

    setItems((prevItems) => [...prevItems, newItem]);

    // Reset form
    setSelectedMedicationId("");
    setQuantityInput("");

    toast({
      title: "Item agregado",
      description: `${medicationInfo.name} agregado a la orden`,
    });
  };

  const handleRemoveItem = (medicationId: string) => {
    setItems((prevItems) =>
      prevItems.filter((i) => i.medicationId !== medicationId)
    );
  };

  const handleUpdateQuantity = (medicationId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(medicationId);
      return;
    }

    const item = items.find((i) => i.medicationId === medicationId);
    if (item && newQty > item.availableQuantity) {
      toast({
        title: "Error",
        description: `Stock insuficiente. Disponible: ${item.availableQuantity}`,
        variant: "destructive",
      });
      return;
    }

    setItems((prevItems) =>
      prevItems.map((i) =>
        i.medicationId === medicationId ? { ...i, quantity: newQty } : i
      )
    );
  };

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un medicamento a la orden",
        variant: "destructive",
      });
      return;
    }

    if (!department) {
      toast({
        title: "Error",
        description: "Departamento no encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const orderItems = items.map((item) => ({
        medicationId: item.medicationId,
        quantity: item.quantity,
      }));

      await api.medicationOrders.create({
        departmentId: department.id,
        items: orderItems,
      });

      toast({
        title: "Éxito",
        description: "La orden ha sido creada exitosamente",
      });

      router.push("/dashboard/head/medication-orders");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nueva Orden de Medicamentos</h1>
            <p className="text-muted-foreground">
              Crea una nueva solicitud de reposición de stock
            </p>
          </div>
          <ShoppingCart className="h-8 w-8 text-accent" />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando datos...</p>
        ) : (
          <>
            {/* Department Info */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Información de la Orden</h2>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Departamento
                </label>
                <p className="text-lg font-semibold">{department?.name || "N/A"}</p>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Agregar Medicamentos</h2>

              <div className="space-y-4">
                {/* Medication Selection */}
                <div>
                  <label className="text-sm font-medium block mb-2">Medicamento</label>
                  <Select
                    value={selectedMedicationId}
                    onValueChange={setSelectedMedicationId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un medicamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMedications.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-2">
                          No hay medicamentos disponibles
                        </div>
                      ) : (
                        allMedications.map((med) => {
                          const stock = getMedicationStock(med.id);
                          return (
                            <SelectItem key={med.id} value={med.id}>
                              {med.name} {med.code ? `(${med.code})` : ""} - Stock:{" "}
                              {stock}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>

                  {/* Show Stock Info */}
                  {selectedMedicationId && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm border border-blue-200">
                      <p>
                        <span className="font-semibold">Stock disponible:</span>{" "}
                        {getMedicationStock(selectedMedicationId)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium block mb-2">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    placeholder="Ingresa la cantidad"
                  />
                </div>

                {/* Add Button */}
                <Button
                  onClick={handleAddItem}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Item
                </Button>
              </div>
            </div>

            {/* Items Summary */}
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Items de la Orden</h2>

              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay items agregados. Agrega medicamentos arriba.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${item.medicationId}-${index}`}
                      className="flex items-center justify-between border border-secondary rounded-lg p-4 hover:bg-secondary/30 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.medicationName}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                          <div>
                            <p className="text-xs uppercase">Código</p>
                            <p>{item.medicationCode}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase">Unidad</p>
                            <p>{item.medicationUnit}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase">Stock Disponible</p>
                            <p className="font-semibold text-foreground">
                              {item.availableQuantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase">Cantidad</p>
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.medicationId,
                                    item.quantity - 1
                                  )
                                }
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(
                                    item.medicationId,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-12 text-center border rounded text-sm py-1"
                              />
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.medicationId,
                                    item.quantity + 1
                                  )
                                }
                                disabled={item.quantity >= item.availableQuantity}
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.medicationId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total de Items:</span>
                      <span>{totalQuantity}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-accent hover:bg-accent/90"
                onClick={handleSaveOrder}
                disabled={items.length === 0 || isSaving}
              >
                {isSaving ? "Guardando..." : "Crear Orden"}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}