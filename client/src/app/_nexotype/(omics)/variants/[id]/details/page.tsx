'use client';

import { useParams, useRouter } from 'next/navigation';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
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

export default function VariantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const variantId = parseInt(params.id as string);
  const {
    variants,
    isLoading,
    error,
    setActiveVariant,
    fetchVariant,
    updateVariant,
    deleteVariant,
    fetchVariants
  } = useVariants();

  // Get genes for resolving gene_id to name and for the edit selector
  const { genes } = useGenes();

  const listItem = variants.find(v => v.id === variantId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const variant = listItem ?? fetchedItem ?? null;

  // Fetch by ID when the list doesn't contain this variant (prevents false-404)
  useEffect(() => {
    if (!listItem && variantId && !isLoading) {
      fetchVariant(variantId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, variantId, isLoading, fetchVariant]);

  // Helper to resolve gene name from ID
  const getGeneName = (geneId: number) => {
    const gene = genes.find(g => g.id === geneId);
    return gene ? gene.hgnc_symbol : `Gene #${geneId}`;
  };

  // Settings state
  const [genePopoverOpen, setGenePopoverOpen] = useState(false);
  const [editGeneId, setEditGeneId] = useState('');
  const [editDbSnpId, setEditDbSnpId] = useState('');
  const [editHgvsC, setEditHgvsC] = useState('');
  const [editHgvsP, setEditHgvsP] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when variant changes
  useEffect(() => {
    if (variant) {
      setEditGeneId(variant.gene_id.toString());
      setEditDbSnpId(variant.db_snp_id);
      setEditHgvsC(variant.hgvs_c || '');
      setEditHgvsP(variant.hgvs_p || '');
    }
  }, [variant]);

  // Set active variant when ID changes
  useEffect(() => {
    if (variantId) {
      setActiveVariant(variantId);
    }
  }, [variantId, setActiveVariant]);

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

  if (!variant) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Variant not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/variants">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Variants
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <GitBranch className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{variant.db_snp_id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{getGeneName(variant.gene_id)}</Badge>
                {variant.hgvs_c && <Badge variant="secondary">{variant.hgvs_c}</Badge>}
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

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variant Details</CardTitle>
              <CardDescription>
                Basic information about this variant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">dbSNP ID</p>
                <p className="text-lg font-medium">{variant.db_snp_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gene</p>
                <p className="text-lg font-medium">{getGeneName(variant.gene_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">HGVS c. (DNA Change)</p>
                <p className="text-lg font-medium">{variant.hgvs_c || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">HGVS p. (Protein Change)</p>
                <p className="text-lg font-medium">{variant.hgvs_p || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(variant.created_at).toLocaleDateString()}
                </p>
              </div>
              {variant.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(variant.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Variant</CardTitle>
              <CardDescription>
                Update variant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="gene-id">Gene</Label>
                  <Popover open={genePopoverOpen} onOpenChange={setGenePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={genePopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {editGeneId
                            ? genes.find(g => g.id.toString() === editGeneId)?.hgnc_symbol || 'Select gene'
                            : 'Select gene'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search gene..." />
                        <CommandList>
                          <CommandEmpty>No genes found.</CommandEmpty>
                          <CommandGroup>
                            {genes.map((gene) => (
                              <CommandItem
                                key={gene.id}
                                value={`${gene.hgnc_symbol} ${gene.ensembl_gene_id}`}
                                onSelect={() => {
                                  setEditGeneId(gene.id.toString());
                                  setGenePopoverOpen(false);
                                }}
                              >
                                {gene.hgnc_symbol} ({gene.ensembl_gene_id})
                                {editGeneId === gene.id.toString() && (
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
                <div className="space-y-2">
                  <Label htmlFor="db-snp-id">dbSNP ID</Label>
                  <Input
                    id="db-snp-id"
                    value={editDbSnpId}
                    onChange={(e) => setEditDbSnpId(e.target.value)}
                    placeholder="e.g., rs429358"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hgvs-c">HGVS c. (DNA Change)</Label>
                  <Input
                    id="hgvs-c"
                    value={editHgvsC}
                    onChange={(e) => setEditHgvsC(e.target.value)}
                    placeholder="e.g., c.123A>G"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hgvs-p">HGVS p. (Protein Change)</Label>
                  <Input
                    id="hgvs-p"
                    value={editHgvsP}
                    onChange={(e) => setEditHgvsP(e.target.value)}
                    placeholder="e.g., p.Arg123Cys"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editDbSnpId.trim()) {
                    return;
                  }
                  const parsedGeneId = parseInt(editGeneId, 10);
                  if (isNaN(parsedGeneId) || parsedGeneId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateVariant(variantId, {
                      gene_id: parsedGeneId,
                      db_snp_id: editDbSnpId.trim(),
                      hgvs_c: editHgvsC.trim() || undefined,
                      hgvs_p: editHgvsP.trim() || undefined,
                    });
                    if (success) {
                      await fetchVariants();
                    }
                  } catch (error) {
                    console.error('Failed to update variant:', error);
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
                  <h4 className="font-medium">Delete this variant</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the variant from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-variant">
                    Type <span className="font-semibold">{variant.db_snp_id}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-variant"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="dbSNP ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== variant.db_snp_id) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteVariant(variantId);
                      if (success) {
                        router.push('/variants');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete variant:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== variant.db_snp_id}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Variant
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
