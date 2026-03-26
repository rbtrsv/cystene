'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGenomicAssociations } from '@/modules/nexotype/hooks/knowledge_graph/use-genomic-associations';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Dna, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function GenomicAssociationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const genomicAssociationId = parseInt(params.id as string);
  const {
    genomicAssociations,
    isLoading,
    error,
    setActiveGenomicAssociation,
    fetchGenomicAssociation,
    updateGenomicAssociation,
    deleteGenomicAssociation,
    fetchGenomicAssociations
  } = useGenomicAssociations();
  const { variants } = useVariants();
  const { indications } = useIndications();

  // Resolve FK IDs to display names
  const getVariantName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = variants.find(v => v.id === id);
    return item ? item.db_snp_id : `Variant #${id}`;
  };
  const getIndicationName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = indications.find(i => i.id === id);
    return item ? item.name : `Indication #${id}`;
  };

  const listItem = genomicAssociations.find(ga => ga.id === genomicAssociationId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const genomicAssociation = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editVariantId, setEditVariantId] = useState('');
  const [editIndicationId, setEditIndicationId] = useState('');
  const [editOddsRatio, setEditOddsRatio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this genomic association
  useEffect(() => {
    if (!listItem && genomicAssociationId && !isLoading) {
      fetchGenomicAssociation(genomicAssociationId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, genomicAssociationId, isLoading, fetchGenomicAssociation]);

  // Initialize edit form when genomic association changes
  useEffect(() => {
    if (genomicAssociation) {
      setEditVariantId(genomicAssociation.variant_id.toString());
      setEditIndicationId(genomicAssociation.indication_id.toString());
      setEditOddsRatio(genomicAssociation.odds_ratio?.toString() || '');
    }
  }, [genomicAssociation]);

  // Set active genomic association when ID changes
  useEffect(() => {
    if (genomicAssociationId) {
      setActiveGenomicAssociation(genomicAssociationId);
    }
  }, [genomicAssociationId, setActiveGenomicAssociation]);

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

  if (!genomicAssociation) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Genomic association not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/genomic-associations">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Genomic Associations
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Dna className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Genomic Association #{genomicAssociation.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {genomicAssociation.odds_ratio !== null && genomicAssociation.odds_ratio !== undefined && (
                  <Badge variant="outline">OR: {genomicAssociation.odds_ratio}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Dna className="h-4 w-4" />
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
              <CardTitle>Genomic Association Details</CardTitle>
              <CardDescription>
                Basic information about this genomic association
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Variant</p>
                <p className="text-lg font-medium">{getVariantName(genomicAssociation.variant_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indication</p>
                <p className="text-lg font-medium">{getIndicationName(genomicAssociation.indication_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Odds Ratio</p>
                <p className="text-lg font-medium">{genomicAssociation.odds_ratio ?? '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(genomicAssociation.created_at).toLocaleDateString()}
                </p>
              </div>
              {genomicAssociation.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(genomicAssociation.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Genomic Association</CardTitle>
              <CardDescription>
                Update genomic association details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Variant — searchable combobox */}
                <div className="space-y-2">
                  <Label>Variant</Label>
                  <Popover open={variantPopoverOpen} onOpenChange={setVariantPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={variantPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editVariantId
                            ? variants.find(v => v.id.toString() === editVariantId)?.db_snp_id || 'Select variant'
                            : 'Select variant'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search variant..." />
                        <CommandList>
                          <CommandEmpty>No variants found.</CommandEmpty>
                          <CommandGroup>
                            {variants.map((v) => (
                              <CommandItem
                                key={v.id}
                                value={v.db_snp_id}
                                onSelect={() => {
                                  setEditVariantId(v.id.toString());
                                  setVariantPopoverOpen(false);
                                }}
                              >
                                {v.db_snp_id}
                                {editVariantId === v.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Indication — searchable combobox */}
                <div className="space-y-2">
                  <Label>Indication</Label>
                  <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={indicationPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editIndicationId
                            ? indications.find(i => i.id.toString() === editIndicationId)?.name || 'Select indication'
                            : 'Select indication'}
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="odds-ratio">Odds Ratio</Label>
                  <Input
                    id="odds-ratio"
                    type="number"
                    step="any"
                    value={editOddsRatio}
                    onChange={(e) => setEditOddsRatio(e.target.value)}
                    placeholder="e.g., 1.5"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedVariantId = parseInt(editVariantId, 10);
                  const parsedIndicationId = parseInt(editIndicationId, 10);
                  if (isNaN(parsedVariantId) || parsedVariantId <= 0) {
                    return;
                  }
                  if (isNaN(parsedIndicationId) || parsedIndicationId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateGenomicAssociation(genomicAssociationId, {
                      variant_id: parsedVariantId,
                      indication_id: parsedIndicationId,
                      odds_ratio: editOddsRatio ? parseFloat(editOddsRatio) : null,
                    });
                    if (success) {
                      await fetchGenomicAssociations();
                    }
                  } catch (error) {
                    console.error('Failed to update genomic association:', error);
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
                  <h4 className="font-medium">Delete this genomic association</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the genomic association from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-genomic-association">
                    Type <span className="font-semibold">{genomicAssociation.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-genomic-association"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== genomicAssociation.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteGenomicAssociation(genomicAssociationId);
                      if (success) {
                        router.push('/genomic-associations');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete genomic association:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== genomicAssociation.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Genomic Association
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
