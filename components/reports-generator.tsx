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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText,
  Download,
  Loader2,
  BarChart3,
  Users,
  Pill,
  User,
  Building2,
  TrendingUp,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import type { Department } from "@/types"

export default function ReportsGenerator() {
  const [reportType, setReportType] = useState<string>("consultations")
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [status, setStatus] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const data = await api.departments.getAll()
      setDepartments(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadReport = async () => {
    setLoading(true)
    try {
      let data

      const params = new URLSearchParams()
      if (selectedDepartment && selectedDepartment !== "all") {
        params.append("departmentId", selectedDepartment)
      }
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      if (status && status !== "all") params.append("status", status)

      const queryString = params.toString()

      switch (reportType) {
        case "consultations":
          data = await api.reports.getConsultations(queryString)
          break
        case "medications":
          data = await api.reports.getMedications(selectedDepartment === "all" ? "" : selectedDepartment)
          break
        case "remissions":
          data = await api.reports.getRemissions(queryString)
          break
        case "patients":
          data = await api.reports.getPatients(selectedDepartment === "all" ? "" : selectedDepartment)
          break
        case "personnel":
          data = await api.reports.getPersonnel(selectedDepartment === "all" ? "" : selectedDepartment)
          break
        case "departments_summary":
          data = await api.reports.getDepartmentsSummary()
          break
        default:
          data = null
      }

      setReportData(data)
      toast({
        title: "Reporte cargado",
        description: "El reporte se ha generado exitosamente.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar reporte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "No hay reporte para descargar",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      let yPosition = 20
      const pageHeight = pdf.internal.pageSize.getHeight()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 10

      // Título
      pdf.setFontSize(18)
      pdf.text(`Reporte de ${getReportTitle(reportType)}`, margin, yPosition)
      yPosition += 15

      // Fecha
      pdf.setFontSize(10)
      pdf.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, margin, yPosition)
      yPosition += 10

      // Estadísticas
      pdf.setFontSize(12)
      pdf.text("Estadísticas:", margin, yPosition)
      yPosition += 7

      pdf.setFontSize(10)
      if (reportData.total !== undefined) {
        pdf.text(`Total: ${reportData.total}`, margin + 5, yPosition)
        yPosition += 6
      }
      if (reportData.closed !== undefined) {
        pdf.text(`Cerradas: ${reportData.closed}`, margin + 5, yPosition)
        yPosition += 6
      }
      if (reportData.pending !== undefined) {
        pdf.text(`Pendientes: ${reportData.pending}`, margin + 5, yPosition)
        yPosition += 6
      }
      if (reportData.doctors !== undefined) {
        pdf.text(`Médicos: ${reportData.doctors}`, margin + 5, yPosition)
        yPosition += 6
      }
      if (reportData.nurses !== undefined) {
        pdf.text(`Enfermeros: ${reportData.nurses}`, margin + 5, yPosition)
        yPosition += 6
      }

      // Tabla de datos
      if (reportData.data && reportData.data.length > 0) {
        yPosition += 10
        pdf.setFontSize(11)
        pdf.text("Datos Detallados:", margin, yPosition)
        yPosition += 8

        const tableData = reportData.data.slice(0, 50).map((item: any) => {
          switch (reportType) {
            case "consultations": {
              const patient =
                item.patient ||
                item.internalRemission?.patient ||
                item.externalRemission?.patient ||
                item.programmedConsultation?.internalRemission?.patient ||
                item.programmedConsultation?.externalRemission?.patient;
              
              console.log(item)
              return [
                `${patient?.firstName || "—"} ${patient?.lastName || ""}`.substring(0, 20),
                `${item.mainDoctor?.firstName || ""} ${item.mainDoctor?.lastName || ""}`.substring(0, 15),
                (item.department?.name || "").substring(0, 15),
                getStatusLabel(item.status || ""),
                new Date(item.createdAt).toLocaleDateString("es-ES"),
              ];
            }
            case "medications":
              return [
                (item.medication?.name || "").substring(0, 20),
                (item.department?.name || "").substring(0, 15),
                item.quantity || "0",
                item.medication?.unit || "",
              ]
            case "patients":
              return [
                `${item.firstName || ""} ${item.lastName || ""}`.substring(0, 20),
                item.idNumber || "",
                (item.email || "").substring(0, 20),
                (item.phone || "").substring(0, 15),
              ]
            case "personnel":
              return [
                `${item.firstName || ""} ${item.lastName || ""}`.substring(0, 20),
                getRoleLabel(item.role || ""),
                (item.department?.name || "").substring(0, 15),
                item.code || "",
              ]
            case "remissions":
              return [
                `${item.patient?.firstName || ""} ${item.patient?.lastName || ""}`.substring(0, 20),
                (item.toDepartment?.name || item.medicalPost?.name || "").substring(0, 20),
                item.type === "internal" ? "Interna" : "Externa",
                new Date(item.createdAt).toLocaleDateString("es-ES"),
              ]
            case "departments_summary":
              return [
                (item.name || "").substring(0, 20),
                (item.head || "").substring(0, 20),
                item.personnel || "0",
                item.consultations || "0",
                item.medicationTypes || "0",
              ]
            default:
              return []
          }
        })

        const headers =
          reportType === "consultations"
            ? ["Paciente", "Médico", "Depto", "Estado", "Fecha"]
            : reportType === "medications"
              ? ["Medicamento", "Depto", "Cantidad", "Unidad"]
              : reportType === "patients"
                ? ["Nombre", "Cédula", "Email", "Teléfono"]
                : reportType === "personnel"
                  ? ["Nombre", "Rol", "Depto", "Código"]
                  : reportType === "remissions"
                    ? ["Paciente", "Destino", "Tipo", "Fecha"]
                    : ["Depto", "Jefe", "Personal", "Consultas", "Medicamentos"]

        pdf.setFontSize(9)
        let tableY = yPosition

        // Headers
        pdf.setFont("bold")
        headers.forEach((header, idx) => {
          const x = margin + idx * (pageWidth / headers.length - margin)
          pdf.text(header, x, tableY)
        })
        tableY += 7
        pdf.setFont("normal")

        // Datos
        tableData.forEach((row: any) => {
          if (tableY > pageHeight - 20) {
            pdf.addPage()
            tableY = 20
          }
          row.forEach((cell: string, idx: number) => {
            const x = margin + idx * (pageWidth / headers.length - margin)
            pdf.text(String(cell).substring(0, 15), x, tableY)
          })
          tableY += 6
        })
      }

      const fileName = `reporte-${reportType}-${new Date().toISOString().split("T")[0]}.pdf`
      const pdfBlob = pdf.output("blob")
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF Descargado",
        description: `${fileName} se descargó exitosamente.`,
      })
    } catch (error: any) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error",
        description: "Error al generar PDF. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const getRoleLabel = (role: string): string => {
    const roles: Record<string, string> = {
      doctor: "Médico",
      nurse: "Enfermero",
      staff: "Personal",
      admin: "Administrador",
      head_of_department: "Jefe de Departamento",
    }
    return roles[role] || role
  }

  const getStatusLabel = (status: string): string => {
    const statuses: Record<string, string> = {
      pending: "Pendiente",
      closed: "Cerrada",
      canceled: "Cancelada",
      active: "Activo",
      inactive: "Inactivo",
    }
    return statuses[status] || status
  }

  const getReportTitle = (type: string): string => {
    const titles: Record<string, string> = {
      consultations: "Consultas",
      medications: "Medicamentos",
      remissions: "Remisiones",
      patients: "Pacientes",
      personnel: "Personal",
      departments_summary: "Departamentos",
    }
    return titles[type] || "Reporte"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generador de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Reporte</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: "consultations", label: "Consultas", icon: FileText },
                { id: "medications", label: "Medicamentos", icon: Pill },
                { id: "remissions", label: "Remisiones", icon: TrendingUp },
                { id: "patients", label: "Pacientes", icon: User },
                { id: "personnel", label: "Personal", icon: Users },
                { id: "departments_summary", label: "Departamentos", icon: Building2 },
              ].map((report) => {
                const IconComponent = report.icon
                return (
                  <Button
                    key={report.id}
                    variant={reportType === report.id ? "default" : "outline"}
                    onClick={() => {
                      setReportType(report.id)
                      setReportData(null)
                    }}
                    className="h-auto flex-col gap-2 py-4"
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs">{report.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {["consultations", "remissions"].includes(reportType) && (
              <>
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {reportType === "consultations" && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="closed">Cerrada</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button onClick={loadReport} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Reporte"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vista Previa del Reporte</CardTitle>
            <Button onClick={generatePDF} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Descargar PDF
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto bg-gray-50 p-4 rounded-lg">
              <div className="bg-white p-6 rounded">
                <h2 className="text-2xl font-bold mb-4">{getReportTitle(reportType)}</h2>
                <p className="text-gray-600 mb-6">
                  Generado: {new Date().toLocaleDateString("es-ES")}
                </p>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Estadísticas</h3>
                  <p className="text-gray-700">Total de registros: {reportData.total || 0}</p>
                </div>

                {reportData.data && reportData.data.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Datos</h3>
                    <p className="text-sm text-gray-600">
                      Mostrando {Math.min(10, reportData.data.length)} de {reportData.data.length} registros
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}