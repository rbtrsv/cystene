'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { ASSET_TYPE_OPTIONS, getAssetTypeLabel, type AssetType } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, FlaskConical, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function TherapeuticAssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = parseInt(params.id as string);
  const {
    therapeuticAssets,
    isLoading,
    error,
    setActiveTherapeuticAsset,
    fetchTherapeuticAsset,
    updateTherapeuticAsset,
    deleteTherapeuticAsset,
    fetchTherapeuticAssets
  } = useTherapeuticAssets();

  const listItem = therapeuticAssets.find(a => a.id === assetId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const asset = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editUid, setEditUid] = useState('');
  const [editName, setEditName] = useState('');
  const [editProjectCode, setEditProjectCode] = useState('');
  const [editAssetType, setEditAssetType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this therapeutic asset
  useEffect(() => {
    if (!listItem && assetId && !isLoading) {
      fetchTherapeuticAsset(assetId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, assetId, isLoading, fetchTherapeuticAsset]);

  // Initialize edit form when asset changes
  useEffect(() => {
    if (asset) {
      setEditUid(asset.uid);
      setEditName(asset.name);
      setEditProjectCode(asset.project_code || '');
      setEditAssetType(asset.asset_type);
    }
  }, [asset]);

  // Set active therapeutic asset when ID changes
  useEffect(() => {
    if (assetId) {
      setActiveTherapeuticAsset(assetId);
    }
  }, [assetId, setActiveTherapeuticAsset]);

  // Guard: loading state.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guard: error state.
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!asset) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Therapeutic asset not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/therapeutic-assets">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Therapeutic Assets
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{asset.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getAssetTypeLabel(asset.asset_type)}</Badge>
                <span className="text-sm text-muted-foreground font-mono">{asset.uid}</span>
                {asset.project_code && (
                  <span className="text-sm text-muted-foreground">· {asset.project_code}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <FlaskConical className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                Basic information about this therapeutic asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{asset.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UID</p>
                <p className="text-lg font-medium font-mono">{asset.uid}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Type</p>
                  <p className="text-lg font-medium">{getAssetTypeLabel(asset.asset_type)}</p>
                </div>
                {asset.project_code && (
                  <div>
                    <p className="text-sm text-muted-foreground">Project Code</p>
                    <p className="text-lg font-medium">{asset.project_code}</p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
              {asset.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(asset.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Asset</CardTitle>
              <CardDescription>
                Update therapeutic asset details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-uid">UID</Label>
                  <Input
                    id="asset-uid"
                    value={editUid}
                    onChange={(e) => setEditUid(e.target.value)}
                    placeholder="e.g., CTX-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Name</Label>
                  <Input
                    id="asset-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Rapamycin"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select value={editAssetType} onValueChange={setEditAssetType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-code">Project Code</Label>
                  <Input
                    id="project-code"
                    value={editProjectCode}
                    onChange={(e) => setEditProjectCode(e.target.value)}
                    placeholder="e.g., PRJ-2024-001"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editUid.trim() || !editName.trim() || !editAssetType) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateTherapeuticAsset(assetId, {
                      uid: editUid.trim(),
                      name: editName.trim(),
                      asset_type: editAssetType as AssetType,
                      project_code: editProjectCode || null,
                    });
                    if (success) {
                      await fetchTherapeuticAssets();
                    }
                  } catch (error) {
                    console.error('Failed to update therapeutic asset:', error);
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
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this therapeutic asset</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the therapeutic asset from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-asset">
                    Type <span className="font-semibold">{asset.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-asset"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Asset name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== asset.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteTherapeuticAsset(assetId);
                      if (success) {
                        router.push('/therapeutic-assets');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete therapeutic asset:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== asset.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Asset
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
