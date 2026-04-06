'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Building, Building2, PieChart, FileText, Briefcase, Users } from 'lucide-react';
import Link from 'next/link';

export default function AssetManagerPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { activeEntity } = useEntities();

  // If no active organization, prompt to select one
  if (!activeOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AssetManager</h1>
          <p className="text-muted-foreground mt-2">
            Manage your portfolio, cap table, and investments
          </p>
        </div>
        <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            Please select an organization first to access the AssetManager dashboard.{' '}
            <Link href="/organizations" className="underline font-medium">
              Go to Organizations
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If no active entity, prompt to select one
  if (!activeEntity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AssetManager</h1>
          <p className="text-muted-foreground mt-2">
            Organization: <span className="font-medium">{activeOrganization.name}</span>
          </p>
        </div>
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Please select an entity to view its data on the dashboard.{' '}
            <Link href="/entities" className="underline font-medium">
              Go to Entities
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with context */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{activeOrganization.name}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{activeEntity.name}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entity Type</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {activeEntity.entity_type}
            </div>
            <p className="text-xs text-muted-foreground">
              Entity classification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cap Table Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Cap Table
            </CardTitle>
            <CardDescription>
              View equity structure, funding rounds, and securities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage funding rounds, securities, transactions, and cap table snapshots for {activeEntity.name}.
            </p>
            <Button variant="outline" className="w-full" disabled>
              View Cap Table
              <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Financials Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financials
            </CardTitle>
            <CardDescription>
              Income statements, balance sheets, and cash flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Track financial performance with income statements, balance sheets, and cash flow statements.
            </p>
            <Button variant="outline" className="w-full" disabled>
              View Financials
              <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Portfolio Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Portfolio
            </CardTitle>
            <CardDescription>
              Investments, performance metrics, and cash flows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Monitor portfolio investments, performance metrics, and cash flow distributions.
            </p>
            <Button variant="outline" className="w-full" disabled>
              View Portfolio
              <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Deals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Deals
            </CardTitle>
            <CardDescription>
              Deal commitments and entity deal profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage deal flow, commitments, and entity-specific deal profiles.
            </p>
            <Button variant="outline" className="w-full" disabled>
              View Deals
              <span className="ml-2 text-xs">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and navigation shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => router.push('/organizations')}
            >
              <Building className="mr-2 h-4 w-4" />
              Change Organization
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/entities')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Change Entity
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/entities/${activeEntity.id}/details`)}
            >
              View Entity Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
