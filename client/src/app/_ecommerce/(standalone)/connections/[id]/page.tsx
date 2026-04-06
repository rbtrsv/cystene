'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { useAnalytics } from '@/modules/ecommerce/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Switch } from '@/modules/shadcnui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import {
  Loader2,
  PlugZap,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Package,
  ShoppingCart,
  Settings,
  Eye,
  EyeOff,
  Key,
  Copy,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { WidgetAPIKeyDetail } from '@/modules/ecommerce/schemas/widget-api-keys.schemas';
import { getWidgetAPIKeys, createWidgetAPIKey, deleteWidgetAPIKey } from '@/modules/ecommerce/service/widget-api-keys.service';
import { syncConnection } from '@/modules/ecommerce/service/data.service';
import { getPlatformLabel, getConnectionMethodLabel } from '@/modules/ecommerce/utils/format-utils';

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const connectionId = parseInt(params.id as string);

  const {
    connections,
    isLoading,
    error,
    deleteConnection,
    testConnection,
    updateConnection,
    fetchConnections,
  } = useConnections();

  const { connectionStats, fetchConnectionStats } = useAnalytics();

  const connection = connections.find((c) => c.id === connectionId);

  // Settings state — Connection Details
  const [editConnectionName, setEditConnectionName] = useState('');
  const [editStoreUrl, setEditStoreUrl] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editApiSecret, setEditApiSecret] = useState('');
  const [editDbHost, setEditDbHost] = useState('');
  const [editDbName, setEditDbName] = useState('');
  const [editDbUser, setEditDbUser] = useState('');
  const [editDbPassword, setEditDbPassword] = useState('');
  const [editDbPort, setEditDbPort] = useState('');

  // Settings state — Password visibility toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);

  // Settings state — Actions
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Settings state — Auto-Sync
  const [editAutoSyncEnabled, setEditAutoSyncEnabled] = useState(false);
  const [editSyncInterval, setEditSyncInterval] = useState('daily');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<WidgetAPIKeyDetail[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDomains, setNewKeyDomains] = useState('');
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);
  const [createdKeyId, setCreatedKeyId] = useState<number | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedConnectionId, setCopiedConnectionId] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null);

  // Initialize edit form when connection loads
  useEffect(() => {
    if (connection) {
      setEditConnectionName(connection.connection_name);
      setEditStoreUrl(connection.store_url || '');
      // api_key, api_secret, db_password are not exposed by backend — leave empty
      // User can fill them to update, or leave empty to keep current values
      setEditApiKey('');
      setEditApiSecret('');
      setEditDbHost(connection.db_host || '');
      setEditDbName(connection.db_name || '');
      setEditDbUser(connection.db_user || '');
      setEditDbPassword('');
      setEditDbPort(connection.db_port ? String(connection.db_port) : '');
      // Auto-Sync fields
      setEditAutoSyncEnabled(connection.auto_sync_enabled);
      setEditSyncInterval(connection.sync_interval);
    }
  }, [connection]);

  // Fetch connections on mount (store may be empty on direct navigation)
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Fetch stats for this connection (only if active — inactive connections have no stats)
  useEffect(() => {
    if (connectionId && connection?.is_active) {
      fetchConnectionStats(connectionId).catch(() => {
        // Stats fetch failure is non-critical
      });
    }
  }, [connectionId, connection?.is_active, fetchConnectionStats]);

  // Fetch API keys for non-Shopify connections
  useEffect(() => {
    if (connectionId && connection && connection.platform !== 'shopify') {
      setIsLoadingKeys(true);
      getWidgetAPIKeys(connectionId)
        .then((res) => {
          if (res.success && res.data) {
            setApiKeys(res.data);
          }
        })
        .finally(() => setIsLoadingKeys(false));
    }
  }, [connectionId, connection]);

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

  if (!connection) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Connection not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation uses connection name
  const deleteConfirmTarget = connection.connection_name;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <Link href="/connections">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Connections
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <PlugZap className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{connection.connection_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{getPlatformLabel(connection.platform)}</Badge>
              <Badge variant="outline">{getConnectionMethodLabel(connection.connection_method)}</Badge>
              <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                {connection.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* Tab visibility:
            - Data Sync: shown when connection_method !== 'ingest' (ingest receives data via Push API)
            - API Keys: shown when platform !== 'shopify' (Shopify uses App Proxy HMAC) */}
        <TabsList className={`grid w-full ${
          connection.connection_method !== 'ingest' && connection.platform !== 'shopify'
            ? 'grid-cols-4'  // Overview, Data Sync, Settings, API Keys
            : connection.connection_method !== 'ingest' || connection.platform !== 'shopify'
              ? 'grid-cols-3'  // Overview + two of: Data Sync / Settings / API Keys
              : 'grid-cols-2'  // Overview, Settings (Shopify ingest — unlikely but handled)
        }`}>
          <TabsTrigger value="overview">
            <PlugZap className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {/* Data Sync tab — only for non-ingest connections (ingest receives data via Push API) */}
          {connection.connection_method !== 'ingest' && (
            <TabsTrigger value="data-sync">
              <RefreshCw className="h-4 w-4" />
              Data Sync
            </TabsTrigger>
          )}
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          {/* API Keys tab — only for non-Shopify connections (Shopify uses App Proxy HMAC) */}
          {connection.platform !== 'shopify' && (
            <TabsTrigger value="api-keys">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          )}
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Connection Information */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Information</CardTitle>
              <CardDescription>Details about this connection</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="text-lg font-medium">{getPlatformLabel(connection.platform)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connection Method</p>
                <p className="text-lg font-medium">{getConnectionMethodLabel(connection.connection_method)}</p>
              </div>
              {/* API connection fields */}
              {connection.connection_method === 'api' && connection.store_url && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Store URL</p>
                  <p className="text-lg font-medium">{connection.store_url}</p>
                </div>
              )}
              {/* Database connection fields */}
              {connection.connection_method === 'database' && (
                <>
                  {connection.db_host && (
                    <div>
                      <p className="text-sm text-muted-foreground">Database Host</p>
                      <p className="text-lg font-medium">{connection.db_host}</p>
                    </div>
                  )}
                  {connection.db_port && (
                    <div>
                      <p className="text-sm text-muted-foreground">Port</p>
                      <p className="text-lg font-medium">{connection.db_port}</p>
                    </div>
                  )}
                  {connection.db_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Database Name</p>
                      <p className="text-lg font-medium">{connection.db_name}</p>
                    </div>
                  )}
                  {connection.db_user && (
                    <div>
                      <p className="text-sm text-muted-foreground">Database User</p>
                      <p className="text-lg font-medium">{connection.db_user}</p>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">{new Date(connection.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-lg font-medium">
                  {connection.updated_at ? new Date(connection.updated_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Test Connection</CardTitle>
              <CardDescription>Verify connectivity and sample data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </div>
                </Alert>
              )}
              <Button
                onClick={async () => {
                  setIsTesting(true);
                  setTestResult(null);
                  try {
                    const result = await testConnection(connectionId);
                    setTestResult({
                      success: result.success,
                      message: result.success
                        ? `Connection successful! Found ${result.sample_products_count ?? 0} sample products.`
                        : result.message,
                    });
                    // Refresh connections to update is_active status
                    await fetchConnections();
                  } catch {
                    setTestResult({ success: false, message: 'Failed to test connection' });
                  } finally {
                    setIsTesting(false);
                  }
                }}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Data Stats */}
          {connectionStats && connectionStats.connection_id === connectionId && (
            <Card>
              <CardHeader>
                <CardTitle>Data Statistics</CardTitle>
                <CardDescription>Imported data summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{connectionStats.products_count}</p>
                      <p className="text-sm text-muted-foreground">Products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{connectionStats.orders_count}</p>
                      <p className="text-sm text-muted-foreground">Orders</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== DATA SYNC TAB ========== */}
        {/* Only rendered for non-ingest connections — ingest receives data via Push API */}
        {connection.connection_method !== 'ingest' && (
          <TabsContent value="data-sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Sync</CardTitle>
                <CardDescription>Configure automatic data synchronization from your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto-Sync toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync-toggle">Auto-Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically pull latest products and orders from your store
                    </p>
                  </div>
                  <Switch
                    id="auto-sync-toggle"
                    checked={editAutoSyncEnabled}
                    onCheckedChange={setEditAutoSyncEnabled}
                  />
                </div>

                {/* Sync interval — only visible when auto-sync is enabled */}
                {editAutoSyncEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="sync-interval">Sync Interval</Label>
                    <Select value={editSyncInterval} onValueChange={setEditSyncInterval}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Save Auto-Sync settings */}
                <Button
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      await updateConnection(connectionId, {
                        auto_sync_enabled: editAutoSyncEnabled,
                        sync_interval: editSyncInterval as 'hourly' | 'every_6_hours' | 'daily' | 'weekly',
                      });
                      await fetchConnections();
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Sync Settings'
                  )}
                </Button>

                {/* Sync status info — read-only */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Synced</p>
                    <p className="text-sm font-medium">
                      {connection.last_synced_at
                        ? new Date(connection.last_synced_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {connection.last_sync_status ? (
                      <Badge variant={connection.last_sync_status === 'success' ? 'default' : 'destructive'}>
                        {connection.last_sync_status}
                      </Badge>
                    ) : (
                      <p className="text-sm font-medium">—</p>
                    )}
                  </div>
                  {connection.auto_sync_enabled && connection.next_sync_at && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Next Sync</p>
                      <p className="text-sm font-medium">
                        {new Date(connection.next_sync_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Sync Now button — manual trigger */}
                {syncResult && (
                  <Alert variant={syncResult.success ? 'default' : 'destructive'}>
                    <div className="flex items-center gap-2">
                      {syncResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{syncResult.message}</AlertDescription>
                    </div>
                  </Alert>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsSyncing(true);
                    setSyncResult(null);
                    try {
                      const result = await syncConnection(connectionId);
                      setSyncResult({
                        success: result.success,
                        message: result.success
                          ? `Sync complete. ${result.data?.products_count ?? 0} products, ${result.data?.orders_count ?? 0} orders.`
                          : result.error || 'Sync failed',
                      });
                      // Refresh connection to update sync status fields
                      await fetchConnections();
                    } catch {
                      setSyncResult({ success: false, message: 'Failed to sync' });
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing || !connection.is_active}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
                {!connection.is_active && (
                  <p className="text-xs text-muted-foreground">
                    Test the connection first before syncing data.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ========== SETTINGS TAB ========== */}
        <TabsContent value="settings" className="space-y-4">
          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
              <CardDescription>
                {connection.connection_method === 'ingest'
                  ? 'Update connection name'
                  : 'Update connection name and credentials'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-connection-name">Connection Name</Label>
                <Input
                  id="edit-connection-name"
                  value={editConnectionName}
                  onChange={(e) => setEditConnectionName(e.target.value)}
                />
              </div>

              {/* API connection fields — hidden for ingest connections (no credentials) */}
              {connection.connection_method === 'api' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-store-url">Store URL</Label>
                    <Input
                      id="edit-store-url"
                      value={editStoreUrl}
                      onChange={(e) => setEditStoreUrl(e.target.value)}
                      placeholder="https://mystore.com"
                    />
                  </div>
                  {/* WooCommerce needs both api_key (consumer_key) and api_secret (consumer_secret) */}
                  {connection.platform === 'woocommerce' && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-api-key">Consumer Key</Label>
                      <div className="relative">
                        <Input
                          id="edit-api-key"
                          type={showApiKey ? 'text' : 'password'}
                          value={editApiKey}
                          onChange={(e) => setEditApiKey(e.target.value)}
                          placeholder="Leave empty to keep current value"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                          tabIndex={-1}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="edit-api-secret">
                      {connection.platform === 'woocommerce'
                        ? 'Consumer Secret'
                        : connection.platform === 'shopify'
                          ? 'Access Token'
                          : 'Access Token'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="edit-api-secret"
                        type={showApiSecret ? 'text' : 'password'}
                        value={editApiSecret}
                        onChange={(e) => setEditApiSecret(e.target.value)}
                        placeholder="Leave empty to keep current value"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiSecret(!showApiSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        tabIndex={-1}
                      >
                        {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Database connection fields */}
              {connection.connection_method === 'database' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-db-host">Database Host</Label>
                      <Input
                        id="edit-db-host"
                        value={editDbHost}
                        onChange={(e) => setEditDbHost(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-db-port">Port</Label>
                      <Input
                        id="edit-db-port"
                        type="number"
                        value={editDbPort}
                        onChange={(e) => setEditDbPort(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-db-name">Database Name</Label>
                    <Input
                      id="edit-db-name"
                      value={editDbName}
                      onChange={(e) => setEditDbName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-db-user">Database User</Label>
                      <Input
                        id="edit-db-user"
                        value={editDbUser}
                        onChange={(e) => setEditDbUser(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-db-password">Database Password</Label>
                      <div className="relative">
                        <Input
                          id="edit-db-password"
                          type={showDbPassword ? 'text' : 'password'}
                          value={editDbPassword}
                          onChange={(e) => setEditDbPassword(e.target.value)}
                          placeholder="Leave empty to keep current value"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDbPassword(!showDbPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                          tabIndex={-1}
                        >
                          {showDbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                // Build update payload — only include non-empty fields
                const updateData: Record<string, string | number | boolean | null | undefined> = {};
                updateData.connection_name = editConnectionName || undefined;

                // Credential fields — only for non-ingest connections (ingest has no credentials)
                if (connection.connection_method === 'api') {
                  updateData.store_url = editStoreUrl || undefined;
                  // Only send credentials if user typed something (empty = keep current)
                  if (editApiKey) updateData.api_key = editApiKey;
                  if (editApiSecret) updateData.api_secret = editApiSecret;
                } else if (connection.connection_method === 'database') {
                  updateData.db_host = editDbHost || undefined;
                  updateData.db_name = editDbName || undefined;
                  updateData.db_user = editDbUser || undefined;
                  if (editDbPassword) updateData.db_password = editDbPassword;
                  updateData.db_port = editDbPort ? parseInt(editDbPort, 10) : undefined;
                }
                // ingest connections: only connection_name is editable, no credentials or sync settings

                await updateConnection(connectionId, updateData);
                // Refresh list data after update to keep store in sync
                await fetchConnections();
              } finally {
                setIsUpdating(false);
              }
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this connection</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a connection, there is no going back. This will permanently delete the connection, its settings, and all associated data.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Connection name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      const success = await deleteConnection(connectionId);
                      if (success) {
                        await fetchConnections();
                        router.push('/connections');
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmText !== deleteConfirmTarget}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== API KEYS TAB ========== */}
        {connection.platform !== 'shopify' && (
          <TabsContent value="api-keys" className="space-y-4">
            {/* Push API Integration Guide — only for ingest connections */}
            {connection.connection_method === 'ingest' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Push API Integration Guide
                  </CardTitle>
                  <CardDescription>
                    Use these details to push data from your system to Nudgio via the Data Ingestion API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Connection ID — primary key for integration */}
                  <div className="space-y-2">
                    <Label>Connection ID</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                        {connectionId}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(String(connectionId));
                          setCopiedConnectionId(true);
                          setTimeout(() => setCopiedConnectionId(false), 2000);
                        }}
                      >
                        {copiedConnectionId ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Endpoints */}
                  <div className="space-y-2">
                    <Label>Endpoints</Label>
                    <div className="rounded bg-muted px-3 py-2 text-sm font-mono space-y-1">
                      <p>POST /ecommerce/data/import/products</p>
                      <p>POST /ecommerce/data/import/orders</p>
                      <p>POST /ecommerce/data/import/order-items</p>
                    </div>
                  </div>

                  {/* Authentication */}
                  <div className="space-y-2">
                    <Label>Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      All requests require a Bearer token in the <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization</code> header.
                      Each request body must include <code className="text-xs bg-muted px-1 py-0.5 rounded">connection_id: {connectionId}</code>.
                    </p>
                  </div>

                  {/* Example request */}
                  <div className="space-y-2">
                    <Label>Example Request</Label>
                    <pre className="rounded bg-muted px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre">{`POST /ecommerce/data/import/products
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "connection_id": ${connectionId},
  "products": [
    {
      "platform_id": "SKU-001",
      "title": "Product Name",
      "price": 29.99
    }
  ]
}`}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate New Key */}
            <Card>
              <CardHeader>
                <CardTitle>Generate API Key</CardTitle>
                <CardDescription>
                  Create a new key for HMAC-signed widget URLs. The secret is shown once — save it immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Created key secret — shown once */}
                {createdKeySecret && (
                  <Alert>
                    <div className="space-y-2">
                      <AlertDescription className="font-medium">
                        Save this key now — it cannot be shown again.
                      </AlertDescription>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                          {createdKeySecret}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(createdKeySecret);
                            setCopiedSecret(true);
                            setTimeout(() => setCopiedSecret(false), 2000);
                          }}
                        >
                          {copiedSecret ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Key ID: {createdKeyId} — use this as key_id in your widget configuration.
                      </p>
                    </div>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-key-name">Key Name</Label>
                  <Input
                    id="new-key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-key-domains">Allowed Domains (optional)</Label>
                  <Input
                    id="new-key-domains"
                    value={newKeyDomains}
                    onChange={(e) => setNewKeyDomains(e.target.value)}
                    placeholder="e.g., myshop.com, www.myshop.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated domains. Secondary signal only — HMAC signature is primary auth.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    if (!newKeyName.trim()) return;
                    setIsCreatingKey(true);
                    setCreatedKeySecret(null);
                    setCreatedKeyId(null);
                    try {
                      const res = await createWidgetAPIKey(connectionId, {
                        name: newKeyName.trim(),
                        allowed_domains: newKeyDomains.trim() || null,
                      });
                      if (res.success && res.data) {
                        setCreatedKeySecret(res.data.api_key);
                        setCreatedKeyId(res.data.id);
                        setNewKeyName('');
                        setNewKeyDomains('');
                        // Refresh the key list
                        const listRes = await getWidgetAPIKeys(connectionId);
                        if (listRes.success && listRes.data) {
                          setApiKeys(listRes.data);
                        }
                      }
                    } finally {
                      setIsCreatingKey(false);
                    }
                  }}
                  disabled={isCreatingKey || !newKeyName.trim()}
                >
                  {isCreatingKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Key
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Keys */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Keys</CardTitle>
                <CardDescription>
                  Active API keys for this connection. Secrets are not shown — only the prefix is displayed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : apiKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No API keys yet. Generate one above to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{k.name}</p>
                            <Badge variant={k.is_active ? 'default' : 'secondary'} className="text-xs">
                              {k.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <code>{k.api_key_prefix}...</code>
                            <span>ID: {k.id}</span>
                            <span>{new Date(k.created_at).toLocaleDateString()}</span>
                            {k.allowed_domains && <span>Domains: {k.allowed_domains}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setDeletingKeyId(k.id);
                            try {
                              const res = await deleteWidgetAPIKey(connectionId, k.id);
                              if (res.success) {
                                setApiKeys((prev) => prev.filter((key) => key.id !== k.id));
                              }
                            } finally {
                              setDeletingKeyId(null);
                            }
                          }}
                          disabled={deletingKeyId === k.id}
                        >
                          {deletingKeyId === k.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
