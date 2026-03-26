"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/modules/shadcnui/components/ui/breadcrumb"

function formatBreadcrumb(text: string): string {
  return text
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname
    .split('/')
    .filter(segment => segment && segment !== 'dashboard')

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => (
          <React.Fragment key={`${index}-${segment}`}>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              {index === segments.length - 1 ? (
                <BreadcrumbPage>{formatBreadcrumb(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/dashboard/${segments.slice(0, index + 1).join('/')}`}>
                  {formatBreadcrumb(segment)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
        {segments.length === 0 && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 