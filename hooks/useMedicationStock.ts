"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { MedicationStock, StockUpdateRequest, StockApprovalRequest, ConsumptionReport } from "@/types"

export function useMedicationStock(departmentId: string) {
  const [stock, setStock] = useState<MedicationStock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStock = async () => {
    if (!departmentId) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.medicationStock.getByDepartment(departmentId)
      setStock(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading medication stock")
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (data: StockUpdateRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.medicationStock.updateStock(departmentId, data)
      await fetchStock() // Refresh to get updated stock
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating stock")
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [departmentId])

  return {
    stock,
    loading,
    error,
    fetchStock,
    updateStock,
  }
}

export function useStockApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState<MedicationStock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPendingApprovals = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.medicationStock.getPendingApprovals()
      setPendingApprovals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading pending approvals")
    } finally {
      setLoading(false)
    }
  }

  const approveStockUpdate = async (stockId: string, data: StockApprovalRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.medicationStock.approveStockUpdate(stockId, data)
      await fetchPendingApprovals() // Refresh list
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error approving stock update")
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  return {
    pendingApprovals,
    loading,
    error,
    fetchPendingApprovals,
    approveStockUpdate,
  }
}

export function useConsumptionReports() {
  const [reports, setReports] = useState<ConsumptionReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getConsumptionReport = async (medicationId: string, month: string, year: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.medicationStock.getConsumptionReport(medicationId, month, year)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading consumption report")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAllConsumption = async (month: string, year: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.medicationStock.getAllConsumption(month, year)
      setReports(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading consumption reports")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    reports,
    loading,
    error,
    getConsumptionReport,
    getAllConsumption,
  }
}