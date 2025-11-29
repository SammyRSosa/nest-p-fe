export enum UserRole {
  ADMIN = "admin",
  HEAD_OF_DEPARTMENT = "head_of_department",
  DOCTOR = "doctor",
  NURSE = "nurse",
  STAFF = "staff",
  PATIENT = "patient",
}

export interface User {
  id: string
  account: string
  role: UserRole
  name: string
  email?: string
  departmentId?: string
}

export interface AuthResponse {
  access_token: string
  role: UserRole
}

export interface LoginCredentials {
  account: string
  password: string
}

// ============= DEPARTAMENTOS =============

export interface Department {
  id: string
  name: string
  description?: string
  headId?: string
  head?: User
  workers: User[]
  medicationStock: MedicationStock[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MedicationStock {
  id: string
  departmentId: string
  medicationId: string
  medicationName: string
  currentQuantity: number
  minQuantity: number
  maxQuantity: number
  unit: string
  status: 'normal' | 'low' | 'critical' | 'excess'
  lastUpdated: string
  updatedBy: string
  isApproved: boolean
  approvedBy?: string
  approvedAt?: string
}

export interface DepartmentCreateRequest {
  name: string
  description?: string
  headId?: string
  initialStock?: MedicationStockRequest[]
}

export interface DepartmentUpdateRequest {
  name?: string
  description?: string
  headId?: string
  isActive?: boolean
}

export interface MedicationStockRequest {
  medicationId: string
  medicationName: string
  currentQuantity: number
  minQuantity: number
  maxQuantity: number
  unit: string
}

export interface StockUpdateRequest {
  medicationId: string
  newQuantity: number
  reason: string
  requiresApproval: boolean
}

export interface StockApprovalRequest {
  stockId: string
  approved: boolean
  notes?: string
}

export interface MedicationConsumption {
  id: string
  departmentId: string
  departmentName: string
  medicationId: string
  medicationName: string
  consumedQuantity: number
  consumptionDate: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
}

export interface ConsumptionReport {
  medicationId: string
  medicationName: string
  totalConsumed: number
  departmentBreakdown: {
    departmentId: string
    departmentName: string
    consumed: number
    currentStock: number
    stockStatus: 'normal' | 'low' | 'critical' | 'excess'
  }[]
  month: string
  year: number
}

export interface StaffAssignment {
  userId: string
  departmentId: string
  assignedAt: string
  assignedBy: string
}