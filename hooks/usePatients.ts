import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function usePatients() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadPatients = async () => {
    try {
      const data = await api.patients.getAll()
      setPatients(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los Pacientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createPatient = async (patient: any) => {
    await api.patients.create(patient)
    toast({ title: "Éxito", description: "Paciente creado correctamente" })
    await loadPatients()
  }

  const updatePatient = async (id: string, patient: any) => {
    await api.patients.update(id, patient)
    toast({ title: "Éxito", description: "Paciente actualizado correctamente" })
    await loadPatients()
  }

  const deletePatient = async (id: string) => {
    await api.patients.delete(id)
    toast({ title: "Éxito", description: "Paciente eliminado correctamente" })
    await loadPatients()
  }

  useEffect(() => {
    loadPatients()
  }, [])

  return {
    patients,
    loading,
    createPatient,
    updatePatient,
    deletePatient,
    reload: loadPatients,
  }
}
