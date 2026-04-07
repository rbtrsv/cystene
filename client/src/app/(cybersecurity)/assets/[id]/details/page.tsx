'use client';

/**
 * Asset Details Page
 *
 * Read-only detail view for a discovered asset.
 * No edit, no delete — assets are scanner-generated.
 *
 * Backend: GET /cybersecurity/assets/{id}
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssets } from '@/modules/cybersecurity/hooks/discovery/use-assets';
import {
  getAssetTypeLabel,
  getAssetConfidenceLabel,
  type Asset,
} from '@/modules/cybersecurity/schemas/discovery/assets.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, Box } from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const {
    fetchAsset,
    isLoading,
    error: storeError,
  } = useAssets();

  // Local state for the fetched item
  const [item, setItem] = useState<Asset | null>(null);

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchAsset(id);
      if (data) {
        setItem(data);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Helper to format JSON string for display
   * Parses and re-stringifies with indentation
   */
  const formatJson = (jsonString: string): string => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading && !item) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Asset not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/assets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Box className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.value}</h1>
            <p className="text-muted-foreground">
              {getAssetTypeLabel(item.asset_type)} &middot; {getAssetConfidenceLabel(item.confidence)}
            </p>
          </div>
        </div>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      {/* Card 1: Asset Info */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Asset Type</p><p className="font-medium">{getAssetTypeLabel(item.asset_type)}</p></div>
            <div><p className="text-sm text-muted-foreground">Value</p><p className="font-mono">{item.value}</p></div>
            <div><p className="text-sm text-muted-foreground">Confidence</p><p className="font-medium">{getAssetConfidenceLabel(item.confidence)}</p></div>
            <div><p className="text-sm text-muted-foreground">First Seen</p><p className="font-medium">{new Date(item.first_seen_at).toLocaleString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Scan Job ID</p><p className="font-medium">{item.scan_job_id}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Network */}
      <Card>
        <CardHeader>
          <CardTitle>Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Host</p><p className="font-mono">{item.host || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Port</p><p className="font-mono">{item.port ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Protocol</p><p className="font-mono">{item.protocol || '—'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Service (only if service_name present) */}
      {item.service_name && (
        <Card>
          <CardHeader>
            <CardTitle>Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Service Name</p><p className="font-medium">{item.service_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Service Version</p><p className="font-medium">{item.service_version || '—'}</p></div>
            </div>
            {item.banner && (
              <div>
                <p className="text-sm text-muted-foreground">Banner</p>
                <pre className="bg-muted p-4 rounded overflow-x-auto mt-1">{item.banner}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 4: Metadata (only if service_metadata present) */}
      {item.service_metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-x-auto"><code>{formatJson(item.service_metadata)}</code></pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
