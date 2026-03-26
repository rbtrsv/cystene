'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAssetTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-asset-technology-platforms';
import { PLATFORM_ROLE_OPTIONS, type PlatformRole } from '@/modules/nexotype/schemas/commercial/asset-technology-platform.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Combine, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-technology-platforms';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function AssetTechnologyPlatformDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetTechnologyPlatformId = parseInt(params.id as string);
  const {
    assetTechnologyPlatforms,
    isLoading,
    error,
    setActiveAssetTechnologyPlatform,
    fetchAssetTechnologyPlatform,
    updateAssetTechnologyPlatform,
    deleteAssetTechnologyPlatform,
    fetchAssetTechnologyPlatforms
  } = useAssetTechnologyPlatforms();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { technologyPlatforms } = useTechnologyPlatforms();

  // Resolve FK fields to display names
  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const getPlatformName = (id: number | null | undefined) => {
    if (!id) return '—';
    const tp = technologyPlatforms.find(t => t.id === id);
    return tp ? tp.name : `Platform #${id}`;
  };

  const listItem = assetTechnologyPlatforms.find(atp => atp.id === assetTechnologyPlatformId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const assetTechnologyPlatform = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editAssetId, setEditAssetId] = useState('');
  const [editTechnologyPlatformId, setEditTechnologyPlatformId] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [platformPopoverOpen, setPlatformPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this asset technology platform
  useEffect(() => {
    if (!listItem && assetTechnologyPlatformId && !isLoading) {
      fetchAssetTechnologyPlatform(assetTechnologyPlatformId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, assetTechnologyPlatformId, isLoading, fetchAssetTechnologyPlatform]);

  // Initialize edit form when asset technology platform changes
  useEffect(() => {
    if (assetTechnologyPlatform) {
      setEditAssetId(assetTechnologyPlatform.asset_id.toString());
      setEditTechnologyPlatformId(assetTechnologyPlatform.technology_platform_id.toString());
      setEditRole(assetTechnologyPlatform.role || '');
    }
  }, [assetTechnologyPlatform]);

  // Set active asset technology platform when ID changes
  useEffect(() => {
    if (assetTechnologyPlatformId) {
      setActiveAssetTechnologyPlatform(assetTechnologyPlatformId);
    }
  }, [assetTechnologyPlatformId, setActiveAssetTechnologyPlatform]);

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

  if (!assetTechnologyPlatform) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Asset technology platform not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/asset-technology-platforms">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Asset Technology Platforms
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Combine className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Asset Technology Platform #{assetTechnologyPlatform.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {assetTechnologyPlatform.role && <Badge variant="outline">{assetTechnologyPlatform.role}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Combine className="h-4 w-4" />
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
              <CardTitle>Asset Technology Platform Details</CardTitle>
              <CardDescription>
                Basic information about this asset technology platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(assetTechnologyPlatform.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Technology Platform</p>
                <p className="text-lg font-medium">{getPlatformName(assetTechnologyPlatform.technology_platform_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-lg font-medium">{assetTechnologyPlatform.role || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(assetTechnologyPlatform.created_at).toLocaleDateString()}
                </p>
              </div>
              {assetTechnologyPlatform.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(assetTechnologyPlatform.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Asset Technology Platform</CardTitle>
              <CardDescription>
                Update asset technology platform details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {/* Technology Platform — searchable combobox */}
                <div className="space-y-2">
                  <Label>Technology Platform</Label>
                  <Popover open={platformPopoverOpen} onOpenChange={setPlatformPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={platformPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editTechnologyPlatformId ? technologyPlatforms.find(tp => tp.id.toString() === editTechnologyPlatformId)?.name || 'Select platform' : 'Select platform'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search platform..." /><CommandList><CommandEmpty>No platforms found.</CommandEmpty><CommandGroup>
                        {technologyPlatforms.map((tp) => (<CommandItem key={tp.id} value={tp.name} onSelect={() => { setEditTechnologyPlatformId(tp.id.toString()); setPlatformPopoverOpen(false); }}>{tp.name}{editTechnologyPlatformId === tp.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Role</Label>
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_ROLE_OPTIONS.map((option) => (
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
                  const parsedAssetId = parseInt(editAssetId, 10);
                  const parsedTechnologyPlatformId = parseInt(editTechnologyPlatformId, 10);
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  if (isNaN(parsedTechnologyPlatformId) || parsedTechnologyPlatformId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateAssetTechnologyPlatform(assetTechnologyPlatformId, {
                      asset_id: parsedAssetId,
                      technology_platform_id: parsedTechnologyPlatformId,
                      role: editRole as PlatformRole || undefined,
                    });
                    if (success) {
                      await fetchAssetTechnologyPlatforms();
                    }
                  } catch (error) {
                    console.error('Failed to update asset technology platform:', error);
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
                  <h4 className="font-medium">Delete this asset technology platform</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the asset technology platform from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-asset-technology-platform">
                    Type <span className="font-semibold">{assetTechnologyPlatform.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-asset-technology-platform"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== assetTechnologyPlatform.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteAssetTechnologyPlatform(assetTechnologyPlatformId);
                      if (success) {
                        router.push('/asset-technology-platforms');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete asset technology platform:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== assetTechnologyPlatform.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Asset Technology Platform
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
