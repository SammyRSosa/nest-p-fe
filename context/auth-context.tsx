"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, UserRole } from "@/types"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (account: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (account: string, password: string) => {
    try {
      const response = await api.auth.login({ account, password })

      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)

      const roleRoutes: Record<UserRole, string> = {
        [UserRole.ADMIN]: "/dashboard/admin",
        [UserRole.HEAD_OF_DEPARTMENT]: "/dashboard/head",
        [UserRole.DOCTOR]: "/dashboard/doctor",
        [UserRole.NURSE]: "/dashboard/nurse",
        [UserRole.STAFF]: "/dashboard/staff",
        [UserRole.PATIENT]: "/dashboard/patient",
      }

      router.push(roleRoutes[response.user.role])
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    api.auth.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
