'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAssetOwnerships } from '@/modules/nexotype/hooks/commercial/use-asset-ownerships';
import { OWNERSHIP_TYPE_OPTIONS, type OwnershipType } from '@/modules/nexotype/schemas/commercial/asset-ownership.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, KeyRound, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function AssetOwnershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetOwnershipId = parseInt(params.id as string);
  const {
    assetOwnerships,
    isLoading,
    error,
    setActiveAssetOwnership,
    fetchAssetOwnership,
    updateAssetOwnership,
    deleteAssetOwnership,
    fetchAssetOwnerships
  } = useAssetOwnerships();
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Resolve FK fields to display names
  const getOrgName = (id: number | null | undefined) => {
    if (!id) return '—';
    const o = marketOrganizations.find(mo => mo.id === id);
    return o ? o.legal_name : `Organization #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const listItem = assetOwnerships.find(ao => ao.id === assetOwnershipId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const assetOwnership = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editMarketOrganizationId, setEditMarketOrganizationId] = useState('');
  const [editAssetId, setEditAssetId] = useState('');
  const [editOwnershipType, setEditOwnershipType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this asset ownership
  useEffect(() => {
    if (!listItem && assetOwnershipId && !isLoading) {
      fetchAssetOwnership(assetOwnershipId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, assetOwnershipId, isLoading, fetchAssetOwnership]);

  // Initialize edit form when asset ownership changes
  useEffect(() => {
    if (assetOwnership) {
      setEditMarketOrganizationId(assetOwnership.market_organization_id.toString());
      setEditAssetId(assetOwnership.asset_id.toString());
      setEditOwnershipType(assetOwnership.ownership_type || '');
    }
  }, [assetOwnership]);

  // Set active asset ownership when ID changes
  useEffect(() => {
    if (assetOwnershipId) {
      setActiveAssetOwnership(assetOwnershipId);
    }
  }, [assetOwnershipId, setActiveAssetOwnership]);

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

  if (!assetOwnership) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Asset ownership not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/asset-ownerships">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Asset Ownerships
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Asset Ownership #{assetOwnership.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {assetOwnership.ownership_type && <Badge variant="outline">{assetOwnership.ownership_type}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <KeyRound className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Ownership Details</CardTitle>
              <CardDescription>
                Basic information about this asset ownership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Market Organization</p>
                <p className="text-lg font-medium">{getOrgName(assetOwnership.market_organization_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(assetOwnership.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ownership Type</p>
                <p className="text-lg font-medium">{assetOwnership.ownership_type}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(assetOwnership.created_at).toLocaleDateString()}
                </p>
              </div>
              {assetOwnership.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(assetOwnership.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Asset Ownership</CardTitle>
              <CardDescription>
                Update asset ownership details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Market Organization — searchable combobox */}
                <div className="space-y-2">
                  <Label>Market Organization</Label>
                  <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={orgPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editMarketOrganizationId ? marketOrganizations.find(o => o.id.toString() === editMarketOrganizationId)?.legal_name || 'Select organization' : 'Select organization'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search organization..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                        {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { setEditMarketOrganizationId(o.id.toString()); setOrgPopoverOpen(false); }}>{o.legal_name}{editMarketOrganizationId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Asset — searchable combobox */}
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editAssetId ? therapeuticAssets.find(a => a.id.toString() === editAssetId)?.name || 'Select asset' : 'Select asset'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                        {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { setEditAssetId(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{editAssetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Ownership Type</Label>
                  <Select value={editOwnershipType} onValueChange={setEditOwnershipType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ownership type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNERSHIP_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedMarketOrganizationId = parseInt(editMarketOrganizationId, 10);
                  const parsedAssetId = parseInt(editAssetId, 10);
                  if (isNaN(parsedMarketOrganizationId) || parsedMarketOrganizationId <= 0) {
                    return;
                  }
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateAssetOwnership(assetOwnershipId, {
                      market_organization_id: parsedMarketOrganizationId,
                      asset_id: parsedAssetId,
                      ownership_type: editOwnershipType as OwnershipType || undefined,
                    });
                    if (success) {
                      await fetchAssetOwnerships();
                    }
                  } catch (error) {
                    console.error('Failed to update asset ownership:', error);
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
                  <h4 className="font-medium">Delete this asset ownership</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the asset ownership from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-asset-ownership">
                    Type <span className="font-semibold">{assetOwnership.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-asset-ownership"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== assetOwnership.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteAssetOwnership(assetOwnershipId);
                      if (success) {
                        router.push('/asset-ownerships');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete asset ownership:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== assetOwnership.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Asset Ownership
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
