"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { Department, DepartmentCreateRequest, DepartmentUpdateRequest, User } from "@/types"

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.departments.getAll()
      setDepartments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading departments")
    } finally {
      setLoading(false)
    }
  }

  const createDepartment = async (data: DepartmentCreateRequest) => {
    setLoading(true)
    setError(null)
    try {
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

  const updateDepartment = async (id: string, data: DepartmentUpdateRequest) => {
    setLoading(true)
    setError(null)
    try {
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

  const assignStaff = async (departmentId: string, userIds: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.departments.assignStaff(departmentId, userIds)
      await fetchDepartments() // Refresh to get updated staff
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error assigning staff")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const removeStaff = async (departmentId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      await api.departments.removeStaff(departmentId, userId)
      await fetchDepartments() // Refresh to get updated staff
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error removing staff")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const setHead = async (departmentId: string, headId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.departments.setHead(departmentId, headId)
      await fetchDepartments() // Refresh to get updated head
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error setting department head")
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
    assignStaff,
    removeStaff,
    setHead,
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