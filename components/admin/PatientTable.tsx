"use client"

import { Button } from "@/components/ui/button"
import { TableList } from "@/components/table-list"

interface PatientTableProps {
  data: any[]
  onEdit: (patient: any) => void
  onDelete: (id: string) => void
}

export function PatientTable({ data, onEdit, onDelete }: PatientTableProps) {
  const columns = [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "idNumber", label: "ID" },
    { key: "email", label: "Correo" },
    { key: "phone", label: "Telefono" },
    { key: "dateOfBirth", label: "Fecha de Nacimiento"},
    {
      key: "actions",
      label: "Acciones",
      render: (patient: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(patient)}>
            Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(patient.id)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <TableList
      data={data}
      columns={columns}
      searchPlaceholder="Buscar Paciente..."
    />
  )
}
