"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Truck, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { UserRole } from "@/types"

export default function DeliveriesPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.HEAD_OF_DEPARTMENT]}>
            <DeliveriesContent />
        </ProtectedRoute>
    )
}

function DeliveriesContent() {
    const [deliveries, setDeliveries] = useState([])
    const [medications, setMedications] = useState([])
    const [open, setOpen] = useState(false)
    const [departmentId, setDepartmentId] = useState("")
    const [items, setItems] = useState([{ medicationId: "", quantity: 1 }])
    const { toast } = useToast()

    useEffect(() => {
        loadDeliveries()
        loadMedications()
        loadDepartment()
    }, [])

    const loadDeliveries = async () => {
        try {
            const data = await api.medicationDeliveries.getAll()
            setDeliveries(data)
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const loadMedications = async () => {
        try {
            const data = await api.medications.getAll()
            setMedications(data)
        } catch (err: any) {
            console.error(err)
        }
    }

    const loadDepartment = async () => {
        try {
            const profile = await api.auth.getProfile()
            setDepartmentId(profile.department?.id || "")
        } catch (err) { }
    }

    const addItem = () => {
        setItems([...items, { medicationId: "", quantity: 1 }])
    }

    type ItemField = "medicationId" | "quantity"

    const updateItem = (index: number, field: ItemField, value: string | number) => {
        const newItems = [...items]
        newItems[index] = {
            ...newItems[index],
            [field]: value,
        }
        setItems(newItems)
    }


    const removeItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    const createDelivery = async () => {
        try {

            const profile = await api.auth.getProfile()
            await api.medicationDeliveries.create(
                departmentId,
                profile.id,
                items
            )

            toast({ title: "Envío registrado", description: "Se creó el envío correctamente." })
            setOpen(false)
            setItems([{ medicationId: "", quantity: 1 }])
            loadDeliveries()
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        }
    }

    const statusColors: any = {
        PENDING: "text-yellow-600 bg-yellow-100",
        APPROVED: "text-blue-600 bg-blue-100",
        COMPLETED: "text-green-600 bg-green-100",
        REJECTED: "text-red-600 bg-red-100",
    }

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Truck className="h-8 w-8 text-primary" />
                    Envíos a Departamento
                </h1>
                <Button onClick={() => setOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Envío
                </Button>
            </div>

            {/* Tabla */}
            <Card className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Solicitado por</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deliveries.map((del: any) => (
                            <TableRow key={del.id}>
                                <TableCell>{del.department?.name}</TableCell>
                                <TableCell>{del.requestedBy?.name || "—"}</TableCell>
                                <TableCell>{del.items?.length}</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[del.status]}`}
                                    >
                                        {del.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Envío</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                        {/* Items */}
                        <div className="space-y-3">
                            <h2 className="font-semibold">Medicamentos</h2>

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-3 gap-3">
                                    <Select
                                        value={item.medicationId}
                                        onValueChange={(val) => updateItem(index, "medicationId", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Medicamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {medications.map((m: any) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                                    />

                                    <Button
                                        variant="destructive"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                    >
                                        X
                                    </Button>
                                </div>
                            ))}

                            <Button variant="secondary" onClick={addItem} className="w-full">
                                Añadir medicamento
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={createDelivery}>Registrar Envío</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
