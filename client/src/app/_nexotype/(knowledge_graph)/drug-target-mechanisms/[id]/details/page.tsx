'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDrugTargetMechanisms } from '@/modules/nexotype/hooks/knowledge_graph/use-drug-target-mechanisms';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { MECHANISM_OPTIONS, type Mechanism } from '@/modules/nexotype/schemas/knowledge_graph/drug-target-mechanism.schemas';
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
import { Loader2, Crosshair, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function DrugTargetMechanismDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drugTargetMechanismId = parseInt(params.id as string);
  const {
    drugTargetMechanisms,
    isLoading,
    error,
    setActiveDrugTargetMechanism,
    fetchDrugTargetMechanism,
    updateDrugTargetMechanism,
    deleteDrugTargetMechanism,
    fetchDrugTargetMechanisms
  } = useDrugTargetMechanisms();

  // Get referenced entities for FK name resolution and edit comboboxes
  const { therapeuticAssets } = useTherapeuticAssets();
  const { proteins } = useProteins();

  const listItem = drugTargetMechanisms.find(dtm => dtm.id === drugTargetMechanismId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const drugTargetMechanism = listItem ?? fetchedItem ?? null;

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Helper to resolve protein name from FK ID
  const getProteinName = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // Settings state
  const [editAssetId, setEditAssetId] = useState('');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [editProteinId, setEditProteinId] = useState('');
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);
  const [editMechanism, setEditMechanism] = useState('');
  const [editAffinityValue, setEditAffinityValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this drug target mechanism
  useEffect(() => {
    if (!listItem && drugTargetMechanismId && !isLoading) {
      fetchDrugTargetMechanism(drugTargetMechanismId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, drugTargetMechanismId, isLoading, fetchDrugTargetMechanism]);

  // Initialize edit form when drug target mechanism changes
  useEffect(() => {
    if (drugTargetMechanism) {
      setEditAssetId(drugTargetMechanism.asset_id.toString());
      setEditProteinId(drugTargetMechanism.protein_id.toString());
      setEditMechanism(drugTargetMechanism.mechanism);
      setEditAffinityValue(drugTargetMechanism.affinity_value?.toString() || '');
    }
  }, [drugTargetMechanism]);

  // Set active drug target mechanism when ID changes
  useEffect(() => {
    if (drugTargetMechanismId) {
      setActiveDrugTargetMechanism(drugTargetMechanismId);
    }
  }, [drugTargetMechanismId, setActiveDrugTargetMechanism]);

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

  if (!drugTargetMechanism) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Drug target mechanism not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <div>
          <Link href="/drug-target-mechanisms">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Drug Target Mechanisms
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Crosshair className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-2xl sm:text-3xl font-bold tracking-tight">Drug Target Mechanism #{drugTargetMechanism.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{drugTargetMechanism.mechanism}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Crosshair className="h-4 w-4" />
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
              <CardTitle>Drug Target Mechanism Details</CardTitle>
              <CardDescription>
                Basic information about this drug target mechanism
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(drugTargetMechanism.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-lg font-medium">{getProteinName(drugTargetMechanism.protein_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mechanism</p>
                <p className="text-lg font-medium">{drugTargetMechanism.mechanism}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Affinity Value</p>
                <p className="text-lg font-medium">{drugTargetMechanism.affinity_value ?? '—'}</p>
              </div>
              <div className="sm:col-span-2 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(drugTargetMechanism.created_at).toLocaleDateString()}
                </p>
              </div>
              {drugTargetMechanism.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(drugTargetMechanism.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Drug Target Mechanism</CardTitle>
              <CardDescription>
                Update drug target mechanism details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Asset — searchable combobox */}
              <div className="space-y-2">
                <Label>Asset</Label>
                <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={assetPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {editAssetId
                          ? therapeuticAssets.find(a => a.id.toString() === editAssetId)?.name || 'Select asset'
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
                          {therapeuticAssets.map(asset => (
                            <CommandItem
                              key={asset.id}
                              value={asset.name}
                              onSelect={() => {
                                setEditAssetId(asset.id.toString());
                                setAssetPopoverOpen(false);
                              }}
                            >
                              {asset.name}
                              {editAssetId === asset.id.toString() && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Protein — searchable combobox */}
              <div className="space-y-2">
                <Label>Protein</Label>
                <Popover open={proteinPopoverOpen} onOpenChange={setProteinPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={proteinPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {editProteinId
                          ? proteins.find(p => p.id.toString() === editProteinId)?.uniprot_accession || 'Select protein'
                          : 'Select protein'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search protein..." />
                      <CommandList>
                        <CommandEmpty>No proteins found.</CommandEmpty>
                        <CommandGroup>
                          {proteins.map(protein => (
                            <CommandItem
                              key={protein.id}
                              value={protein.uniprot_accession}
                              onSelect={() => {
                                setEditProteinId(protein.id.toString());
                                setProteinPopoverOpen(false);
                              }}
                            >
                              {protein.uniprot_accession}
                              {editProteinId === protein.id.toString() && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mechanism</Label>
                  <Select
                    value={editMechanism}
                    onValueChange={setEditMechanism}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select mechanism" />
                    </SelectTrigger>
                    <SelectContent>
                      {MECHANISM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affinity-value">Affinity Value</Label>
                  <Input
                    id="affinity-value"
                    type="number"
                    step="any"
                    value={editAffinityValue}
                    onChange={(e) => setEditAffinityValue(e.target.value)}
                    placeholder="e.g., 5.2"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedAssetId = parseInt(editAssetId, 10);
                  const parsedProteinId = parseInt(editProteinId, 10);
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  if (isNaN(parsedProteinId) || parsedProteinId <= 0) {
                    return;
                  }
                  if (!editMechanism) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateDrugTargetMechanism(drugTargetMechanismId, {
                      asset_id: parsedAssetId,
                      protein_id: parsedProteinId,
                      mechanism: editMechanism as Mechanism,
                      affinity_value: editAffinityValue ? parseFloat(editAffinityValue) : null,
                    });
                    if (success) {
                      await fetchDrugTargetMechanisms();
                    }
                  } catch (error) {
                    console.error('Failed to update drug target mechanism:', error);
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
                  <h4 className="font-medium">Delete this drug target mechanism</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the drug target mechanism from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-drug-target-mechanism">
                    Type <span className="font-semibold">{drugTargetMechanism.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-drug-target-mechanism"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== drugTargetMechanism.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteDrugTargetMechanism(drugTargetMechanismId);
                      if (success) {
                        router.push('/drug-target-mechanisms');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete drug target mechanism:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== drugTargetMechanism.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Drug Target Mechanism
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
