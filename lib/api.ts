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
    getProfile: async () => fetchWithAuth("/auth/profile"),
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
  // ---------------- DEPARTMENTS ----------------
  departments: {
    getmydep: async () => fetchWithAuth("/departments/by-head"),
    getAll: async () => fetchWithAuth("/departments"),
    getById: async (id: string) => fetchWithAuth(`/departments/${id}`),
    getByName: async (query: string) =>
      fetchWithAuth(`/departments/search?q=${encodeURIComponent(query)}`),
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
  // ---------- MEDICAL POSTS ----------
  medicalPosts: {
    getAll: async () =>
      fetchWithAuth("/medical-posts"),

    findOne: async (id: string) =>
      fetchWithAuth(`/medical-posts/${id}`),

    create: async (name: string) =>
      fetchWithAuth("/medical-posts", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),

    remove: async (id: string) =>
      fetchWithAuth(`/medical-posts/${id}`, { method: "DELETE" }),
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

  // Add this to your api.tsx
  stockItems: {
    create: async (departmentId: string, data: { medicationId: string; quantity: number }) =>
      fetchWithAuth(`/stock-items/create/${departmentId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    patch: async (id: string, data: { minThreshold?: number; maxThreshold?: number, departmentId: string, medicationId: string }) =>
      fetchWithAuth(`/stock-items`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    findAll: async () => fetchWithAuth("/stock-items"),

    findByDepartment: async (departmentId: string) =>
      fetchWithAuth(`/stock-items/department/${departmentId}`),

    findByMedication: async (medicationId: string) =>
      fetchWithAuth(`/stock-items/medication/${medicationId}`),

    findByDepartmentAndMedication: async (departmentId: string, medicationId: string) =>
      fetchWithAuth(`/stock-items/department/${departmentId}/medication/${medicationId}`),
  },

  medications: {
    getAll: async () => fetchWithAuth("/medications"),

    getById: async (id: string) => fetchWithAuth(`/medications/${id}`),

    create: async (data: any) =>
      fetchWithAuth("/medications", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    search: async (query: string) =>
      fetchWithAuth(`/medications/search?q=${encodeURIComponent(query)}`),

    update: async (id: string, data: any) =>
      fetchWithAuth(`/medications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: async (id: string) =>
      fetchWithAuth(`/medications/${id}`, { method: "DELETE" }),
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
    updateStatus: async (id: string, status: "pending" | "closed" | "canceled", diagnosis?: string) => {
      if (diagnosis !== undefined) {
        status = "closed";
        fetchWithAuth(`/consultations/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status, diagnosis }),
        })
      } else
        fetchWithAuth(`/consultations/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        })
    },
    getByDepartment: async (departmentId: string) =>
      fetchWithAuth(`/consultations/by-department/${departmentId}`),
    getByWorker: async (workerId: string) =>
      fetchWithAuth(`/consultations/by-worker/${workerId}`),
    getByNurse: async () =>
      fetchWithAuth(`/consultations/by-nurse`),
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

  // ---------- CONSULTATION PRESCRIPTIONS ----------
  consultationPrescriptions: {
    create: async (data: {
      consultationId: string;
      medicationId: string;
      quantity: number;
      instructions?: string;
    }) =>
      fetchWithAuth("/consultation-prescriptions", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    findAll: async () =>
      fetchWithAuth("/consultation-prescriptions"),

    findOne: async (id: string) =>
      fetchWithAuth(`/consultation-prescriptions/${id}`),

    remove: async (id: string) =>
      fetchWithAuth(`/consultation-prescriptions/${id}`, { method: "DELETE" }),
  },

  // ---------- REPORTS ----------
  reports: {
    getDoctorSuccessRate: async (doctorId: string, startDate?: string, endDate?: string) => {

      // 1. Construct URLSearchParams to handle query parameters
      const params = new URLSearchParams({ doctorId });

      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }

      // 2. Build the full URL with the query string
      const url = `/reports/doctor-success-rate?${params.toString()}`;

      // 3. Execute the GET request
      // The request must be a GET request and must include the parameters in the URL.
      const response = await fetchWithAuth(url, {
        // GET is the default method, so we omit 'method'. 
        // We still include headers for consistency, but no body is attached.
        headers: {
          'Content-Type': 'application/json'
        },
      });

      // 4. Handle HTTP errors
      if (!response.ok) {
        // It's good practice to try and read error messages from the body
        const errorDetail = await response.text();
        throw new Error(`Failed to fetch doctor success rate: ${response.statusText}. Details: ${errorDetail}`);
      }

      return response;
    },

    getMedicationConsumptionByDepartment: async (departmentId?: string, month?: string) => {
      const response = await fetchWithAuth('/reports/medication-consumption/bydep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId, month }),
      });

      return response;
    },

    getConsultations: async (queryString: string = "") =>
      fetchWithAuth(`/reports/consultations${queryString ? `?${queryString}` : ""}`),

    getMedications: async (departmentId?: string) => {
      const params = new URLSearchParams()
      if (departmentId) params.append("departmentId", departmentId)
      return fetchWithAuth(`/reports/medications${params.toString() ? `?${params.toString()}` : ""}`)
    },

    getRemissions: async (queryString: string = "") =>
      fetchWithAuth(`/reports/remissions${queryString ? `?${queryString}` : ""}`),

    getPatients: async (departmentId?: string) => {
      const params = new URLSearchParams()
      if (departmentId) params.append("departmentId", departmentId)
      return fetchWithAuth(`/reports/patients${params.toString() ? `?${params.toString()}` : ""}`)
    },

    getPersonnel: async (departmentId?: string) => {
      const params = new URLSearchParams()
      if (departmentId) params.append("departmentId", departmentId)
      return fetchWithAuth(`/reports/personnel${params.toString() ? `?${params.toString()}` : ""}`)
    },

    getDepartmentsSummary: async () =>
      fetchWithAuth("/reports/departments-summary"),
  },
  // ---------- REMISSIONS ----------
  remissions: {
    getAll: async () => fetchWithAuth("/remissions"),

    getById: async (id: string) => fetchWithAuth(`/remissions/${id}`),

    getOwn: async () =>
      fetchWithAuth("remissions/my-remissions/own"),

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
      fetchWithAuth(`/ remissions / ${remissionId}/consultations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    delete: async (id: string) =>
      fetchWithAuth(`/remissions/${id}`, { method: "DELETE" }),
  },

  // ---------- MEDICATIONS------

  // ---------- Medication Deliveries -----------
  medicationDeliveries: {
    create: async (data: { departmentId: string; items: any[] }) =>
      fetchWithAuth("/medication-deliveries", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getAll: async () => fetchWithAuth("/medication-deliveries"),

    getById: async (id: string) => fetchWithAuth(`/medication-deliveries/${id}`),

    getByDepartment: async (departmentId: string) =>
      fetchWithAuth(`/medication-deliveries/department/${departmentId}`),

    updateStatus: async (id: string, status: "pending" | "delivered" | "canceled", comment?: string) =>
      fetchWithAuth(`/medication-deliveries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, comment }),
      }),
  },
  // ---------- Medication Delivery Items -----------
  medicationDeliveryItems: {
    getAll: async () => fetchWithAuth("/medication-delivery-items"),

    findByDelivery: async (deliveryId: string) =>
      fetchWithAuth(`/medication-delivery-items/delivery/${deliveryId}`),

    create: async (deliveryId: string, medicationId: string, quantity: number) =>
      fetchWithAuth("/medication-delivery-items", {
        method: "POST",
        body: JSON.stringify({ deliveryId, medicationId, quantity }),
      }),

    updateQuantity: async (id: string, quantity: number) =>
      fetchWithAuth(`/medication-delivery-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),

    delete: async (id: string) =>
      fetchWithAuth(`/medication-delivery-items/${id}`, { method: "DELETE" }),
  },

  // Add these methods to your api.tsx file

  // ---------- MEDICATION ORDERS ----------
  medicationOrders: {
    getAll: async () =>
      fetchWithAuth("/medication-orders"),

    getById: async (id: string) =>
      fetchWithAuth(`/medication-orders/${id}`),

    create: async (data: any) =>
      fetchWithAuth("/medication-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    respond: async (id: string, data: { accept: boolean; comment?: string }) =>
      fetchWithAuth(`/medication-orders/respond/${id}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
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

    getByPatient: async (patientId: string) =>
      fetchWithAuth(`/clinic-history/by-patient/${patientId}`),
  },
}
