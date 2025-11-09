"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { AuthResponse, User, UserRole } from "@/types"
import { jwtDecode } from "jwt-decode"
import Cookies from "js-cookie";

interface UserPayload {
  username: string
  role: UserRole
  sub: string
  iat?: number
  exp?: number
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const restoreUser = () => {
      try {
        const storedUser = localStorage.getItem("user")
        const token = localStorage.getItem("token")

        if (storedUser) {
          setUser(JSON.parse(storedUser))
        } else if (token) {
          const decoded = jwtDecode<UserPayload>(token)
          const userObj: User = {
            id: decoded.sub,
            account: decoded.username,
            name: decoded.username,
            role: decoded.role,
          }
          setUser(userObj)
          localStorage.setItem("user", JSON.stringify(userObj))
        }
      } catch (err) {
        console.error("Invalid user in localStorage", err)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      } finally {
        setIsLoading(false)
      }
    }

    // ✅ Delay ensures this runs *after* React hydration
    setTimeout(restoreUser, 0)
  }, [])

  const login = useCallback(async (account: string, password: string) => {
    try {
      const data: AuthResponse = await api.auth.login({ account, password })
      localStorage.setItem("token", data.access_token)
      Cookies.set("token", data.access_token, { expires: 7 });

      const decoded = jwtDecode<UserPayload>(data.access_token)
      const userObj: User = {
        id: decoded.sub,
        account,
        name: decoded.username,
        role: decoded.role,
      }

      localStorage.setItem("user", JSON.stringify(userObj))
      setUser(userObj)


      router.push("/") // redirect directly to dashboard
    } catch (err: any) {
      console.error("Login error:", err)
      throw new Error(err.message || "Error al iniciar sesión")
    }
  }, [router])

  const register = useCallback(async (data: { account: string; password: string;}) => {
    try {
    const res = await api.auth.register(data)
    router.push("/login")
    }catch (err: any) {
      console.log("Registration error:", err)
      throw new Error(err.message || "Error al registrar usuario")
    }
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    Cookies.remove("token")
    setUser(null)
    setIsLoading(false)
    router.push("/login")
  }, [router])

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
  }
}
