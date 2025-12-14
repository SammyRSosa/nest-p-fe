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
      pdf.text(`Reporte de ${reportType}`, margin, yPosition)
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
      if (reportData.canceled !== undefined) {
        pdf.text(`Canceladas: ${reportData.canceled}`, margin + 5, yPosition)
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

      yPosition += 10

      // Tabla de datos
      if (reportData.data && reportData.data.length > 0) {
        pdf.setFontSize(11)
        pdf.text("Datos Detallados:", margin, yPosition)
        yPosition += 8

        const tableData = reportData.data.slice(0, 50).map((item: any) => {
          switch (reportType) {
            case "consultations":
              return [
                `${item.patient?.firstName || ""} ${item.patient?.lastName || ""}`.substring(0, 20),
                `${item.mainDoctor?.firstName || ""} ${item.mainDoctor?.lastName || ""}`.substring(0, 15),
                (item.department?.name || "").substring(0, 15),
                item.status || "",
                new Date(item.createdAt).toLocaleDateString("es-ES"),
              ]
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
                item.role || "",
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
            ? ["Paciente", "Doctor", "Depto", "Estado", "Fecha"]
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

  const reportTypes = [
    { id: "consultations", label: "Consultas", icon: FileText },
    { id: "medications", label: "Medicamentos", icon: Pill },
    { id: "remissions", label: "Remisiones", icon: TrendingUp },
    { id: "patients", label: "Pacientes", icon: User },
    { id: "personnel", label: "Personal", icon: Users },
    { id: "departments_summary", label: "Departamentos", icon: Building2 },
  ]

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
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Reporte</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {reportTypes.map((report) => {
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
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

          {/* Button */}
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

      {/* Report Preview */}
      {reportData && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Vista Previa</h2>
            <Button
              onClick={generatePDF}
              disabled={generating}
              size="lg"
            >
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
          </div>
          <div className="border rounded-lg bg-white p-8 overflow-auto">
            {renderReport(reportType, reportData)}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to render reports
function renderReport(type: string, data: any) {
  if (!data) return null

  switch (type) {
    case "consultations":
      return <ConsultationsReport data={data} />
    case "medications":
      return <MedicationsReport data={data} />
    case "remissions":
      return <RemissionsReport data={data} />
    case "patients":
      return <PatientsReport data={data} />
    case "personnel":
      return <PersonnelReport data={data} />
    case "departments_summary":
      return <DepartmentsSummaryReport data={data} />
    default:
      return null
  }
}

// Report Components
function ConsultationsReport({ data }: { data: any }) {
  return (
    <div id="report-content" className="space-y-6">
      <ReportHeader
        title="Reporte de Consultas"
        subtitle={`Generado el ${new Date().toLocaleDateString("es-ES")}`}
      />
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="Total" value={data.total} />
        <StatBox label="Cerradas" value={data.closed} color="green" />
        <StatBox label="Pendientes" value={data.pending} color="yellow" />
        <StatBox label="Canceladas" value={data.canceled} color="red" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Paciente</th>
              <th className="border p-2 text-left">Doctor</th>
              <th className="border p-2 text-left">Departamento</th>
              <th className="border p-2 text-left">Estado</th>
              <th className="border p-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((consultation: any, idx: number) => (
              <tr key={idx}>
                <td className="border p-2">
                  {consultation.patient?.firstName} {consultation.patient?.lastName}
                </td>
                <td className="border p-2">
                  {consultation.mainDoctor?.firstName} {consultation.mainDoctor?.lastName}
                </td>
                <td className="border p-2">{consultation.department?.name}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                    consultation.status === "closed" ? "bg-green-600"
                      : consultation.status === "pending" ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}>
                    {consultation.status}
                  </span>
                </td>
                <td className="border p-2">
                  {new Date(consultation.createdAt).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MedicationsReport({ data }: { data: any }) {
  return (
    <div id="report-content" className="space-y-6">
      <ReportHeader
        title="Reporte de Stock de Medicamentos"
        subtitle={`Generado el ${new Date().toLocaleDateString("es-ES")}`}
      />
      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Total Medicamentos" value={data.total} />
        <StatBox label="Stock Bajo" value={data.lowStock} color="red" />
        <StatBox label="Cantidad Total" value={data.totalQuantity} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Medicamento</th>
              <th className="border p-2 text-left">Departamento</th>
              <th className="border p-2 text-left">Cantidad</th>
              <th className="border p-2 text-left">Unidad</th>
              <th className="border p-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="border p-2">{item.medication?.name}</td>
                <td className="border p-2">{item.department?.name}</td>
                <td className="border p-2 font-semibold">{item.quantity}</td>
                <td className="border p-2">{item.medication?.unit}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                    item.quantity < 5 ? "bg-red-600"
                      : item.quantity < 10 ? "bg-yellow-600"
                        : "bg-green-600"
                  }`}>
                    {item.quantity < 5 ? "Crítico"
                      : item.quantity < 10 ? "Bajo"
                        : "Normal"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RemissionsReport({ data }: { data: any }) {
  return (
    <div id="report-content" className="space-y-6">
      <ReportHeader
        title="Reporte de Remisiones"
        subtitle={`Generado el ${new Date().toLocaleDateString("es-ES")}`}
      />
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="Total" value={data.total} />
        <StatBox label="Internas" value={data.internal} color="blue" />
        <StatBox label="Externas" value={data.external} color="purple" />
        <StatBox label="Con Consulta" value={data.withConsultation} color="green" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Paciente</th>
              <th className="border p-2 text-left">Destino</th>
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((remission: any, idx: number) => (
              <tr key={idx}>
                <td className="border p-2">
                  {remission.patient?.firstName} {remission.patient?.lastName}
                </td>
                <td className="border p-2">
                  {remission.toDepartment?.name || remission.medicalPost?.name}
                </td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                    remission.type === "internal" ? "bg-blue-600" : "bg-purple-600"
                  }`}>
                    {remission.type === "internal" ? "Interna" : "Externa"}
                  </span>
                </td>
                <td className="border p-2">
                  {new Date(remission.createdAt).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PatientsReport({ data }: { data: any }) {
  return (
    <div id="report-content" className="space-y-6">
      <ReportHeader
        title="Reporte de Pacientes"
        subtitle={`Generado el ${new Date().toLocaleDateString("es-ES")}`}
      />
      <div className="grid grid-cols-1 gap-4">
        <StatBox label="Total de Pacientes" value={data.total} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Nombre</th>
              <th className="border p-2 text-left">Cédula</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((patient: any, idx: number) => (
              <tr key={idx}>
                <td className="border p-2">
                  {patient.firstName} {patient.lastName}
                </td>
                <td className="border p-2">{patient.idNumber}</td>
                <td className="border p-2">{patient.email}</td>
                <td className="border p-2">{patient.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PersonnelReport({ data }: { data: any }) {
  return (
    <div id="report-content" className="space-y-6">
      <ReportHeader
        title="Reporte de Personal"
        subtitle={`Generado el ${new Date().toLocaleDateString("es-ES")}`}
      />
      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Total" value={data.total} />
        <StatBox label="Médicos" value={data.doctors} color="blue" />
        <StatBox label="Enfermeros" value={data.nurses} color="purple" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Nombre</th>
              <th className="border p-2 text-left">Rol</th>
              <th className="border p-2 text-left">Departamento</th>
              <th className="border p-2 text-left">Código</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((worker: any, idx: number) => (
              <tr key={idx}>
                <td className="border p-2">
                  {worker.firstName} {worker.lastName}
                </td>
                <td className="border p-2">
                  <span className="px-2 py-1 rounded text-white text-xs font-semibold bg-blue-600">
                    {worker.role}
                  </span>
                </td>
                <td className="border p-2">{worker.department?.name}</td>
                <td className="border p-2">{worker.code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DepartmentsSummaryReport({ data }: { data: any }) {
  return (
    <div id="report-content" className="space-y-6">
      <ReportHeader
        title="Resumen de Departamentos"
        subtitle={`Generado el ${new Date().toLocaleDateString("es-ES")}`}
      />
      <div className="grid grid-cols-1 gap-4">
        <StatBox label="Total Departamentos" value={data.total} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Departamento</th>
              <th className="border p-2 text-left">Jefe</th>
              <th className="border p-2 text-left">Personal</th>
              <th className="border p-2 text-left">Consultas</th>
              <th className="border p-2 text-left">Medicamentos</th>
            </tr>
          </thead>
          <tbody>
            {data.data?.map((dept: any, idx: number) => (
              <tr key={idx}>
                <td className="border p-2 font-semibold">{dept.name}</td>
                <td className="border p-2">{dept.head}</td>
                <td className="border p-2">{dept.personnel}</td>
                <td className="border p-2">{dept.consultations}</td>
                <td className="border p-2">{dept.medicationTypes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Helper Components
function ReportHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b-2 pb-4">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

function StatBox({
  label,
  value,
  color = "primary",
}: {
  label: string
  value: number | string
  color?: string
}) {
  const colors: Record<string, string> = {
    primary: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  }

  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <p className="text-sm font-semibold opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}