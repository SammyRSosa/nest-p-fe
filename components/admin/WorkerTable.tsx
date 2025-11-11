"use client"

import { Button } from "@/components/ui/button"
import { TableList } from "@/components/table-list"

interface WorkerTableProps {
  data: any[]
  onEdit: (worker: any) => void
  onDelete: (id: string) => void
}

export function WorkerTable({ data, onEdit, onDelete }: WorkerTableProps) {
  const columns = [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "role", label: "Rol" },
    { key: "code", label: "Código" },
    {
      key: "department",
      label: "Departamento",
      render: (worker: any) => worker.department?.name || "Sin departamento",
    },
    {
      key: "actions",
      label: "Acciones",
      render: (worker: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(worker)}>
            Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(worker.id)}>
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
      searchPlaceholder="Buscar trabajador..."
    />
  )
}
