'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBiologicalRelationships } from '@/modules/nexotype/hooks/knowledge_graph/use-biological-relationships';
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
import { Loader2, Link2, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function BiologicalRelationshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const biologicalRelationshipId = parseInt(params.id as string);
  const {
    biologicalRelationships,
    isLoading,
    error,
    setActiveBiologicalRelationship,
    fetchBiologicalRelationship,
    updateBiologicalRelationship,
    deleteBiologicalRelationship,
    fetchBiologicalRelationships
  } = useBiologicalRelationships();

  // Get referenced entities for FK resolution
  const { proteins } = useProteins();

  const listItem = biologicalRelationships.find(br => br.id === biologicalRelationshipId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const biologicalRelationship = listItem ?? fetchedItem ?? null;

  // Helper to resolve names from IDs
  const getProteinName = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // Settings state
  const [proteinAPopoverOpen, setProteinAPopoverOpen] = useState(false);
  const [proteinBPopoverOpen, setProteinBPopoverOpen] = useState(false);
  const [editProteinAId, setEditProteinAId] = useState('');
  const [editProteinBId, setEditProteinBId] = useState('');
  const [editInteractionType, setEditInteractionType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID when list item is missing (prevents false-404 on direct navigation)
  useEffect(() => {
    if (!listItem && biologicalRelationshipId && !isLoading) {
      fetchBiologicalRelationship(biologicalRelationshipId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, biologicalRelationshipId, isLoading, fetchBiologicalRelationship]);

  // Initialize edit form when biological relationship changes
  useEffect(() => {
    if (biologicalRelationship) {
      setEditProteinAId(biologicalRelationship.protein_a_id.toString());
      setEditProteinBId(biologicalRelationship.protein_b_id.toString());
      setEditInteractionType(biologicalRelationship.interaction_type);
    }
  }, [biologicalRelationship]);

  // Set active biological relationship when ID changes
  useEffect(() => {
    if (biologicalRelationshipId) {
      setActiveBiologicalRelationship(biologicalRelationshipId);
    }
  }, [biologicalRelationshipId, setActiveBiologicalRelationship]);

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

  if (!biologicalRelationship) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Biological relationship not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/biological-relationships">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Biological Relationships
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link2 className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Biological Relationship #{biologicalRelationship.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{biologicalRelationship.interaction_type}</Badge>
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
              <CardTitle>Biological Relationship Details</CardTitle>
              <CardDescription>
                Basic information about this biological relationship
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Protein A</p>
                <p className="text-lg font-medium">{getProteinName(biologicalRelationship.protein_a_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein B</p>
                <p className="text-lg font-medium">{getProteinName(biologicalRelationship.protein_b_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interaction Type</p>
                <p className="text-lg font-medium">{biologicalRelationship.interaction_type}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(biologicalRelationship.created_at).toLocaleDateString()}
                </p>
              </div>
              {biologicalRelationship.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(biologicalRelationship.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Biological Relationship</CardTitle>
              <CardDescription>
                Update biological relationship details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Protein A — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Protein A</Label>
                  <Popover open={proteinAPopoverOpen} onOpenChange={setProteinAPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={proteinAPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editProteinAId ? proteins.find(p => p.id.toString() === editProteinAId)?.uniprot_accession || 'Select protein' : 'Select protein'}
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
                              <CommandItem key={p.id} value={p.uniprot_accession} onSelect={() => { setEditProteinAId(p.id.toString()); setProteinAPopoverOpen(false); }}>
                                {p.uniprot_accession}
                                {editProteinAId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Protein B — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Protein B</Label>
                  <Popover open={proteinBPopoverOpen} onOpenChange={setProteinBPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={proteinBPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editProteinBId ? proteins.find(p => p.id.toString() === editProteinBId)?.uniprot_accession || 'Select protein' : 'Select protein'}
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
                              <CommandItem key={p.id} value={p.uniprot_accession} onSelect={() => { setEditProteinBId(p.id.toString()); setProteinBPopoverOpen(false); }}>
                                {p.uniprot_accession}
                                {editProteinBId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="interaction-type">Interaction Type</Label>
                  <Input
                    id="interaction-type"
                    value={editInteractionType}
                    onChange={(e) => setEditInteractionType(e.target.value)}
                    placeholder="e.g., binding"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedProteinAId = parseInt(editProteinAId, 10);
                  const parsedProteinBId = parseInt(editProteinBId, 10);
                  if (isNaN(parsedProteinAId) || parsedProteinAId <= 0) {
                    return;
                  }
                  if (isNaN(parsedProteinBId) || parsedProteinBId <= 0) {
                    return;
                  }
                  if (!editInteractionType.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateBiologicalRelationship(biologicalRelationshipId, {
                      protein_a_id: parsedProteinAId,
                      protein_b_id: parsedProteinBId,
                      interaction_type: editInteractionType.trim(),
                    });
                    if (success) {
                      await fetchBiologicalRelationships();
                    }
                  } catch (error) {
                    console.error('Failed to update biological relationship:', error);
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
                  <h4 className="font-medium">Delete this biological relationship</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the biological relationship from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-biological-relationship">
                    Type <span className="font-semibold">{biologicalRelationship.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-biological-relationship"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== biologicalRelationship.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteBiologicalRelationship(biologicalRelationshipId);
                      if (success) {
                        router.push('/biological-relationships');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete biological relationship:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== biologicalRelationship.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Biological Relationship
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
