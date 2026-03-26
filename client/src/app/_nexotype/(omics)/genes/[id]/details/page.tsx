'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
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

export default function GeneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const geneId = parseInt(params.id as string);
  const {
    genes,
    isLoading,
    error,
    setActiveGene,
    fetchGene,
    updateGene,
    deleteGene,
    fetchGenes
  } = useGenes();

  // Get organisms for resolving organism_id to name and for the edit selector
  const { organisms } = useOrganisms();

  const listItem = genes.find(g => g.id === geneId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const gene = listItem ?? fetchedItem ?? null;

  // Fetch by ID fallback when list doesn't contain the item (prevents false-404)
  useEffect(() => {
    if (!listItem && geneId && !isLoading) {
      fetchGene(geneId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, geneId, isLoading, fetchGene]);

  // Helper to resolve organism name from ID
  const getOrganismName = (organismId: number) => {
    const organism = organisms.find(o => o.id === organismId);
    return organism ? organism.scientific_name : `Organism #${organismId}`;
  };

  // Settings state
  const [editOrganismId, setEditOrganismId] = useState('');
  const [organismPopoverOpen, setOrganismPopoverOpen] = useState(false);
  const [editHgncSymbol, setEditHgncSymbol] = useState('');
  const [editEnsemblGeneId, setEditEnsemblGeneId] = useState('');
  const [editChromosome, setEditChromosome] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when gene changes
  useEffect(() => {
    if (gene) {
      setEditOrganismId(gene.organism_id.toString());
      setEditHgncSymbol(gene.hgnc_symbol);
      setEditEnsemblGeneId(gene.ensembl_gene_id);
      setEditChromosome(gene.chromosome);
    }
  }, [gene]);

  // Set active gene when ID changes
  useEffect(() => {
    if (geneId) {
      setActiveGene(geneId);
    }
  }, [geneId, setActiveGene]);

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

  if (!gene) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Gene not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <div>
          <Link href="/genes">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Genes
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Dna className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-2xl sm:text-3xl font-bold tracking-tight">{gene.hgnc_symbol}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{gene.ensembl_gene_id}</Badge>
                <Badge variant="secondary">Chr {gene.chromosome}</Badge>
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

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gene Details</CardTitle>
              <CardDescription>
                Basic information about this gene
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">HGNC Symbol</p>
                <p className="text-lg font-medium">{gene.hgnc_symbol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ensembl Gene ID</p>
                <p className="text-lg font-medium">{gene.ensembl_gene_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chromosome</p>
                <p className="text-lg font-medium">{gene.chromosome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Organism</p>
                <p className="text-lg font-medium">{getOrganismName(gene.organism_id)}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(gene.created_at).toLocaleDateString()}
                </p>
              </div>
              {gene.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(gene.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Gene</CardTitle>
              <CardDescription>
                Update gene details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Organism — searchable combobox */}
              <div className="space-y-2">
                <Label>Organism</Label>
                <Popover open={organismPopoverOpen} onOpenChange={setOrganismPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={organismPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {editOrganismId
                          ? organisms.find((o) => o.id.toString() === editOrganismId)?.scientific_name || 'Select organism'
                          : 'Select organism'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search organism..." />
                      <CommandList>
                        <CommandEmpty>No organisms found.</CommandEmpty>
                        <CommandGroup>
                          {organisms.map((org) => (
                            <CommandItem
                              key={org.id}
                              value={`${org.scientific_name} ${org.common_name}`}
                              onSelect={() => {
                                setEditOrganismId(org.id.toString());
                                setOrganismPopoverOpen(false);
                              }}
                            >
                              {org.scientific_name} ({org.common_name})
                              {editOrganismId === org.id.toString() && (
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
                  <Label htmlFor="hgnc-symbol">HGNC Symbol</Label>
                  <Input
                    id="hgnc-symbol"
                    value={editHgncSymbol}
                    onChange={(e) => setEditHgncSymbol(e.target.value)}
                    placeholder="e.g., TP53"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ensembl-gene-id">Ensembl Gene ID</Label>
                  <Input
                    id="ensembl-gene-id"
                    value={editEnsemblGeneId}
                    onChange={(e) => setEditEnsemblGeneId(e.target.value)}
                    placeholder="e.g., ENSG00000141510"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chromosome">Chromosome</Label>
                  <Input
                    id="chromosome"
                    value={editChromosome}
                    onChange={(e) => setEditChromosome(e.target.value)}
                    placeholder="e.g., 17"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editHgncSymbol.trim() || !editEnsemblGeneId.trim() || !editChromosome.trim()) {
                    return;
                  }
                  const parsedOrganismId = parseInt(editOrganismId, 10);
                  if (isNaN(parsedOrganismId) || parsedOrganismId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateGene(geneId, {
                      organism_id: parsedOrganismId,
                      hgnc_symbol: editHgncSymbol.trim(),
                      ensembl_gene_id: editEnsemblGeneId.trim(),
                      chromosome: editChromosome.trim(),
                    });
                    if (success) { await fetchGenes(); }
                  } catch (error) {
                    console.error('Failed to update gene:', error);
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
                  <h4 className="font-medium">Delete this gene</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the gene from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-gene">
                    Type <span className="font-semibold">{gene.hgnc_symbol}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-gene"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="HGNC Symbol"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== gene.hgnc_symbol) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteGene(geneId);
                      if (success) { router.push('/genes'); } else { setIsDeleting(false); }
                    } catch (error) {
                      console.error('Failed to delete gene:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== gene.hgnc_symbol}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Gene
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
