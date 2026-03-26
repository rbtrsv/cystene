'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTherapeuticEfficacies } from '@/modules/nexotype/hooks/knowledge_graph/use-therapeutic-efficacies';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { DIRECTION_OPTIONS, type Direction } from '@/modules/nexotype/schemas/knowledge_graph/therapeutic-efficacy.schemas';
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
import { Loader2, TrendingUp, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function TherapeuticEfficacyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const therapeuticEfficacyId = parseInt(params.id as string);
  const {
    therapeuticEfficacies,
    isLoading,
    error,
    setActiveTherapeuticEfficacy,
    fetchTherapeuticEfficacy,
    updateTherapeuticEfficacy,
    deleteTherapeuticEfficacy,
    fetchTherapeuticEfficacies
  } = useTherapeuticEfficacies();

  // Get referenced entities for FK resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { indications } = useIndications();
  const { phenotypes } = usePhenotypes();
  const { biomarkers } = useBiomarkers();

  const listItem = therapeuticEfficacies.find(te => te.id === therapeuticEfficacyId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const therapeuticEfficacy = listItem ?? fetchedItem ?? null;

  // Helper to resolve names from IDs
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };
  const getIndicationName = (indicationId: number | null | undefined) => {
    if (!indicationId) return '—';
    const indication = indications.find(i => i.id === indicationId);
    return indication ? indication.name : `Indication #${indicationId}`;
  };
  const getPhenotypeName = (phenotypeId: number | null | undefined) => {
    if (!phenotypeId) return '—';
    const phenotype = phenotypes.find(p => p.id === phenotypeId);
    return phenotype ? phenotype.name : `Phenotype #${phenotypeId}`;
  };
  const getBiomarkerName = (biomarkerId: number | null | undefined) => {
    if (!biomarkerId) return '—';
    const biomarker = biomarkers.find(b => b.id === biomarkerId);
    return biomarker ? biomarker.name : `Biomarker #${biomarkerId}`;
  };

  // Settings state
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);
  const [biomarkerPopoverOpen, setBiomarkerPopoverOpen] = useState(false);
  const [editAssetId, setEditAssetId] = useState('');
  const [editIndicationId, setEditIndicationId] = useState('');
  const [editPhenotypeId, setEditPhenotypeId] = useState('');
  const [editBiomarkerId, setEditBiomarkerId] = useState('');
  const [editDirection, setEditDirection] = useState('');
  const [editMagnitude, setEditMagnitude] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this therapeutic efficacy
  useEffect(() => {
    if (!listItem && therapeuticEfficacyId && !isLoading) {
      fetchTherapeuticEfficacy(therapeuticEfficacyId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, therapeuticEfficacyId, isLoading, fetchTherapeuticEfficacy]);

  // Initialize edit form when therapeutic efficacy changes
  useEffect(() => {
    if (therapeuticEfficacy) {
      setEditAssetId(therapeuticEfficacy.asset_id.toString());
      setEditIndicationId(therapeuticEfficacy.indication_id?.toString() || '');
      setEditPhenotypeId(therapeuticEfficacy.phenotype_id?.toString() || '');
      setEditBiomarkerId(therapeuticEfficacy.biomarker_id?.toString() || '');
      setEditDirection(therapeuticEfficacy.direction);
      setEditMagnitude(therapeuticEfficacy.magnitude || '');
    }
  }, [therapeuticEfficacy]);

  // Set active therapeutic efficacy when ID changes
  useEffect(() => {
    if (therapeuticEfficacyId) {
      setActiveTherapeuticEfficacy(therapeuticEfficacyId);
    }
  }, [therapeuticEfficacyId, setActiveTherapeuticEfficacy]);

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

  if (!therapeuticEfficacy) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Therapeutic efficacy not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/therapeutic-efficacies">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Therapeutic Efficacies
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Therapeutic Efficacy #{therapeuticEfficacy.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{therapeuticEfficacy.direction}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4" />
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
              <CardTitle>Therapeutic Efficacy Details</CardTitle>
              <CardDescription>
                Basic information about this therapeutic efficacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(therapeuticEfficacy.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indication</p>
                <p className="text-lg font-medium">{getIndicationName(therapeuticEfficacy.indication_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phenotype</p>
                <p className="text-lg font-medium">{getPhenotypeName(therapeuticEfficacy.phenotype_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biomarker</p>
                <p className="text-lg font-medium">{getBiomarkerName(therapeuticEfficacy.biomarker_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p className="text-lg font-medium">{therapeuticEfficacy.direction}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Magnitude</p>
                <p className="text-lg font-medium">{therapeuticEfficacy.magnitude ?? '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(therapeuticEfficacy.created_at).toLocaleDateString()}
                </p>
              </div>
              {therapeuticEfficacy.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(therapeuticEfficacy.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Therapeutic Efficacy</CardTitle>
              <CardDescription>
                Update therapeutic efficacy details
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
                {/* Indication — optional searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Indication</Label>
                  <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={indicationPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editIndicationId ? indications.find(i => i.id.toString() === editIndicationId)?.name || 'Select indication' : 'Select indication (optional)'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search indication..." />
                        <CommandList>
                          <CommandEmpty>No indications found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="__none__" onSelect={() => { setEditIndicationId(''); setIndicationPopoverOpen(false); }}>
                              — None —
                              {!editIndicationId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {indications.map((i) => (
                              <CommandItem key={i.id} value={i.name} onSelect={() => { setEditIndicationId(i.id.toString()); setIndicationPopoverOpen(false); }}>
                                {i.name}
                                {editIndicationId === i.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Phenotype — optional searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Phenotype</Label>
                  <Popover open={phenotypePopoverOpen} onOpenChange={setPhenotypePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={phenotypePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editPhenotypeId ? phenotypes.find(p => p.id.toString() === editPhenotypeId)?.name || 'Select phenotype' : 'Select phenotype (optional)'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search phenotype..." />
                        <CommandList>
                          <CommandEmpty>No phenotypes found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="__none__" onSelect={() => { setEditPhenotypeId(''); setPhenotypePopoverOpen(false); }}>
                              — None —
                              {!editPhenotypeId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {phenotypes.map((p) => (
                              <CommandItem key={p.id} value={p.name} onSelect={() => { setEditPhenotypeId(p.id.toString()); setPhenotypePopoverOpen(false); }}>
                                {p.name}
                                {editPhenotypeId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Biomarker — optional searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Biomarker</Label>
                  <Popover open={biomarkerPopoverOpen} onOpenChange={setBiomarkerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={biomarkerPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editBiomarkerId ? biomarkers.find(b => b.id.toString() === editBiomarkerId)?.name || 'Select biomarker' : 'Select biomarker (optional)'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search biomarker..." />
                        <CommandList>
                          <CommandEmpty>No biomarkers found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem value="__none__" onSelect={() => { setEditBiomarkerId(''); setBiomarkerPopoverOpen(false); }}>
                              — None —
                              {!editBiomarkerId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {biomarkers.map((b) => (
                              <CommandItem key={b.id} value={b.name} onSelect={() => { setEditBiomarkerId(b.id.toString()); setBiomarkerPopoverOpen(false); }}>
                                {b.name}
                                {editBiomarkerId === b.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    value={editDirection}
                    onValueChange={setEditDirection}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="magnitude">Magnitude</Label>
                  <Input
                    id="magnitude"
                    value={editMagnitude}
                    onChange={(e) => setEditMagnitude(e.target.value)}
                    placeholder="e.g., high"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedAssetId = parseInt(editAssetId, 10);
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  if (!editDirection) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateTherapeuticEfficacy(therapeuticEfficacyId, {
                      asset_id: parsedAssetId,
                      indication_id: editIndicationId ? parseInt(editIndicationId, 10) : null,
                      phenotype_id: editPhenotypeId ? parseInt(editPhenotypeId, 10) : null,
                      biomarker_id: editBiomarkerId ? parseInt(editBiomarkerId, 10) : null,
                      direction: editDirection as Direction,
                      magnitude: editMagnitude.trim() || null,
                    });
                    if (success) {
                      await fetchTherapeuticEfficacies();
                    }
                  } catch (error) {
                    console.error('Failed to update therapeutic efficacy:', error);
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
                  <h4 className="font-medium">Delete this therapeutic efficacy</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the therapeutic efficacy from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-therapeutic-efficacy">
                    Type <span className="font-semibold">{therapeuticEfficacy.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-therapeutic-efficacy"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== therapeuticEfficacy.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteTherapeuticEfficacy(therapeuticEfficacyId);
                      if (success) {
                        router.push('/therapeutic-efficacies');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete therapeutic efficacy:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== therapeuticEfficacy.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Therapeutic Efficacy
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
