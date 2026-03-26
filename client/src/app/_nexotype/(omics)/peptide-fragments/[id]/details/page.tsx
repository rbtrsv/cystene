'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePeptideFragments } from '@/modules/nexotype/hooks/omics/use-peptide-fragments';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Scissors, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PeptideFragmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fragmentId = parseInt(params.id as string);
  const {
    peptideFragments,
    isLoading,
    error,
    setActivePeptideFragment,
    fetchPeptideFragment,
    updatePeptideFragment,
    deletePeptideFragment,
    fetchPeptideFragments
  } = usePeptideFragments();

  // Get proteins for resolving protein_id to accession and for the edit selector
  const { proteins } = useProteins();

  const listItem = peptideFragments.find(f => f.id === fragmentId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const fragment = listItem ?? fetchedItem ?? null;

  // Fetch by ID when the list doesn't contain this peptide fragment (prevents false-404)
  useEffect(() => {
    if (!listItem && fragmentId && !isLoading) {
      fetchPeptideFragment(fragmentId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, fragmentId, isLoading, fetchPeptideFragment]);

  // Helper to resolve protein accession from ID
  const getProteinAccession = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // Settings state
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);
  const [editProteinId, setEditProteinId] = useState('');
  const [editSequence, setEditSequence] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when fragment changes
  useEffect(() => {
    if (fragment) {
      setEditProteinId(fragment.protein_id.toString());
      setEditSequence(fragment.sequence);
    }
  }, [fragment]);

  // Set active peptide fragment when ID changes
  useEffect(() => {
    if (fragmentId) {
      setActivePeptideFragment(fragmentId);
    }
  }, [fragmentId, setActivePeptideFragment]);

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

  if (!fragment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Peptide fragment not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/peptide-fragments">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Peptide Fragments
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Scissors className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">{fragment.sequence}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{getProteinAccession(fragment.protein_id)}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Scissors className="h-4 w-4" />
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
              <CardTitle>Peptide Fragment Details</CardTitle>
              <CardDescription>
                Basic information about this peptide fragment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Sequence</p>
                <p className="text-lg font-mono font-medium">{fragment.sequence}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-lg font-medium">{getProteinAccession(fragment.protein_id)}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(fragment.created_at).toLocaleDateString()}
                </p>
              </div>
              {fragment.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(fragment.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Peptide Fragment</CardTitle>
              <CardDescription>
                Update peptide fragment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="protein-id">Protein</Label>
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
                            {proteins.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.uniprot_accession}
                                onSelect={() => {
                                  setEditProteinId(p.id.toString());
                                  setProteinPopoverOpen(false);
                                }}
                              >
                                {p.uniprot_accession}
                                {editProteinId === p.id.toString() && (
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sequence">Sequence</Label>
                  <Input
                    id="sequence"
                    value={editSequence}
                    onChange={(e) => setEditSequence(e.target.value)}
                    placeholder="e.g., LVVVLAGR"
                    className="font-mono"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editSequence.trim()) {
                    return;
                  }
                  const parsedProteinId = parseInt(editProteinId, 10);
                  if (isNaN(parsedProteinId) || parsedProteinId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePeptideFragment(fragmentId, {
                      protein_id: parsedProteinId,
                      sequence: editSequence.trim(),
                    });
                    if (success) {
                      await fetchPeptideFragments();
                    }
                  } catch (error) {
                    console.error('Failed to update peptide fragment:', error);
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
                  <h4 className="font-medium">Delete this peptide fragment</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the peptide fragment from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-fragment">
                    Type <span className="font-semibold font-mono">{fragment.sequence}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-fragment"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Sequence"
                    className="font-mono"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== fragment.sequence) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePeptideFragment(fragmentId);
                      if (success) {
                        router.push('/peptide-fragments');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete peptide fragment:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== fragment.sequence}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Peptide Fragment
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
