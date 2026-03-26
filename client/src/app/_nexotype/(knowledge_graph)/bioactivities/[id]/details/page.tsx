'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBioactivities } from '@/modules/nexotype/hooks/knowledge_graph/use-bioactivities';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { ACTIVITY_TYPE_OPTIONS, type ActivityType } from '@/modules/nexotype/schemas/knowledge_graph/bioactivity.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Loader2, Zap, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function BioactivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bioactivityId = parseInt(params.id as string);
  const {
    bioactivities,
    isLoading,
    error,
    setActiveBioactivity,
    fetchBioactivity,
    updateBioactivity,
    deleteBioactivity,
    fetchBioactivities
  } = useBioactivities();

  // Get referenced entities for FK resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { pathways } = usePathways();

  const listItem = bioactivities.find(b => b.id === bioactivityId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const bioactivity = listItem ?? fetchedItem ?? null;

  // Helper to resolve names from IDs
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };
  const getPathwayName = (pathwayId: number) => {
    const pathway = pathways.find(p => p.id === pathwayId);
    return pathway ? pathway.name : `Pathway #${pathwayId}`;
  };

  // Settings state
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);
  const [editAssetId, setEditAssetId] = useState('');
  const [editPathwayId, setEditPathwayId] = useState('');
  const [editActivityType, setEditActivityType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this bioactivity
  useEffect(() => {
    if (!listItem && bioactivityId && !isLoading) {
      fetchBioactivity(bioactivityId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, bioactivityId, isLoading, fetchBioactivity]);

  // Initialize edit form when bioactivity changes
  useEffect(() => {
    if (bioactivity) {
      setEditAssetId(bioactivity.asset_id.toString());
      setEditPathwayId(bioactivity.pathway_id.toString());
      setEditActivityType(bioactivity.activity_type);
    }
  }, [bioactivity]);

  // Set active bioactivity when ID changes
  useEffect(() => {
    if (bioactivityId) {
      setActiveBioactivity(bioactivityId);
    }
  }, [bioactivityId, setActiveBioactivity]);

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

  if (!bioactivity) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Bioactivity not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/bioactivities">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Bioactivities
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bioactivity #{bioactivity.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{bioactivity.activity_type}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Zap className="h-4 w-4" />
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
              <CardTitle>Bioactivity Details</CardTitle>
              <CardDescription>
                Basic information about this bioactivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(bioactivity.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pathway</p>
                <p className="text-lg font-medium">{getPathwayName(bioactivity.pathway_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activity Type</p>
                <p className="text-lg font-medium">{bioactivity.activity_type}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(bioactivity.created_at).toLocaleDateString()}
                </p>
              </div>
              {bioactivity.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(bioactivity.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Bioactivity</CardTitle>
              <CardDescription>
                Update bioactivity details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Asset — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Asset</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editAssetId ? therapeuticAssets.find(a => a.id.toString() === editAssetId)?.name || 'Select asset' : 'Select asset'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search asset..." />
                        <CommandList>
                          <CommandEmpty>No assets found.</CommandEmpty>
                          <CommandGroup>
                            {therapeuticAssets.map((a) => (
                              <CommandItem key={a.id} value={a.name} onSelect={() => { setEditAssetId(a.id.toString()); setAssetPopoverOpen(false); }}>
                                {a.name}
                                {editAssetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Pathway — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Pathway</Label>
                  <Popover open={pathwayPopoverOpen} onOpenChange={setPathwayPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={pathwayPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editPathwayId ? pathways.find(p => p.id.toString() === editPathwayId)?.name || 'Select pathway' : 'Select pathway'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search pathway..." />
                        <CommandList>
                          <CommandEmpty>No pathways found.</CommandEmpty>
                          <CommandGroup>
                            {pathways.map((p) => (
                              <CommandItem key={p.id} value={p.name} onSelect={() => { setEditPathwayId(p.id.toString()); setPathwayPopoverOpen(false); }}>
                                {p.name}
                                {editPathwayId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Activity Type</Label>
                  <Select
                    value={editActivityType}
                    onValueChange={setEditActivityType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPE_OPTIONS.map((option) => (
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
                  const parsedPathwayId = parseInt(editPathwayId, 10);
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  if (isNaN(parsedPathwayId) || parsedPathwayId <= 0) {
                    return;
                  }
                  if (!editActivityType) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateBioactivity(bioactivityId, {
                      asset_id: parsedAssetId,
                      pathway_id: parsedPathwayId,
                      activity_type: editActivityType as ActivityType,
                    });
                    if (success) {
                      await fetchBioactivities();
                    }
                  } catch (error) {
                    console.error('Failed to update bioactivity:', error);
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
                  <h4 className="font-medium">Delete this bioactivity</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the bioactivity from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-bioactivity">
                    Type <span className="font-semibold">{bioactivity.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-bioactivity"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== bioactivity.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteBioactivity(bioactivityId);
                      if (success) {
                        router.push('/bioactivities');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete bioactivity:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== bioactivity.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Bioactivity
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
