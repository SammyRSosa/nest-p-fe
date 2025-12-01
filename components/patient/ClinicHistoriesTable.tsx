"use client"

import { Button } from "@/components/ui/button"
import { TableList } from "@/components/table-list"

interface ClinicHistoriesTableProp {
  data: any[]
}

export function ClinicHistoriesTable({ data }: ClinicHistoriesTableProp) {
  const columns = [
    { key: "id", label: "ID" },
    { key: "consultations", label: "Consultas" },
    { key: "notes", label: "Notas" },
    { key: "createdAt", label: "Fecha" },
  ]

  return (
    <TableList
      data={data}
      columns={columns}
      searchPlaceholder="Buscar Consulta..."
    />
  )
}
