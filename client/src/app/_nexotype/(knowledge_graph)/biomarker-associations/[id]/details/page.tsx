'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBiomarkerAssociations } from '@/modules/nexotype/hooks/knowledge_graph/use-biomarker-associations';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { CORRELATION_OPTIONS, type Correlation } from '@/modules/nexotype/schemas/knowledge_graph/biomarker-association.schemas';
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
import { Loader2, Link2, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function BiomarkerAssociationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const biomarkerAssociationId = parseInt(params.id as string);
  const {
    biomarkerAssociations,
    isLoading,
    error,
    setActiveBiomarkerAssociation,
    fetchBiomarkerAssociation,
    updateBiomarkerAssociation,
    deleteBiomarkerAssociation,
    fetchBiomarkerAssociations
  } = useBiomarkerAssociations();
  const { biomarkers } = useBiomarkers();
  const { indications } = useIndications();
  const { phenotypes } = usePhenotypes();

  // Resolve FK IDs to display names
  const getBiomarkerName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = biomarkers.find(b => b.id === id);
    return item ? item.name : `Biomarker #${id}`;
  };
  const getIndicationName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = indications.find(i => i.id === id);
    return item ? item.name : `Indication #${id}`;
  };
  const getPhenotypeName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = phenotypes.find(p => p.id === id);
    return item ? item.name : `Phenotype #${id}`;
  };

  const listItem = biomarkerAssociations.find(ba => ba.id === biomarkerAssociationId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const biomarkerAssociation = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editBiomarkerId, setEditBiomarkerId] = useState('');
  const [editIndicationId, setEditIndicationId] = useState('');
  const [editPhenotypeId, setEditPhenotypeId] = useState('');
  const [editCorrelation, setEditCorrelation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [biomarkerPopoverOpen, setBiomarkerPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this biomarker association
  useEffect(() => {
    if (!listItem && biomarkerAssociationId && !isLoading) {
      fetchBiomarkerAssociation(biomarkerAssociationId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, biomarkerAssociationId, isLoading, fetchBiomarkerAssociation]);

  // Initialize edit form when biomarker association changes
  useEffect(() => {
    if (biomarkerAssociation) {
      setEditBiomarkerId(biomarkerAssociation.biomarker_id.toString());
      setEditIndicationId(biomarkerAssociation.indication_id?.toString() || '');
      setEditPhenotypeId(biomarkerAssociation.phenotype_id?.toString() || '');
      setEditCorrelation(biomarkerAssociation.correlation);
    }
  }, [biomarkerAssociation]);

  // Set active biomarker association when ID changes
  useEffect(() => {
    if (biomarkerAssociationId) {
      setActiveBiomarkerAssociation(biomarkerAssociationId);
    }
  }, [biomarkerAssociationId, setActiveBiomarkerAssociation]);

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

  if (!biomarkerAssociation) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Biomarker association not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/biomarker-associations">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Biomarker Associations
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link2 className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Biomarker Association #{biomarkerAssociation.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{biomarkerAssociation.correlation}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Link2 className="h-4 w-4" />
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
              <CardTitle>Biomarker Association Details</CardTitle>
              <CardDescription>
                Basic information about this biomarker association
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Biomarker</p>
                <p className="text-lg font-medium">{getBiomarkerName(biomarkerAssociation.biomarker_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indication</p>
                <p className="text-lg font-medium">{getIndicationName(biomarkerAssociation.indication_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phenotype</p>
                <p className="text-lg font-medium">{getPhenotypeName(biomarkerAssociation.phenotype_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correlation</p>
                <p className="text-lg font-medium">{biomarkerAssociation.correlation}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(biomarkerAssociation.created_at).toLocaleDateString()}
                </p>
              </div>
              {biomarkerAssociation.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(biomarkerAssociation.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Biomarker Association</CardTitle>
              <CardDescription>
                Update biomarker association details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Biomarker — searchable combobox */}
                <div className="space-y-2">
                  <Label>Biomarker</Label>
                  <Popover open={biomarkerPopoverOpen} onOpenChange={setBiomarkerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={biomarkerPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editBiomarkerId
                            ? biomarkers.find(b => b.id.toString() === editBiomarkerId)?.name || 'Select biomarker'
                            : 'Select biomarker'}
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
                            {biomarkers.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.name}
                                onSelect={() => {
                                  setEditBiomarkerId(b.id.toString());
                                  setBiomarkerPopoverOpen(false);
                                }}
                              >
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
                {/* Indication — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Indication</Label>
                  <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={indicationPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editIndicationId
                            ? indications.find(i => i.id.toString() === editIndicationId)?.name || 'Select indication'
                            : '— None —'}
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
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                setEditIndicationId('');
                                setIndicationPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!editIndicationId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {indications.map((i) => (
                              <CommandItem
                                key={i.id}
                                value={i.name}
                                onSelect={() => {
                                  setEditIndicationId(i.id.toString());
                                  setIndicationPopoverOpen(false);
                                }}
                              >
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
                <div className="space-y-2">
                  <Label>Phenotype</Label>
                  <Popover open={phenotypePopoverOpen} onOpenChange={setPhenotypePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={phenotypePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editPhenotypeId
                            ? phenotypes.find(p => p.id.toString() === editPhenotypeId)?.name || 'Select phenotype'
                            : '— None —'}
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
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                setEditPhenotypeId('');
                                setPhenotypePopoverOpen(false);
                              }}
                            >
                              — None —
                              {!editPhenotypeId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {phenotypes.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  setEditPhenotypeId(p.id.toString());
                                  setPhenotypePopoverOpen(false);
                                }}
                              >
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
                <div className="space-y-2">
                  <Label>Correlation</Label>
                  <Select
                    value={editCorrelation}
                    onValueChange={setEditCorrelation}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select correlation" />
                    </SelectTrigger>
                    <SelectContent>
                      {CORRELATION_OPTIONS.map((option) => (
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
                  const parsedBiomarkerId = parseInt(editBiomarkerId, 10);
                  if (isNaN(parsedBiomarkerId) || parsedBiomarkerId <= 0) {
                    return;
                  }
                  if (!editCorrelation) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateBiomarkerAssociation(biomarkerAssociationId, {
                      biomarker_id: parsedBiomarkerId,
                      indication_id: editIndicationId ? parseInt(editIndicationId, 10) : null,
                      phenotype_id: editPhenotypeId ? parseInt(editPhenotypeId, 10) : null,
                      correlation: editCorrelation as Correlation,
                    });
                    if (success) {
                      await fetchBiomarkerAssociations();
                    }
                  } catch (error) {
                    console.error('Failed to update biomarker association:', error);
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
                  <h4 className="font-medium">Delete this biomarker association</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the biomarker association from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-biomarker-association">
                    Type <span className="font-semibold">{biomarkerAssociation.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-biomarker-association"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== biomarkerAssociation.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteBiomarkerAssociation(biomarkerAssociationId);
                      if (success) {
                        router.push('/biomarker-associations');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete biomarker association:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== biomarkerAssociation.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Biomarker Association
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
