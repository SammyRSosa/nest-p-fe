"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/types"
import { Users, Calendar, FileText, Building2, Activity, ClipboardList, X, Pill, Truck } from "lucide-react";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"


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
    { label: "Medicinas", href: "/dashboard/admin/medications", icon: <FileText className="h-5 w-5" /> },
    { label: "Reportes", href: "/dashboard/admin/reports", icon: <FileText className="h-5 w-5"/> },
  ],
  [UserRole.HEAD_OF_DEPARTMENT]: [
    { label: "Pacientes", href: "/dashboard/head", icon: <Activity className="h-5 w-5" /> },
    { label: "Consultas", href: "/dashboard/head/consultations", icon: <Users className="h-5 w-5" /> },
    { label: "Remisiones", href: "/dashboard/head/remissions", icon: <Users className="h-5 w-5" /> },
    { label: "Pedidos de Medicamentos", href: "/dashboard/head/medication-orders", icon: <Pill className="h-5 w-5" /> },
    { label: "Stock del Departamento", href: "/dashboard/head/stock", icon: <Pill className="h-5 w-5" /> },
    { label: "Envíos al Departamento", href: "/dashboard/head/deliveries", icon: <Truck className="h-5 w-5" /> },
    { label: "Órdenes de Stock Principal", href: "/dashboard/head/mainstockorders", icon: <Building2 className="h-5 w-5" /> },
    { label: "Entregas", href: "/dashboard/head/mainstockdeliveries", icon: <Truck className="h-5 w-5" /> },
  ],
  [UserRole.DOCTOR]: [
    { label: "Consultas", href: "/dashboard/doctor", icon: <Calendar className="h-5 w-5" /> },
    { label: "Pacientes", href: "/dashboard/head", icon: <Activity className="h-5 w-5" /> },
    { label: "Remisiones", href: "/dashboard/head/remissions", icon: <Users className="h-5 w-5" /> },
  ],
  [UserRole.NURSE]: [
    { label: "Consultas", href: "/dashboard/nurse", icon: <Activity className="h-5 w-5" /> },
  ],
  [UserRole.STAFF]: [
    { label: "Pacientes", href: "/dashboard/staff", icon: <Activity className="h-5 w-5" /> },
    { label: "Asistencia", href: "/dashboard/staff/attendance", icon: <ClipboardList className="h-5 w-5" /> },
  ],
  [UserRole.PATIENT]: [
    { label: "Mi Historial", href: "/dashboard/patient", icon: <FileText className="h-5 w-5" /> },
  ],
}

export function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isAlmacenHOD, setIsAlmacenHOD] = useState(false)

  useEffect(() => {
    async function loadDept() {
      if (role !== UserRole.HEAD_OF_DEPARTMENT) return

      try {
        const dep = await api.departments.getmydep()
        console.log("Departamento del HOD:", dep)

        // FORZAR a Almacén solo para probar
        if (dep?.name !== "Almacén") {
          setIsAlmacenHOD(true)
        }
        // TEMPORALMENTE para test:
        // setIsAlmacenHOD(dep?.name === "Oncologia") 
      } catch (error) {
        console.error(error)
      }
    }

    loadDept()
  }, [role])



  let navItems = navigationByRole[role] || []

  // Si es HEAD_OF_DEPARTMENT y NO es del departamento Almacén → ocultar varias opciones
  if (role === UserRole.HEAD_OF_DEPARTMENT && isAlmacenHOD) {
    const labelsToShow = ["Pacientes", "Consultas", "Remisiones", "Pedidos de Medicamentos", "Envíos al Departamento", "Stock del Departamento"]
    navItems = navItems.filter(item => labelsToShow.includes(item.label))
  } else if (role === UserRole.HEAD_OF_DEPARTMENT && !isAlmacenHOD) {
    // Si es HEAD_OF_DEPARTMENT y es del departamento Almacén → mostrar solo ciertas opciones
    const labelsToShow = ["Órdenes de Stock Principal", "Entregas", "Stock del Departamento", "Envíos al Departamento"]
    navItems = navItems.filter(item => labelsToShow.includes(item.label))
  }

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
