'use client';

import { useEffect } from 'react';
import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { useAnalytics } from '@/modules/ecommerce/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, BarChart3, Package, ShoppingCart, Clock, CalendarDays } from 'lucide-react';
import { getPlatformLabel } from '@/modules/ecommerce/utils/format-utils';

export default function AnalyticsPage() {
  const { connections, activeConnectionId, setActiveConnection } = useConnections();
  const {
    connectionStats,
    isLoading,
    error,
    fetchConnectionStats,
  } = useAnalytics();

  // Fetch stats when connection changes (only if active — inactive connections have no stats)
  useEffect(() => {
    const activeConn = connections.find(c => c.id === activeConnectionId);
    if (activeConnectionId && activeConn?.is_active) {
      fetchConnectionStats(activeConnectionId);
    }
  }, [activeConnectionId, connections, fetchConnectionStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          View data statistics for your connections
        </p>
      </div>

      {/* Connection Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-muted-foreground">No connections available. Create a connection first.</p>
          ) : (
            <Select
              value={activeConnectionId ? String(activeConnectionId) : ''}
              onValueChange={(value) => setActiveConnection(parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={String(conn.id)}>
                    {conn.connection_name} ({getPlatformLabel(conn.platform)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Stats Cards */}
      {connectionStats && activeConnectionId && !isLoading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Products Count */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectionStats.products_count.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total products imported</p>
              </CardContent>
            </Card>

            {/* Orders Count */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{connectionStats.orders_count.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total orders imported</p>
              </CardContent>
            </Card>

            {/* Last Sync */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connectionStats.last_sync
                    ? new Date(connectionStats.last_sync).toLocaleDateString()
                    : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {connectionStats.last_sync
                    ? new Date(connectionStats.last_sync).toLocaleTimeString()
                    : 'No data has been synced yet'}
                </p>
              </CardContent>
            </Card>

            {/* Data Freshness */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connectionStats.data_freshness_days != null
                    ? `${connectionStats.data_freshness_days} days`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Days since last data sync</p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Info */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
              <CardDescription>Information about the selected connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Connection: </span>
                <span className="font-medium">{connectionStats.connection_name}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Platform: </span>
                <span className="font-medium capitalize">{connectionStats.platform}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
