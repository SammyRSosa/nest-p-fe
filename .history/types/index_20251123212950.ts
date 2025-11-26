// 📁 types.ts - REEMPLAZAR CONTENIDO
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
  code?: string
  firstName?: string
  lastName?: string
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

export interface HeadOfDepartment {
  id: string
  worker: User
  department: Department
  assignedAt: string
  endedAt?: string
}

export interface Department {
  id: string
  name: string
  description?: string
  headOfDepartment?: HeadOfDepartment  // ✅ CAMBIADO de 'head' a 'headOfDepartment'
  workers: User[]
  medicationStock: MedicationStock[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  stocks?: Stock[] // ✅ AGREGADO para compatibilidad con backend
}

export interface Stock {
  id: string
  department: Department
  // ... otras propiedades del stock
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

// ✅ ACTUALIZAR ESTAS INTERFACES PARA QUE COINCIDAN CON EL BACKEND
export interface DepartmentCreateRequest {
  name: string
  headWorkerId: string  // ✅ CAMBIADO de 'headId' a 'headWorkerId'
}

export interface DepartmentUpdateRequest {
  name?: string
  headWorkerId?: string  // ✅ CAMBIADO de 'headId' a 'headWorkerId'
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

// ✅ NUEVA INTERFACE PARA ASIGNACIONES DE TRABAJADORES
export interface WorkerDepartment {
  id: string
  worker: User
  department: Department
  active: boolean
  joinedAt: string
  leftAt?: string
}