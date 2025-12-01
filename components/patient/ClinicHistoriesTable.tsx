"use client"

import { Button } from "@/components/ui/button"
import { TableList } from "@/components/table-list"

interface ClinicHistoriesTableProp {
  data: any
}

export function ClinicHistoriesTable({ data }: ClinicHistoriesTableProp) {
  const columns = [
    { key: "id", label: "ID" },
    { key: "consultations", label: "Consultas" },
    { key: "notes", label: "Notas" },
    { 
      key: "createdAt", 
      label: "Fecha",
      render: (item: any) => new Date(item.createdAt).toLocaleDateString()
    },
  ]

  // ✅ Handle different response structures
  let safeData: any[] = []
  
  if (Array.isArray(data)) {
    safeData = data
  } else if (data && typeof data === 'object') {
    // Try common response structures
    safeData = data.data || data.clinicHistories || data.histories || []
  }

  return (
    <TableList
      data={safeData}
      columns={columns}
      searchPlaceholder="Buscar Consulta..."
    />
  )
}