"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { UserRole } from "@/types"
import { Loader2 } from "lucide-react"

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, isLoading } = useAuth()


  useEffect(() => {
    if (isLoading) return // Wait for user to load

    if (!user) {
      router.push("/login")
      return
    }
    if (!isLoading && user) {

      const roleRoutes: Record<UserRole, string> = {
        [UserRole.ADMIN]: "/dashboard/admin",
        [UserRole.HEAD_OF_DEPARTMENT]: "/dashboard/head",
        [UserRole.DOCTOR]: "/dashboard/doctor",
        [UserRole.NURSE]: "/dashboard/nurse",
        [UserRole.STAFF]: "/dashboard/staff",
        [UserRole.PATIENT]: "/dashboard/patient",
      }

      router.push(roleRoutes[user.role])
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
