"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/types"
import { Users, Calendar, FileText, Building2, Activity, ClipboardList, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  role: UserRole
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navigationByRole: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: [
    { label: "Trabajadores", href: "/dashboard/admin", icon: <Users className="h-5 w-5" /> },
    { label: "Departamentos", href: "/dashboard/admin/departments", icon: <Building2 className="h-5 w-5" /> },
    { label: "Pacientes", href: "/dashboard/admin/patients", icon: <Activity className="h-5 w-5" /> },
    { label: "Usuarios", href: "/dashboard/admin/users", icon: <Users className="h-5 w-5" /> },
  ],
  [UserRole.HEAD_OF_DEPARTMENT]: [
    { label: "Pacientes", href: "/dashboard/head", icon: <Activity className="h-5 w-5" /> },
    { label: "Consultas", href: "/dashboard/head/consultations", icon: <Users className="h-5 w-5" /> },
    { label: "Remisiones", href: "/dashboard/head/remissions", icon: <Users className="h-5 w-5" /> },
  ],
  [UserRole.DOCTOR]: [
    { label: "Consultas", href: "/dashboard/doctor", icon: <Calendar className="h-5 w-5" /> },
    { label: "Pacientes", href: "/dashboard/doctor/patients", icon: <Activity className="h-5 w-5" /> },
  ],
  [UserRole.NURSE]: [
    { label: "Pacientes", href: "/dashboard/nurse", icon: <Activity className="h-5 w-5" /> },
    { label: "Tareas", href: "/dashboard/nurse/tasks", icon: <ClipboardList className="h-5 w-5" /> },
  ],
  [UserRole.STAFF]: [
    { label: "Pacientes", href: "/dashboard/staff", icon: <Activity className="h-5 w-5" /> },
    { label: "Asistencia", href: "/dashboard/staff/attendance", icon: <ClipboardList className="h-5 w-5" /> },
  ],
  [UserRole.PATIENT]: [
    { label: "Mi Historial", href: "/dashboard/patient", icon: <FileText className="h-5 w-5" /> },
    { label: "Consultas", href: "/dashboard/patient/appointments", icon: <Calendar className="h-5 w-5" /> },
  ],
}

export function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const navItems = navigationByRole[role] || []

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-sidebar-border">
            <h2 className="font-semibold">Menú</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={onClose}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
