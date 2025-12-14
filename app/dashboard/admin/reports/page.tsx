import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { UserRole } from "@/types"
import ReportsGenerator from "@/components/reports-generator"

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Reportes</h1>
            <p className="text-muted-foreground mt-1">
              Genera reportes en PDF del policlínico
            </p>
          </div>
          <ReportsGenerator />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}