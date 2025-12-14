"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface PatientFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

interface FormData {
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
}

export function PatientForm({ initialData, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    idNumber: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        idNumber: initialData.idNumber != null ? String(initialData.idNumber) : "",
        email: initialData.email || "",
        phone: initialData.phone != null ? String(initialData.phone) : "",
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
          : "",
      })
    }
  }, [initialData])

  const handleChange = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...(prev as any), [field]: value } as FormData))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Convert numeric/date fields back to expected types
    const submitData = {
      ...formData,
      idNumber: formData.idNumber ? Number(formData.idNumber) : null,
      phone: formData.phone ? Number(formData.phone) : null,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
    }

    await onSubmit(submitData)
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
      <input
        type="number"
        placeholder="ID"
        value={formData.idNumber}
        onChange={(e) => handleChange("idNumber", e.target.value)}
        required
        className="input w-full"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => handleChange("email", e.target.value)}
        required
        className="input w-full"
      />
      <input
        type="number"
        placeholder="Telefono"
        value={formData.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        required
        className="input w-full"
      />
      <input
        type="date"
        placeholder="Fecha de Nacimiento"
        value={formData.dateOfBirth}
        onChange={(e) => handleChange("dateOfBirth", e.target.value)}
        required
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