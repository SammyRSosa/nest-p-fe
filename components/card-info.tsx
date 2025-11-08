"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

interface CardInfoProps {
  title: string
  description?: string
  children?: ReactNode
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  actions?: {
    label: string
    onClick: () => void
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost"
  }[]
}

export function CardInfo({ title, description, children, badge, actions }: CardInfoProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {badge && (
            <Badge variant={badge.variant || "default"} className="ml-2">
              {badge.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      {(children || actions) && (
        <CardContent>
          {children}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 mt-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  className={action.variant === "default" ? "bg-accent hover:bg-accent/90" : ""}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
