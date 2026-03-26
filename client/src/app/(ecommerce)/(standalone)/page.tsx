'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Building, PlugZap, ArrowRight } from 'lucide-react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
// Dashboard widgets read provider-backed stores.
// Navigation links route users into typed entity pages.
export default function EcommercePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Nudgio</h1>
        <p className="text-muted-foreground">
          Ecommerce recommendation engine for Shopify, WooCommerce, and Magento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              Manage your organizations, members, and subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/organizations">
              <Button className="w-full">
                View Organizations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlugZap className="h-5 w-5" />
              Connections
            </CardTitle>
            <CardDescription>
              Connect your Shopify, WooCommerce, or Magento store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/connections">
              <Button className="w-full">
                View Connections
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
