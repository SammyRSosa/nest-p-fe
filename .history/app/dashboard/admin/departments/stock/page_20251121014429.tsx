"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MedicationStockTable } from "@/components/admin/MedicationStockTable"
import { StockApprovalTable } from "@/components/admin/StockApprovalTable"
import { api } from "@/lib/api"
import type { Department, MedicationStock } from "@/types"
import { toast } from "@/hooks/use-toast"

export default function DepartmentStockPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"stock" | "approvals">("stock")

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    if (selectedDepartment) {
      fetchDepartmentDetails()
    }
  }, [selectedDepartment])

  const fetchDepartments = async () => {
    try {
      const data = await api.departments.getAll()
      setDepartments(data)
      if (data.length > 0 && !selectedDepartment) {
        setSelectedDepartment(data[0].id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los departamentos",
        variant: "destructive",
      })
    }
  }

  const fetchDepartmentDetails = async () => {
    if (!selectedDepartment) return
    
    setLoading(true)
    try {
      const data = await api.departments.getById(selectedDepartment)
      setCurrentDepartment(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los detalles del departamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // ✅ FUNCIÓN CORREGIDA - CON PROTECCIÓN CONTRA UNDEFINED
  const getStockStats = (stock: MedicationStock[] | undefined) => {
    // ✅ PROTECCIÓN CONTRA UNDEFINED
    if (!stock || !Array.isArray(stock)) {
      return {
        total: 0,
        normal: 0,
        low: 0,
        critical: 0,
        excess: 0,
        pending: 0
      }
    }

    const total = stock.length
    const normal = stock.filter(item => item.status === 'normal').length
    const low = stock.filter(item => item.status === 'low').length
    const critical = stock.filter(item => item.status === 'critical').length
    const excess = stock.filter(item => item.status === 'excess').length
    const pending = stock.filter(item => !item.isApproved).length

    return { total, normal, low, critical, excess, pending }
  }

  // ✅ ESTO AHORA ES SEGURO
  const stats = currentDepartment ? getStockStats(currentDepartment.medicationStock) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Stock de Medicamentos</h1>
          <p className="text-muted-foreground">
            Administra el inventario de medicamentos por departamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "approvals" ? "default" : "outline"}
            onClick={() => setActiveTab("approvals")}
          >
            Aprobaciones Pendientes
          </Button>
        </div>
      </div>

      {/* Department Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentDepartment && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Departamento seleccionado:</span>
                <Badge variant="outline">{currentDepartment.name}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {activeTab === "stock" && stats && currentDepartment && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medicamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Normal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.normal}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crítico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exceso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.excess}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {activeTab === "stock" ? (
        currentDepartment ? (
          <MedicationStockTable
            stock={currentDepartment.medicationStock || []} {/* ✅ PROTECCIÓN AQUÍ TAMBIÉN */}
            departmentId={currentDepartment.id}
            onUpdate={fetchDepartmentDetails}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Selecciona un Departamento</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Para gestionar el stock de medicamentos, selecciona un departamento de la lista.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <StockApprovalTable onUpdate={() => {
          // Refresh both the stock and approvals
          if (selectedDepartment) {
            fetchDepartmentDetails()
          }
        }} />
      )}
    </div>
  )
}