"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

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
    departmentName: "", // nuevo: lo que el usuario ve y escribe
    departmentId: "",   // interno: id real del departamento
  })

  const [suggestions, setSuggestions] = useState<Array<{ id: string, name: string }>>([])


  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName ?? "",
        lastName: initialData.lastName ?? "",
        role: initialData.role ?? "",
        departmentName: initialData.departmentName ?? "", // nuevo
        departmentId: initialData.departmentId ?? "",     // interno
      })
    }
  }, [initialData])

const fetchDepartments = async (query: string) => {
  const data = await api.departments.getByName(query);
  setSuggestions(data);
};




  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      departmentId: formData.departmentId, // obligatorio para backend
    })
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
      <div className="relative">
        <input
          type="text"
          placeholder="Departamento (opcional)"
          value={formData.departmentName}
          onChange={(e) => {
            handleChange("departmentName", e.target.value)
            fetchDepartments(e.target.value)
          }}
          className="input w-full"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full border bg-white max-h-40 overflow-y-auto">
            {suggestions.map((dep) => (
              <li
                key={dep.id}
                className="p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  handleChange("departmentName", dep.name)
                  handleChange("departmentId", dep.id) // guardamos id real
                  setSuggestions([])
                }}
              >
                {dep.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
