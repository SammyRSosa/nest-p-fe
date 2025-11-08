import type { AuthResponse, LoginCredentials } from "@/types"

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
    create: async (data: any) =>
      fetchWithAuth("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
}
