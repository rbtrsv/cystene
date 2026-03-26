'use client';

import { useParams, useRouter } from 'next/navigation';
import { useVariantPhenotypes } from '@/modules/nexotype/hooks/knowledge_graph/use-variant-phenotypes';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, GitBranch, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function VariantPhenotypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const variantPhenotypeId = parseInt(params.id as string);
  const {
    variantPhenotypes,
    isLoading,
    error,
    setActiveVariantPhenotype,
    fetchVariantPhenotype,
    updateVariantPhenotype,
    deleteVariantPhenotype,
    fetchVariantPhenotypes
  } = useVariantPhenotypes();
  const { variants } = useVariants();
  const { phenotypes } = usePhenotypes();

  // Resolve FK IDs to display names
  const getVariantName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = variants.find(v => v.id === id);
    return item ? item.db_snp_id : `Variant #${id}`;
  };
  const getPhenotypeName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = phenotypes.find(p => p.id === id);
    return item ? item.name : `Phenotype #${id}`;
  };

  const listItem = variantPhenotypes.find(vp => vp.id === variantPhenotypeId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const variantPhenotype = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editVariantId, setEditVariantId] = useState('');
  const [editPhenotypeId, setEditPhenotypeId] = useState('');
  const [editEffectSize, setEditEffectSize] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this variant phenotype
  useEffect(() => {
    if (!listItem && variantPhenotypeId && !isLoading) {
      fetchVariantPhenotype(variantPhenotypeId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, variantPhenotypeId, isLoading, fetchVariantPhenotype]);

  // Initialize edit form when variant phenotype changes
  useEffect(() => {
    if (variantPhenotype) {
      setEditVariantId(variantPhenotype.variant_id.toString());
      setEditPhenotypeId(variantPhenotype.phenotype_id.toString());
      setEditEffectSize(variantPhenotype.effect_size || '');
    }
  }, [variantPhenotype]);

  // Set active variant phenotype when ID changes
  useEffect(() => {
    if (variantPhenotypeId) {
      setActiveVariantPhenotype(variantPhenotypeId);
    }
  }, [variantPhenotypeId, setActiveVariantPhenotype]);

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

  if (!variantPhenotype) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Variant phenotype not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/variant-phenotypes">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Variant Phenotypes
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <GitBranch className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Variant Phenotype #{variantPhenotype.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {variantPhenotype.effect_size && <Badge variant="outline">{variantPhenotype.effect_size}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <GitBranch className="h-4 w-4" />
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
              <CardTitle>Variant Phenotype Details</CardTitle>
              <CardDescription>
                Basic information about this variant phenotype
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Variant</p>
                <p className="text-lg font-medium">{getVariantName(variantPhenotype.variant_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phenotype</p>
                <p className="text-lg font-medium">{getPhenotypeName(variantPhenotype.phenotype_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effect Size</p>
                <p className="text-lg font-medium">{variantPhenotype.effect_size ?? '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(variantPhenotype.created_at).toLocaleDateString()}
                </p>
              </div>
              {variantPhenotype.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(variantPhenotype.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Variant Phenotype</CardTitle>
              <CardDescription>
                Update variant phenotype details
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
                {/* Phenotype — searchable combobox */}
                <div className="space-y-2">
                  <Label>Phenotype</Label>
                  <Popover open={phenotypePopoverOpen} onOpenChange={setPhenotypePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={phenotypePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editPhenotypeId
                            ? phenotypes.find(p => p.id.toString() === editPhenotypeId)?.name || 'Select phenotype'
                            : 'Select phenotype'}
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="effect-size">Effect Size</Label>
                  <Input
                    id="effect-size"
                    value={editEffectSize}
                    onChange={(e) => setEditEffectSize(e.target.value)}
                    placeholder="e.g., large"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedVariantId = parseInt(editVariantId, 10);
                  const parsedPhenotypeId = parseInt(editPhenotypeId, 10);
                  if (isNaN(parsedVariantId) || parsedVariantId <= 0) {
                    return;
                  }
                  if (isNaN(parsedPhenotypeId) || parsedPhenotypeId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateVariantPhenotype(variantPhenotypeId, {
                      variant_id: parsedVariantId,
                      phenotype_id: parsedPhenotypeId,
                      effect_size: editEffectSize.trim() || null,
                    });
                    if (success) {
                      await fetchVariantPhenotypes();
                    }
                  } catch (error) {
                    console.error('Failed to update variant phenotype:', error);
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
                  <h4 className="font-medium">Delete this variant phenotype</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the variant phenotype from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-variant-phenotype">
                    Type <span className="font-semibold">{variantPhenotype.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-variant-phenotype"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== variantPhenotype.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteVariantPhenotype(variantPhenotypeId);
                      if (success) {
                        router.push('/variant-phenotypes');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete variant phenotype:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== variantPhenotype.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Variant Phenotype
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
