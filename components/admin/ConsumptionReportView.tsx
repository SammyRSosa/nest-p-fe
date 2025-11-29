"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  BarChart3, 
  TrendingDown, 
  Package, 
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import type { ConsumptionReport } from "@/types"
import { useConsumptionReports } from "@/hooks/useMedicationStock"

interface ConsumptionReportViewProps {
  medicationId?: string
}

export function ConsumptionReportView({ medicationId }: ConsumptionReportViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMedication, setSelectedMedication] = useState<string>(medicationId || "")
  
  const { reports, loading, getConsumptionReport, getAllConsumption } = useConsumptionReports()

  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const handleGenerateReport = async () => {
    try {
      const monthStr = selectedMonth.toString().padStart(2, '0')
      if (selectedMedication) {
        await getConsumptionReport(selectedMedication, monthStr, selectedYear)
      } else {
        await getAllConsumption(monthStr, selectedYear)
      }
    } catch (error) {
      console.error("Error generating report:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'excess':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      normal: "default",
      low: "secondary",
      critical: "destructive",
      excess: "outline",
    }
    
    const labels: Record<string, string> = {
      normal: "Normal",
      low: "Bajo",
      critical: "Crítico",
      excess: "Exceso",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    )
  }

  const getConsumptionPercentage = (consumed: number, current: number, max: number) => {
    if (max === 0) return 0
    const totalUsed = max - current
    return (consumed / totalUsed) * 100
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Configurar Reporte de Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mes</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Medicamento (Opcional)</label>
              <Input
                value={selectedMedication}
                onChange={(e) => setSelectedMedication(e.target.value)}
                placeholder="ID del medicamento"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerateReport} disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Display */}
      {reports.length > 0 && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="details">Detalles por Departamento</TabsTrigger>
            <TabsTrigger value="analysis">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card key={report.medicationId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{report.medicationName}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {months[selectedMonth - 1].label} {selectedYear}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Consumido:</span>
                        <span className="font-bold text-lg">{report.totalConsumed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Departamentos:</span>
                        <span className="font-medium">{report.departmentBreakdown.length}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">Departamentos con consumo:</div>
                        <div className="flex flex-wrap gap-1">
                          {report.departmentBreakdown.map((dept) => (
                            <Badge key={dept.departmentId} variant="outline" className="text-xs">
                              {dept.departmentName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {reports.map((report) => (
              <Card key={report.medicationId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {report.medicationName} - {months[selectedMonth - 1].label} {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Consumido</TableHead>
                        <TableHead>Stock Actual</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Porcentaje de Uso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.departmentBreakdown.map((dept) => (
                        <TableRow key={dept.departmentId}>
                          <TableCell className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {dept.departmentName}
                          </TableCell>
                          <TableCell className="font-medium">{dept.consumed}</TableCell>
                          <TableCell>{dept.currentStock}</TableCell>
                          <TableCell>{getStatusBadge(dept.stockStatus)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={Math.min(getConsumptionPercentage(dept.consumed, dept.currentStock, 100), 100)}
                                className="w-20 h-2"
                              />
                              <span className="text-sm">
                                {Math.round(getConsumptionPercentage(dept.consumed, dept.currentStock, 100))}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Medicamentos Mayor Consumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports
                      .sort((a, b) => b.totalConsumed - a.totalConsumed)
                      .slice(0, 5)
                      .map((report, index) => (
                        <div key={report.medicationId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <span>{report.medicationName}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{report.totalConsumed}</div>
                            <div className="text-sm text-muted-foreground">
                              {report.departmentBreakdown.length} deptos.
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Stock Crítico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports
                      .filter(report => 
                        report.departmentBreakdown.some(dept => dept.stockStatus === 'critical')
                      )
                      .map((report) => (
                        <div key={report.medicationId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{report.medicationName}</span>
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Crítico
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Departamentos críticos:{" "}
                            {report.departmentBreakdown
                              .filter(dept => dept.stockStatus === 'critical')
                              .map(dept => dept.departmentName)
                              .join(", ")}
                          </div>
                        </div>
                      ))}
                    {reports.filter(report => 
                      report.departmentBreakdown.some(dept => dept.stockStatus === 'critical')
                    ).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No hay alertas de stock crítico
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {reports.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Reportes</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Selecciona un período y genera un reporte para ver el consumo de medicamentos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}