'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDrugInteractions } from '@/modules/nexotype/hooks/knowledge_graph/use-drug-interactions';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { INTERACTION_TYPE_OPTIONS, type InteractionType } from '@/modules/nexotype/schemas/knowledge_graph/drug-interaction.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Repeat, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function DrugInteractionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drugInteractionId = parseInt(params.id as string);
  const {
    drugInteractions,
    isLoading,
    error,
    setActiveDrugInteraction,
    fetchDrugInteraction,
    updateDrugInteraction,
    deleteDrugInteraction,
    fetchDrugInteractions
  } = useDrugInteractions();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Resolve asset FK to display name
  const getAssetName = (assetId: number | null | undefined) => {
    if (!assetId) return '—';
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  const listItem = drugInteractions.find(di => di.id === drugInteractionId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const drugInteraction = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editAssetAId, setEditAssetAId] = useState('');
  const [editAssetBId, setEditAssetBId] = useState('');
  const [editInteractionType, setEditInteractionType] = useState('');
  const [assetAPopoverOpen, setAssetAPopoverOpen] = useState(false);
  const [assetBPopoverOpen, setAssetBPopoverOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this drug interaction
  useEffect(() => {
    if (!listItem && drugInteractionId && !isLoading) {
      fetchDrugInteraction(drugInteractionId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, drugInteractionId, isLoading, fetchDrugInteraction]);

  // Initialize edit form when drug interaction changes
  useEffect(() => {
    if (drugInteraction) {
      setEditAssetAId(drugInteraction.asset_a_id.toString());
      setEditAssetBId(drugInteraction.asset_b_id.toString());
      setEditInteractionType(drugInteraction.interaction_type);
    }
  }, [drugInteraction]);

  // Set active drug interaction when ID changes
  useEffect(() => {
    if (drugInteractionId) {
      setActiveDrugInteraction(drugInteractionId);
    }
  }, [drugInteractionId, setActiveDrugInteraction]);

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

  if (!drugInteraction) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Drug interaction not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/drug-interactions">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Drug Interactions
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Repeat className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Drug Interaction #{drugInteraction.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{drugInteraction.interaction_type}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Repeat className="h-4 w-4" />
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
              <CardTitle>Drug Interaction Details</CardTitle>
              <CardDescription>
                Basic information about this drug interaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset A</p>
                <p className="text-lg font-medium">{getAssetName(drugInteraction.asset_a_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset B</p>
                <p className="text-lg font-medium">{getAssetName(drugInteraction.asset_b_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interaction Type</p>
                <p className="text-lg font-medium">{drugInteraction.interaction_type}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(drugInteraction.created_at).toLocaleDateString()}
                </p>
              </div>
              {drugInteraction.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(drugInteraction.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Drug Interaction</CardTitle>
              <CardDescription>
                Update drug interaction details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Asset A — searchable combobox */}
                <div className="space-y-2">
                  <Label>Asset A</Label>
                  <Popover open={assetAPopoverOpen} onOpenChange={setAssetAPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetAPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editAssetAId
                            ? therapeuticAssets.find(a => a.id.toString() === editAssetAId)?.name || 'Select asset'
                            : 'Select asset'}
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
                              <CommandItem
                                key={a.id}
                                value={a.name}
                                onSelect={() => {
                                  setEditAssetAId(a.id.toString());
                                  setAssetAPopoverOpen(false);
                                }}
                              >
                                {a.name}
                                {editAssetAId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Asset B — searchable combobox */}
                <div className="space-y-2">
                  <Label>Asset B</Label>
                  <Popover open={assetBPopoverOpen} onOpenChange={setAssetBPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetBPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editAssetBId
                            ? therapeuticAssets.find(a => a.id.toString() === editAssetBId)?.name || 'Select asset'
                            : 'Select asset'}
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
                              <CommandItem
                                key={a.id}
                                value={a.name}
                                onSelect={() => {
                                  setEditAssetBId(a.id.toString());
                                  setAssetBPopoverOpen(false);
                                }}
                              >
                                {a.name}
                                {editAssetBId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Interaction Type</Label>
                  <Select
                    value={editInteractionType}
                    onValueChange={setEditInteractionType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select interaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPE_OPTIONS.map((option) => (
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
                  const parsedAssetAId = parseInt(editAssetAId, 10);
                  const parsedAssetBId = parseInt(editAssetBId, 10);
                  if (isNaN(parsedAssetAId) || parsedAssetAId <= 0) {
                    return;
                  }
                  if (isNaN(parsedAssetBId) || parsedAssetBId <= 0) {
                    return;
                  }
                  if (!editInteractionType) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateDrugInteraction(drugInteractionId, {
                      asset_a_id: parsedAssetAId,
                      asset_b_id: parsedAssetBId,
                      interaction_type: editInteractionType as InteractionType,
                    });
                    if (success) {
                      await fetchDrugInteractions();
                    }
                  } catch (error) {
                    console.error('Failed to update drug interaction:', error);
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
                  <h4 className="font-medium">Delete this drug interaction</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the drug interaction from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-drug-interaction">
                    Type <span className="font-semibold">{drugInteraction.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-drug-interaction"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== drugInteraction.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteDrugInteraction(drugInteractionId);
                      if (success) {
                        router.push('/drug-interactions');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete drug interaction:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== drugInteraction.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Drug Interaction
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
