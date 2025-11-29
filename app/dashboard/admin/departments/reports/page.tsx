"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsumptionReportView } from "@/components/admin/ConsumptionReportView"
import { BarChart3, TrendingUp, Package, Building2 } from "lucide-react"

export default function DepartmentReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Consumo</h1>
          <p className="text-muted-foreground">
            Analiza el consumo de medicamentos por departamento y genera informes detallados
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Medicamentos consumidos este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Con consumo reportado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicamentos Críticos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">--</div>
            <p className="text-xs text-muted-foreground">
              Necesitan reposición urgente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">
              Uso optimo de inventario
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generador de Reportes de Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Utiliza el siguiente generador para crear reportes detallados del consumo de medicamentos.
            Puedes filtrar por período específico y por medicamento individual.
          </p>
          
          <ConsumptionReportView />
        </CardContent>
      </Card>

      {/* Additional Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Características del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Consumo acumulado por departamento</li>
              <li>• Comparación con niveles mínimos y máximos</li>
              <li>• Identificación de medicamentos críticos</li>
              <li>• Tendencias de consumo mensual</li>
              <li>• Análisis de eficiencia de inventario</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cómo Utilizar los Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Selecciona el mes y año del reporte</li>
              <li>Opcional: Filtra por medicamento específico</li>
              <li>Genera el reporte para ver los datos</li>
              <li>Analiza las pestañas de Resumen y Detalles</li>
              <li>Exporta los resultados para tomar decisiones</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}