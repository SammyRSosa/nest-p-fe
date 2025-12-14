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

  const createPatient = async (patient: any): Promise<boolean> => {
    try {
      await api.patients.create(patient)
      toast({ title: "Éxito", description: "Paciente creado correctamente" })
      await loadPatients()
      return true
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo crear el paciente", variant: "destructive" })
      return false
    }
  }

  const updatePatient = async (idNumber: string, patient: any): Promise<boolean> => {
    try {
      await api.patients.update(idNumber, patient)
      toast({ title: "Éxito", description: "Paciente actualizado correctamente" })
      await loadPatients()
      return true
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el paciente", variant: "destructive" })
      return false
    }
  }

  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      await api.patients.delete(id)
      toast({
        title: "Éxito",
        description: "Paciente eliminado correctamente",
      })
      await loadPatients()
      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el Paciente",
        variant: "destructive",
      })
      return false
    }
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
