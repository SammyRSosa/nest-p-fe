"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface WorkerFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function WorkerForm({ initialData, onSubmit, onCancel }: WorkerFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    departmentId: "",
  })

  useEffect(() => {
    if (initialData) setFormData(initialData)
  }, [initialData])

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nombre"
        value={formData.firstName}
        onChange={(e) => handleChange("firstName", e.target.value)}
        required
        className="input w-full"
      />
      <input
        type="text"
        placeholder="Apellido"
        value={formData.lastName}
        onChange={(e) => handleChange("lastName", e.target.value)}
        required
        className="input w-full"
      />
      <select
        value={formData.role}
        onChange={(e) => handleChange("role", e.target.value)}
        required
        className="input w-full"
      >
        <option value="">Selecciona rol</option>
        <option value="doctor">Doctor</option>
        <option value="nurse">Enfermero</option>
        <option value="head_of_department">Jefe de Departamento</option>
        <option value="staff">Staff</option>
      </select>
      <input
        type="text"
        placeholder="ID del Departamento (opcional)"
        value={formData.departmentId}
        onChange={(e) => handleChange("departmentId", e.target.value)}
        className="input w-full"
      />
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
