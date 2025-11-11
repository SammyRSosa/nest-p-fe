import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function useWorkers() {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadWorkers = async () => {
    try {
      const data = await api.workers.getAll()
      setWorkers(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los trabajadores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createWorker = async (worker: any) => {
    await api.workers.create(worker)
    toast({ title: "Éxito", description: "Trabajador creado correctamente" })
    await loadWorkers()
  }

  const updateWorker = async (id: string, worker: any) => {
    await api.workers.update(id, worker)
    toast({ title: "Éxito", description: "Trabajador actualizado correctamente" })
    await loadWorkers()
  }

  const deleteWorker = async (id: string) => {
    await api.workers.delete(id)
    toast({ title: "Éxito", description: "Trabajador eliminado correctamente" })
    await loadWorkers()
  }

  useEffect(() => {
    loadWorkers()
  }, [])

  return {
    workers,
    loading,
    createWorker,
    updateWorker,
    deleteWorker,
    reload: loadWorkers,
  }
}
