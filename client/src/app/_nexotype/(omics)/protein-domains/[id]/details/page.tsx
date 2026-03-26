'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProteinDomains } from '@/modules/nexotype/hooks/omics/use-protein-domains';
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
import { Loader2, Puzzle, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProteinDomainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proteinDomainId = parseInt(params.id as string);
  const {
    proteinDomains,
    isLoading,
    error,
    setActiveProteinDomain,
    fetchProteinDomain,
    updateProteinDomain,
    deleteProteinDomain,
    fetchProteinDomains
  } = useProteinDomains();

  // Get proteins for resolving protein_id to name and for the edit selector
  const { proteins } = useProteins();

  const listItem = proteinDomains.find(pd => pd.id === proteinDomainId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const domain = listItem ?? fetchedItem ?? null;

  // Fetch by ID when the list doesn't contain this protein domain (prevents false-404)
  useEffect(() => {
    if (!listItem && proteinDomainId && !isLoading) {
      fetchProteinDomain(proteinDomainId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, proteinDomainId, isLoading, fetchProteinDomain]);

  // Helper to resolve protein name from ID
  const getProteinName = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // Settings state
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);
  const [editProteinId, setEditProteinId] = useState('');
  const [editPfamId, setEditPfamId] = useState('');
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when domain changes
  useEffect(() => {
    if (domain) {
      setEditProteinId(domain.protein_id.toString());
      setEditPfamId(domain.pfam_id);
      setEditName(domain.name);
    }
  }, [domain]);

  // Set active protein domain when ID changes
  useEffect(() => {
    if (proteinDomainId) {
      setActiveProteinDomain(proteinDomainId);
    }
  }, [proteinDomainId, setActiveProteinDomain]);

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

  if (!domain) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Protein domain not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/protein-domains">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Protein Domains
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Puzzle className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{domain.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getProteinName(domain.protein_id)}</Badge>
                <Badge variant="outline">{domain.pfam_id}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Puzzle className="h-4 w-4" />
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
              <CardTitle>Protein Domain Details</CardTitle>
              <CardDescription>
                Basic information about this protein domain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{domain.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pfam ID</p>
                <p className="text-lg font-medium">{domain.pfam_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-lg font-medium">{getProteinName(domain.protein_id)}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(domain.created_at).toLocaleDateString()}
                </p>
              </div>
              {domain.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(domain.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Protein Domain</CardTitle>
              <CardDescription>
                Update protein domain details
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
                <div className="space-y-2">
                  <Label htmlFor="pfam-id">Pfam ID</Label>
                  <Input
                    id="pfam-id"
                    value={editPfamId}
                    onChange={(e) => setEditPfamId(e.target.value)}
                    placeholder="e.g., PF00069"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain-name">Name</Label>
                  <Input
                    id="domain-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Kinase Domain"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editPfamId.trim() || !editName.trim()) {
                    return;
                  }
                  const parsedProteinId = parseInt(editProteinId, 10);
                  if (isNaN(parsedProteinId) || parsedProteinId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateProteinDomain(proteinDomainId, {
                      protein_id: parsedProteinId,
                      pfam_id: editPfamId.trim(),
                      name: editName.trim(),
                    });
                    if (success) {
                      await fetchProteinDomains();
                    }
                  } catch (error) {
                    console.error('Failed to update protein domain:', error);
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
                  <h4 className="font-medium">Delete this protein domain</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the protein domain from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-domain">
                    Type <span className="font-semibold">{domain.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-domain"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Domain name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== domain.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteProteinDomain(proteinDomainId);
                      if (success) {
                        router.push('/protein-domains');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete protein domain:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== domain.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Protein Domain
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
