import type { AuthResponse, LoginCredentials } from "@/types"
import { de } from "date-fns/locale"
import { create } from "domain"
import { register } from "module"

// Normalize base URL (avoid double slashes)
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000")
  .replace(/\/$/, "")

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const headers = new Headers({
    "Content-Type": "application/json",
  })

  // Merge user-provided headers safely
  if (options.headers) {
    const providedHeaders = new Headers(options.headers as HeadersInit)
    providedHeaders.forEach((value, key) => headers.set(key, value))
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new ApiError(response.status, error.message || "Request failed")
  }

  // Only try to parse JSON if response has a body
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export const api = {
  // ---------------- AUTH ----------------
  auth: {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      })
    },
    logout: async () => {
      localStorage.removeItem("token")
      localStorage.removeItem("role")
      localStorage.removeItem("user")
    },
    register: async (data: { account: string; password: string; }) => {
      return fetchWithAuth("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
  },

  // ---------------- PATIENTS ----------------
  patients: {
    getAll: async () => fetchWithAuth("/patients"),
    getById: async (id: string) => fetchWithAuth(`/patients/${id}`),
    create: async (data: any) =>
      fetchWithAuth("/patients", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id: string, data: any) =>
      fetchWithAuth(`/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      fetchWithAuth(`/patients/${id}`, { method: "DELETE" }),
  },

  // ---------------- WORKERS ----------------
  workers: {
    getAll: async () => fetchWithAuth("/workers"),
    getById: async (id: string) => fetchWithAuth(`/workers/${id}`),
    create: async (data: any) =>
      fetchWithAuth("/workers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id: string, data: any) =>
      fetchWithAuth(`/workers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      fetchWithAuth(`/workers/${id}`, { method: "DELETE" }),
  },

  // ---------------- APPOINTMENTS ----------------
  appointments: {
    getAll: async () => fetchWithAuth("/appointments"),
    getById: async (id: string) => fetchWithAuth(`/appointments/${id}`),
    create: async (data: any) =>
      fetchWithAuth("/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id: string, data: any) =>
      fetchWithAuth(`/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // ---------------- DEPARTMENTS ----------------
  departments: {
    getAll: async () => fetchWithAuth("/departments"),
    getById: async (id: string) => fetchWithAuth(`/departments/${id}`),
    create: async (data: { name: string; headWorkerId: string }) =>
      fetchWithAuth("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    //update aun no esta implementado en el backend  
    update: async (id: string, data: { name: string; headWorkerId: string }) =>
      fetchWithAuth(`/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      fetchWithAuth(`/departments/${id}`, { method: "DELETE" }),
  },
  medicalPosts: {
    getAll: async () => fetchWithAuth("/medical-posts"),
  },

  workerDepartments: {
    assign: async (data: { workerId: string; departmentId: string }) =>
      fetchWithAuth("/worker-departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getAll: async () => fetchWithAuth("/worker-departments"),
    getById: async (id: string) => fetchWithAuth(`/worker-departments/bydepartment/${id}`),
    remove: async (id: string) =>
      fetchWithAuth(`/worker-departments/${id}`, { method: "DELETE" }),
  },


  // ---------------- USERS -----------------------
  users: {
    getAll: async () => fetchWithAuth("/users"),
    getById: async (id: string) => fetchWithAuth(`/users/${id}`),
    update: async (id: string, data: any) =>
      fetchWithAuth(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id: string) =>
      fetchWithAuth(`/users/${id}`, { method: "DELETE" }),
  },

  // ---------------- CONSULTATIONS -----------------------
  consultations: {
    getAll: async () => fetchWithAuth("/consultations"),
    getById: async (id: string) => fetchWithAuth(`/consultations/${id}`),
    create: async (data: any) =>
      fetchWithAuth("/consultations", { method: "POST", body: JSON.stringify(data) }),
    update: async (id: string, data: any) =>
      fetchWithAuth(`/consultations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: async (id: string) =>
      fetchWithAuth(`/consultations/${id}`, { method: "DELETE" }),
    updateStatus: async (id: string, status: "pending" | "closed" | "canceled") =>
      fetchWithAuth(`/consultations/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    getByDepartment: async (departmentId: string) =>
      fetchWithAuth(`/consultations/by-department/${departmentId}`),
    getByWorker: async (workerId: string) =>
      fetchWithAuth(`/consultations/by-worker/${workerId}`),
    getOwn: async () =>
      fetchWithAuth("consultations/my-consultations/own"),
    createProgrammed: async (data: any) =>
      fetchWithAuth("/consultations/programmed", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createEmergency: async (data: any) =>
      fetchWithAuth("/consultations/emergency", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // ---------- REMISSIONS ----------
  remissions: {
    getAll: async () => fetchWithAuth("/remissions"),

    getById: async (id: string) => fetchWithAuth(`/remissions/${id}`),

    create: async (data: any) =>
      fetchWithAuth("/remissions", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    createInternal: async (data: { patientId: string; fromDepartmentId: string; toDepartmentId: string }) =>
      fetchWithAuth("/remissions/internal", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    createExternal: async (data: { patientId: string; toDepartmentId: string; medicalPostId: string }) =>
      fetchWithAuth("/remissions/external", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    createConsultation: async (remissionId: string, data: any) =>
      fetchWithAuth(`/remissions/${remissionId}/consultations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    delete: async (id: string) =>
      fetchWithAuth(`/remissions/${id}`, { method: "DELETE" }),
  },
  
  // ---------- CLINIC HISTORIES ----------
  clinic_histories: {
    getAll: async () => fetchWithAuth("/clinic-history"),

    getMyOwn: async () => fetchWithAuth(`/clinic-history/my-history/own`),
    
    create: async (data: any) =>
      fetchWithAuth("/clinic_histories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
}
