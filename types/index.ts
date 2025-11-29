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
