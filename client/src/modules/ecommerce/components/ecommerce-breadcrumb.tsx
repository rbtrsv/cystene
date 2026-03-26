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

export function EcommerceBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname
    .split('/')
    .filter(segment => segment)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">Nudgio</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => (
          <React.Fragment key={segment}>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              {index === segments.length - 1 ? (
                <BreadcrumbPage>{formatBreadcrumb(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${segments.slice(0, index + 1).join('/')}`}>
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
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
