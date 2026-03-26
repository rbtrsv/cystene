'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { type PlatformType } from '@/modules/ecommerce/schemas/ecommerce-connections.schemas';
import { initiateShopifyOAuth, initiateWooCommerceAuth } from '@/modules/ecommerce/service/ecommerce-connections.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

// Default connection method tab per platform
const DEFAULT_TAB: Record<PlatformType, string> = {
  shopify: 'oauth',
  woocommerce: 'auto-auth',
  magento: 'api',
  custom_integration: 'ingest',
};

export default function CreateConnectionPage() {
  const router = useRouter();
  const { createConnection, error: storeError, clearError } = useConnections();

  // Platform & connection method tab
  const [platform, setPlatform] = useState<PlatformType>('shopify');
  const [activeTab, setActiveTab] = useState('oauth');

  // OAuth / Auto-Auth state
  const [oauthStore, setOauthStore] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Manual / Database form state
  const [connectionName, setConnectionName] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [dbHost, setDbHost] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbPort, setDbPort] = useState(3306);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when platform changes
  const handlePlatformChange = (newPlatform: PlatformType) => {
    setPlatform(newPlatform);
    setActiveTab(DEFAULT_TAB[newPlatform]);
    setOauthStore('');
    setOauthError(null);
    setConnectionName('');
    setStoreUrl('');
    setApiKey('');
    setApiSecret('');
    setDbHost('');
    setDbName('');
    setDbUser('');
    setDbPassword('');
    setDbPort(3306);
    setValidationError(null);
    clearError();
  };

  // Clear errors when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setValidationError(null);
    setOauthError(null);
  };

  // Handle Shopify OAuth redirect
  const handleShopifyOAuth = async () => {
    if (!oauthStore.trim()) {
      setOauthError('Store domain is required');
      return;
    }
    setOauthError(null);
    setIsRedirecting(true);
    try {
      const result = await initiateShopifyOAuth(oauthStore.trim());
      if (result.success && result.auth_url) {
        // Redirect merchant to Shopify consent screen
        window.location.href = result.auth_url;
      } else {
        setOauthError(result.error || 'Failed to initiate Shopify OAuth');
        setIsRedirecting(false);
      }
    } catch {
      setOauthError('An unexpected error occurred');
      setIsRedirecting(false);
    }
  };

  // Handle WooCommerce auto-auth redirect
  const handleWooCommerceAuth = async () => {
    if (!oauthStore.trim()) {
      setOauthError('Store URL is required');
      return;
    }
    setOauthError(null);
    setIsRedirecting(true);
    try {
      const result = await initiateWooCommerceAuth(oauthStore.trim());
      if (result.success && result.auth_url) {
        // Redirect merchant to WooCommerce permission screen
        window.location.href = result.auth_url;
      } else {
        setOauthError(result.error || 'Failed to initiate WooCommerce auth');
        setIsRedirecting(false);
      }
    } catch {
      setOauthError('An unexpected error occurred');
      setIsRedirecting(false);
    }
  };

  // Handle Custom Integration form submission (ingest method — no credentials)
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate connection name
    if (connectionName.trim().length < 3) {
      setValidationError('Connection name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createConnection({
        connection_name: connectionName.trim(),
        platform: 'custom_integration',
        connection_method: 'ingest',
        // No credentials for ingest connections
        store_url: null,
        api_key: null,
        api_secret: null,
        db_host: null,
        db_name: null,
        db_user: null,
        db_password: null,
        db_port: null,
      });

      if (success) {
        router.push('/connections');
      }
      // Error is handled by store and displayed via storeError
    } catch {
      // Swallow — store handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual form submission (API or Database connection methods)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate connection name
    if (connectionName.trim().length < 3) {
      setValidationError('Connection name must be at least 3 characters');
      return;
    }

    const isDatabase = activeTab === 'database';

    // Validate fields based on connection method
    if (isDatabase) {
      if (!dbHost.trim()) {
        setValidationError('Database host is required');
        return;
      }
      if (!dbPassword) {
        setValidationError('Database password is required');
        return;
      }
    } else {
      if (!storeUrl.trim()) {
        setValidationError('Store URL is required');
        return;
      }
      // WooCommerce API requires both consumer_key and consumer_secret
      if (platform === 'woocommerce' && !apiKey) {
        setValidationError('Consumer key is required');
        return;
      }
      if (!apiSecret) {
        setValidationError(
          platform === 'woocommerce' ? 'Consumer secret is required' : 'Access token is required'
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const success = await createConnection({
        connection_name: connectionName.trim(),
        platform,
        connection_method: isDatabase ? 'database' : 'api',
        // API fields (null when database)
        store_url: isDatabase ? null : storeUrl.trim() || null,
        api_key: isDatabase ? null : apiKey || null,
        api_secret: isDatabase ? null : apiSecret || null,
        // Database fields (null when API)
        db_host: isDatabase ? dbHost.trim() : null,
        db_name: isDatabase ? dbName || null : null,
        db_user: isDatabase ? dbUser || null : null,
        db_password: isDatabase ? dbPassword || null : null,
        db_port: isDatabase ? dbPort : null,
      });

      if (success) {
        router.push('/connections');
      }
      // Error is handled by store and displayed via storeError
    } catch {
      // Swallow — store handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combined error display
  const displayError = oauthError || validationError || storeError;

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/connections">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Connections
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Connection</h1>
        <p className="text-muted-foreground mt-2">
          Connect your ecommerce platform to start generating recommendations
        </p>
      </div>

      {displayError && (
        <Alert variant="destructive">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* Platform Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Platform</CardTitle>
          <CardDescription>Select your ecommerce platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={platform}
            onValueChange={(value) => handlePlatformChange(value as PlatformType)}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="woocommerce">WooCommerce</SelectItem>
              <SelectItem value="magento">Magento</SelectItem>
              <SelectItem value="custom_integration">Custom Integration</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ==========================================
          Shopify — OAuth (Recommended) | Manual API
          ========================================== */}
      {platform === 'shopify' && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="oauth">OAuth (Recommended)</TabsTrigger>
            <TabsTrigger value="api">Manual API</TabsTrigger>
          </TabsList>

          {/* Shopify OAuth */}
          <TabsContent value="oauth">
            <Card>
              <CardHeader>
                <CardTitle>Connect with Shopify</CardTitle>
                <CardDescription>
                  Authorize Nudgio via Shopify OAuth. You will be redirected to Shopify to approve access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopify-oauth-store">Store Domain</Label>
                  <Input
                    id="shopify-oauth-store"
                    value={oauthStore}
                    onChange={(e) => setOauthStore(e.target.value)}
                    placeholder="mystore.myshopify.com"
                    disabled={isRedirecting}
                  />
                </div>
                <Button onClick={handleShopifyOAuth} disabled={isRedirecting}>
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Shopify...
                    </>
                  ) : (
                    'Connect with Shopify'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shopify Manual API */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>Manual API Setup</CardTitle>
                <CardDescription>
                  Enter your Shopify store domain and access token manually.
                  Get your access token from Shopify Admin &rarr; Apps &rarr; Develop apps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopify-api-name">Connection Name</Label>
                    <Input
                      id="shopify-api-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="e.g., My Shopify Store"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopify-api-store-url">Store Domain</Label>
                    <Input
                      id="shopify-api-store-url"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="mystore.myshopify.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopify-api-secret">Access Token</Label>
                    <Input
                      id="shopify-api-secret"
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="shpat_xxxxxxxx"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Connection'
                      )}
                    </Button>
                    <Link href="/connections" className="flex-1">
                      <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ==========================================
          WooCommerce — Auto-Auth | REST API | Database
          ========================================== */}
      {platform === 'woocommerce' && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto-auth">Auto-Auth</TabsTrigger>
            <TabsTrigger value="api">REST API</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {/* WooCommerce Auto-Auth */}
          <TabsContent value="auto-auth">
            <Card>
              <CardHeader>
                <CardTitle>Connect WooCommerce</CardTitle>
                <CardDescription>
                  Authorize Nudgio directly from your WooCommerce store.
                  You will be redirected to your store to approve access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wc-auth-store-url">Store URL</Label>
                  <Input
                    id="wc-auth-store-url"
                    value={oauthStore}
                    onChange={(e) => setOauthStore(e.target.value)}
                    placeholder="https://mystore.com"
                    disabled={isRedirecting}
                  />
                </div>
                <Button onClick={handleWooCommerceAuth} disabled={isRedirecting}>
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to WooCommerce...
                    </>
                  ) : (
                    'Connect WooCommerce'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WooCommerce Manual REST API */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>Manual REST API Setup</CardTitle>
                <CardDescription>
                  Enter your WooCommerce REST API credentials.
                  Get them from WooCommerce &rarr; Settings &rarr; Advanced &rarr; REST API &rarr; Add Key.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wc-api-name">Connection Name</Label>
                    <Input
                      id="wc-api-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="e.g., My WooCommerce Store"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-api-store-url">Store URL</Label>
                    <Input
                      id="wc-api-store-url"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="https://mystore.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-api-key">Consumer Key</Label>
                    <Input
                      id="wc-api-key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="ck_xxxxxxxx"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-api-secret">Consumer Secret</Label>
                    <Input
                      id="wc-api-secret"
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="cs_xxxxxxxx"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Connection'
                      )}
                    </Button>
                    <Link href="/connections" className="flex-1">
                      <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WooCommerce Database */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Connection</CardTitle>
                <CardDescription>
                  Connect directly to your WooCommerce MySQL database. Advanced option for power users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wc-db-conn-name">Connection Name</Label>
                    <Input
                      id="wc-db-conn-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="e.g., My WooCommerce Store (DB)"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-db-host">Database Host</Label>
                    <Input
                      id="wc-db-host"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      placeholder="localhost or IP address"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-db-name">Database Name</Label>
                    <Input
                      id="wc-db-name"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="e.g., woocommerce_db"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-db-user">Database User</Label>
                    <Input
                      id="wc-db-user"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder="e.g., db_user"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-db-password">Database Password</Label>
                    <Input
                      id="wc-db-password"
                      type="password"
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      placeholder="Database password"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wc-db-port">Port</Label>
                    <Input
                      id="wc-db-port"
                      type="number"
                      value={dbPort}
                      onChange={(e) => setDbPort(parseInt(e.target.value) || 3306)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Connection'
                      )}
                    </Button>
                    <Link href="/connections" className="flex-1">
                      <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ==========================================
          Magento — REST API (Recommended) | Database
          ========================================== */}
      {platform === 'magento' && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api">REST API (Recommended)</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {/* Magento REST API */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>REST API Setup</CardTitle>
                <CardDescription>
                  Enter your Magento store URL and integration access token.
                  Get it from Magento Admin &rarr; System &rarr; Integrations &rarr; Add New &rarr; Activate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mg-api-name">Connection Name</Label>
                    <Input
                      id="mg-api-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="e.g., My Magento Store"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-api-store-url">Store URL</Label>
                    <Input
                      id="mg-api-store-url"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="https://mymagento.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-api-secret">Access Token</Label>
                    <Input
                      id="mg-api-secret"
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Integration access token"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Connection'
                      )}
                    </Button>
                    <Link href="/connections" className="flex-1">
                      <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Magento Database */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Connection</CardTitle>
                <CardDescription>
                  Connect directly to your Magento MySQL database. Advanced option for power users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mg-db-conn-name">Connection Name</Label>
                    <Input
                      id="mg-db-conn-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="e.g., My Magento Store (DB)"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-db-host">Database Host</Label>
                    <Input
                      id="mg-db-host"
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      placeholder="localhost or IP address"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-db-name">Database Name</Label>
                    <Input
                      id="mg-db-name"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="e.g., magento_db"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-db-user">Database User</Label>
                    <Input
                      id="mg-db-user"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      placeholder="e.g., db_user"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-db-password">Database Password</Label>
                    <Input
                      id="mg-db-password"
                      type="password"
                      value={dbPassword}
                      onChange={(e) => setDbPassword(e.target.value)}
                      placeholder="Database password"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mg-db-port">Port</Label>
                    <Input
                      id="mg-db-port"
                      type="number"
                      value={dbPort}
                      onChange={(e) => setDbPort(parseInt(e.target.value) || 3306)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Connection'
                      )}
                    </Button>
                    <Link href="/connections" className="flex-1">
                      <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* ==========================================
          Custom Integration — Ingest (Push API)
          ========================================== */}
      {platform === 'custom_integration' && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Integration</CardTitle>
            <CardDescription>
              Push data to Nudgio via the Data Ingestion API. No platform credentials needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Info banner explaining the Push API flow */}
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Custom integrations receive data via the Push API (ingest method).
                After creating this connection, use the Data Ingestion API endpoints
                to push products, orders, and customers directly from your system.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-conn-name">Connection Name</Label>
                <Input
                  id="custom-conn-name"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="e.g., My Custom Store"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Connection'
                  )}
                </Button>
                <Link href="/connections" className="flex-1">
                  <Button type="button" variant="outline" disabled={isSubmitting} className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
