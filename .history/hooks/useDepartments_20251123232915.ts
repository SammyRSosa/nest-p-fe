"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { Department } from "@/types"

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.departments.getAll()
      console.log("📊 Departments data received:", data)
      setDepartments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading departments")
    } finally {
      setLoading(false)
    }
  }

  // ✅ USAR TIPOS DIRECTOS EN LUGAR DE LAS INTERFACES
  const createDepartment = async (data: { name: string; headWorkerId: string }) => {
    setLoading(true)
    setError(null)
    try {
      console.log("🚀 Creating department with data:", data)
      const newDepartment = await api.departments.create(data)
      setDepartments(prev => [...prev, newDepartment])
      return newDepartment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating department")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateDepartment = async (id: string, data: { name: string; headWorkerId: string }) => {
    setLoading(true)
    setError(null)
    try {
      console.log("🔄 Updating department:", id, "with data:", data)
      const updatedDepartment = await api.departments.update(id, data)
      setDepartments(prev => prev.map(dept => 
        dept.id === id ? updatedDepartment : dept
      ))
      return updatedDepartment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating department")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteDepartment = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.departments.delete(id)
      setDepartments(prev => prev.filter(dept => dept.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting department")
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  }
}

export function useDepartment(id: string) {
  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartment = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.departments.getById(id)
      setDepartment(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading department")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartment()
  }, [id])

  return {
    department,
    loading,
    error,
    fetchDepartment,
  }
}