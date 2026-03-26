'use client';

import { useState, useEffect } from 'react';
import { useConnections } from '@/modules/ecommerce/hooks/use-ecommerce-connections';
import { useRecommendations } from '@/modules/ecommerce/hooks/use-recommendations';
import { getProducts, type DataProduct } from '@/modules/ecommerce/service/data.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { getPlatformLabel } from '@/modules/ecommerce/utils/format-utils';

export default function RecommendationsPage() {
  const { connections, activeConnectionId, setActiveConnection } = useConnections();
  const {
    result,
    isLoading,
    error,
    fetchBestsellers,
    fetchCrossSell,
    fetchUpsell,
    fetchSimilar,
    clearResult,
  } = useRecommendations();

  // Input state
  const [productId, setProductId] = useState('');
  const [limit, setLimit] = useState(10);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [method, setMethod] = useState<'volume' | 'value' | 'balanced'>('volume');
  const [minPriceIncrease, setMinPriceIncrease] = useState(10);

  // Active tab state (for conditional product fetching)
  const [activeTab, setActiveTab] = useState('bestsellers');

  // Product dropdown state (for cross-sell, upsell, similar tabs)
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFetched, setProductsFetched] = useState(false);

  const needsProductId = activeTab !== 'bestsellers';

  // Fetch products when a non-bestseller tab is selected and connection is active
  useEffect(() => {
    if (!needsProductId || !activeConnectionId || productsFetched) return;

    const fetchProductList = async () => {
      setProductsLoading(true);
      const response = await getProducts(activeConnectionId);
      setProducts(response.products);
      setProductsFetched(true);
      setProductsLoading(false);
    };

    fetchProductList();
  }, [needsProductId, activeConnectionId, productsFetched]);

  // Reset fetched state when connection changes (need to re-fetch for new connection)
  useEffect(() => {
    setProductsFetched(false);
    setProducts([]);
    setProductId('');
  }, [activeConnectionId]);

  const handleFetch = async (type: string) => {
    if (!activeConnectionId) return;

    switch (type) {
      case 'bestsellers':
        await fetchBestsellers({
          connection_id: activeConnectionId,
          limit,
          lookback_days: lookbackDays,
          method,
        });
        break;
      case 'cross-sell':
        if (!productId) return;
        await fetchCrossSell({
          connection_id: activeConnectionId,
          product_id: productId,
          limit,
          lookback_days: lookbackDays,
        });
        break;
      case 'upsell':
        if (!productId) return;
        await fetchUpsell({
          connection_id: activeConnectionId,
          product_id: productId,
          limit,
          lookback_days: lookbackDays,
          min_price_increase_percent: minPriceIncrease,
        });
        break;
      case 'similar':
        if (!productId) return;
        await fetchSimilar({
          connection_id: activeConnectionId,
          product_id: productId,
          limit,
          lookback_days: lookbackDays,
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-muted-foreground">
          Generate and preview product recommendations
        </p>
      </div>

      {/* Connection Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Select Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-muted-foreground">No connections available. Create a connection first.</p>
          ) : (
            <Select
              value={activeConnectionId ? String(activeConnectionId) : ''}
              onValueChange={(value) => {
                setActiveConnection(parseInt(value));
                clearResult();
                setProductId('');
                setProductsFetched(false);
                setProducts([]);
              }}
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

      {/* Recommendation Type Tabs */}
      {activeConnectionId && (
        <Tabs defaultValue="bestsellers" onValueChange={(tab) => { setActiveTab(tab); clearResult(); }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bestsellers">Bestsellers</TabsTrigger>
            <TabsTrigger value="cross-sell">Cross-Sell</TabsTrigger>
            <TabsTrigger value="upsell">Upsell</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
          </TabsList>

          {/* Bestsellers Tab */}
          <TabsContent value="bestsellers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bestseller Parameters</CardTitle>
                <CardDescription>Configure bestseller recommendation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={method} onValueChange={(v) => setMethod(v as 'volume' | 'value' | 'balanced')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(parseInt(e.target.value) || 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input type="number" min={1} max={365} value={lookbackDays} onChange={(e) => setLookbackDays(parseInt(e.target.value) || 30)} />
                  </div>
                </div>
                <Button onClick={() => handleFetch('bestsellers')} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> : 'Fetch Bestsellers'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cross-Sell Tab */}
          <TabsContent value="cross-sell" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cross-Sell Parameters</CardTitle>
                <CardDescription>Find products frequently bought together</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={productId} onValueChange={(v) => setProductId(v)} disabled={productsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Select a product'} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.product_id} value={p.product_id}>
                            {p.title} (#{p.product_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(parseInt(e.target.value) || 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input type="number" min={1} max={365} value={lookbackDays} onChange={(e) => setLookbackDays(parseInt(e.target.value) || 30)} />
                  </div>
                </div>
                <Button onClick={() => handleFetch('cross-sell')} disabled={isLoading || !productId}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> : 'Fetch Cross-Sell'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upsell Tab */}
          <TabsContent value="upsell" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upsell Parameters</CardTitle>
                <CardDescription>Find higher-priced alternatives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={productId} onValueChange={(v) => setProductId(v)} disabled={productsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Select a product'} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.product_id} value={p.product_id}>
                            {p.title} (#{p.product_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(parseInt(e.target.value) || 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input type="number" min={1} max={365} value={lookbackDays} onChange={(e) => setLookbackDays(parseInt(e.target.value) || 30)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Price Increase (%)</Label>
                    <Input type="number" min={0} max={1000} value={minPriceIncrease} onChange={(e) => setMinPriceIncrease(parseInt(e.target.value) || 10)} />
                  </div>
                </div>
                <Button onClick={() => handleFetch('upsell')} disabled={isLoading || !productId}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> : 'Fetch Upsell'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar Tab */}
          <TabsContent value="similar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Similar Products Parameters</CardTitle>
                <CardDescription>Find products similar to a given product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={productId} onValueChange={(v) => setProductId(v)} disabled={productsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={productsLoading ? 'Loading products...' : 'Select a product'} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.product_id} value={p.product_id}>
                            {p.title} (#{p.product_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(parseInt(e.target.value) || 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lookback Days</Label>
                    <Input type="number" min={1} max={365} value={lookbackDays} onChange={(e) => setLookbackDays(parseInt(e.target.value) || 30)} />
                  </div>
                </div>
                <Button onClick={() => handleFetch('similar')} disabled={isLoading || !productId}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> : 'Fetch Similar'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Results Table */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {result.count} recommendations found
              {result.method && <> &middot; Method: <Badge variant="secondary">{result.method}</Badge></>}
              {result.base_product_id && <> &middot; Base Product: {result.base_product_id}</>}
              {' '}&middot; Lookback: {result.lookback_days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.recommendations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recommendations found for these parameters.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.recommendations.map((rec) => (
                      <TableRow key={`${rec.product_id}-${rec.position}`}>
                        <TableCell>{rec.position}</TableCell>
                        <TableCell className="font-mono text-sm">{rec.product_id}</TableCell>
                        <TableCell className="font-medium">{rec.title}</TableCell>
                        <TableCell>${rec.price.toFixed(2)}</TableCell>
                        <TableCell>{rec.vendor || '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{rec.sku || '—'}</TableCell>
                        <TableCell>
                          {rec.similarity_score != null && `${(rec.similarity_score * 100).toFixed(1)}%`}
                          {rec.co_occurrence_count != null && `${rec.co_occurrence_count} co-occ`}
                          {rec.price_increase_percent != null && `+${rec.price_increase_percent.toFixed(1)}%`}
                          {rec.similarity_score == null && rec.co_occurrence_count == null && rec.price_increase_percent == null && '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
