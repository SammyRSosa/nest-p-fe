"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TableList } from "@/components/table-list"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"
import { Pill } from "lucide-react"

function DepartmentStockContent() {
    const [stock, setStock] = useState([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        loadStock()
    }, [])

    const loadStock = async () => {
        try {
            // 🔥 Get profile to know departmentId
            const user = await api.auth.getProfile()
            const data = await api.stockItems.findByDepartment(user.department.id)


            setStock(data)
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo cargar el stock",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: "name", label: "Medicamento" },
        { key: "quantity", label: "Cantidad Disponible" },
        { key: "minQuantity", label: "Stock Mínimo" },
        {
            key: "status",
            label: "Estado",
            render: (item: any) => {
                const low = item.quantity <= item.minQuantity
                return (
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${low
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                    >
                        {low ? "Bajo" : "Disponible"}
                    </span>
                )
            },
        },
    ]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Pill className="h-7 w-7 text-accent" />
                    <div>
                        <h1 className="text-3xl font-bold">Stock del Departamento</h1>
                        <p className="text-muted-foreground">
                            Todos los medicamentos asignados a tu departamento
                        </p>
                    </div>
                </div>

                <div className="bg-card rounded-lg p-6">
                    {loading ? (
                        <p className="text-center text-muted-foreground py-8">
                            Cargando stock...
                        </p>
                    ) : (
                        <TableList
                            data={stock}
                            columns={columns}
                            searchPlaceholder="Buscar medicamento..."
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default function DepartmentStockPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
            <DepartmentStockContent />
        </ProtectedRoute>
    )
}
