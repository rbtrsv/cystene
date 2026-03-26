'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { PlugZap, Plus, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getPlatformLabel, getConnectionMethodLabel } from '@/modules/ecommerce/utils/format-utils';

function ConnectionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    connections,
    isLoading,
    error,
    activeConnection,
    setActiveConnection,
    fetchConnections,
  } = useConnections();

  // OAuth / auto-auth success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Detect OAuth/auth redirect params and show success alert
  useEffect(() => {
    const shopifyConnected = searchParams.get('shopify_connected');
    const wcConnected = searchParams.get('wc_connected');

    if (shopifyConnected === 'true') {
      setSuccessMessage('Shopify store connected successfully!');
      // Refresh connections list to include the new connection
      fetchConnections();
      // Clean up the URL
      router.replace('/connections');
    } else if (wcConnected === 'true') {
      setSuccessMessage('WooCommerce store connected successfully!');
      fetchConnections();
      router.replace('/connections');
    }
  }, [searchParams, fetchConnections, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">
            Manage your ecommerce platform connections
          </p>
        </div>
        <Link href="/connections/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Connection
          </Button>
        </Link>
      </div>

      {/* OAuth / auto-auth success alert */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div>
        {connections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PlugZap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first connection to start generating recommendations
              </p>
              <Link href="/connections/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Connection
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => (
              <Card
                key={conn.id}
                className={`relative cursor-pointer transition-colors hover:border-primary ${
                  activeConnection?.id === conn.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setActiveConnection(conn.id);
                }}
              >
                {activeConnection?.id === conn.id && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlugZap className="h-5 w-5" />
                    {conn.connection_name}
                  </CardTitle>
                  <CardDescription className="flex gap-2">
                    <Badge variant="secondary">
                      {getPlatformLabel(conn.platform)}
                    </Badge>
                    <Badge variant="outline">
                      {getConnectionMethodLabel(conn.connection_method)}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      {/* Show store_url for API, db_host for database, Push API note for ingest */}
                      {conn.connection_method === 'api' ? (
                        <>
                          <span className="text-muted-foreground">Store: </span>
                          {conn.store_url || '—'}
                        </>
                      ) : conn.connection_method === 'database' ? (
                        <>
                          <span className="text-muted-foreground">Host: </span>
                          {conn.db_host || '—'}
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Data: </span>
                          Push API
                        </>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Status: </span>
                      <Badge variant={conn.is_active ? 'default' : 'secondary'}>
                        {conn.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Created: </span>
                      {new Date(conn.created_at).toLocaleDateString()}
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveConnection(conn.id);
                          router.push(`/connections/${conn.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Suspense boundary required by Next.js for useSearchParams()
export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ConnectionsPageContent />
    </Suspense>
  );
}
