'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePathwayMemberships } from '@/modules/nexotype/hooks/knowledge_graph/use-pathway-memberships';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Network, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function PathwayMembershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathwayMembershipId = parseInt(params.id as string);
  const {
    pathwayMemberships,
    isLoading,
    error,
    setActivePathwayMembership,
    fetchPathwayMembership,
    updatePathwayMembership,
    deletePathwayMembership,
    fetchPathwayMemberships
  } = usePathwayMemberships();

  // Get referenced entities for FK resolution
  const { proteins } = useProteins();
  const { pathways } = usePathways();

  const listItem = pathwayMemberships.find(pm => pm.id === pathwayMembershipId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const pathwayMembership = listItem ?? fetchedItem ?? null;

  // Helper to resolve names from IDs
  const getProteinName = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };
  const getPathwayName = (pathwayId: number) => {
    const pathway = pathways.find(pw => pw.id === pathwayId);
    return pathway ? pathway.name : `Pathway #${pathwayId}`;
  };

  // Settings state
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);
  const [editProteinId, setEditProteinId] = useState('');
  const [editPathwayId, setEditPathwayId] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this pathway membership
  useEffect(() => {
    if (!listItem && pathwayMembershipId && !isLoading) {
      fetchPathwayMembership(pathwayMembershipId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, pathwayMembershipId, isLoading, fetchPathwayMembership]);

  // Initialize edit form when pathway membership changes
  useEffect(() => {
    if (pathwayMembership) {
      setEditProteinId(pathwayMembership.protein_id.toString());
      setEditPathwayId(pathwayMembership.pathway_id.toString());
      setEditRole(pathwayMembership.role || '');
    }
  }, [pathwayMembership]);

  // Set active pathway membership when ID changes
  useEffect(() => {
    if (pathwayMembershipId) {
      setActivePathwayMembership(pathwayMembershipId);
    }
  }, [pathwayMembershipId, setActivePathwayMembership]);

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

  if (!pathwayMembership) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Pathway membership not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/pathway-memberships">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Pathway Memberships
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pathway Membership #{pathwayMembership.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {pathwayMembership.role && <Badge variant="outline">{pathwayMembership.role}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Network className="h-4 w-4" />
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
              <CardTitle>Pathway Membership Details</CardTitle>
              <CardDescription>
                Basic information about this pathway membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-lg font-medium">{getProteinName(pathwayMembership.protein_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pathway</p>
                <p className="text-lg font-medium">{getPathwayName(pathwayMembership.pathway_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-lg font-medium">{pathwayMembership.role || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(pathwayMembership.created_at).toLocaleDateString()}
                </p>
              </div>
              {pathwayMembership.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(pathwayMembership.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Pathway Membership</CardTitle>
              <CardDescription>
                Update pathway membership details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Protein — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Protein</Label>
                  <Popover open={proteinPopoverOpen} onOpenChange={setProteinPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={proteinPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editProteinId ? proteins.find(p => p.id.toString() === editProteinId)?.uniprot_accession || 'Select protein' : 'Select protein'}
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
                              <CommandItem key={p.id} value={p.uniprot_accession} onSelect={() => { setEditProteinId(p.id.toString()); setProteinPopoverOpen(false); }}>
                                {p.uniprot_accession}
                                {editProteinId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Pathway — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Pathway</Label>
                  <Popover open={pathwayPopoverOpen} onOpenChange={setPathwayPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={pathwayPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editPathwayId ? pathways.find(pw => pw.id.toString() === editPathwayId)?.name || 'Select pathway' : 'Select pathway'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search pathway..." />
                        <CommandList>
                          <CommandEmpty>No pathways found.</CommandEmpty>
                          <CommandGroup>
                            {pathways.map((pw) => (
                              <CommandItem key={pw.id} value={pw.name} onSelect={() => { setEditPathwayId(pw.id.toString()); setPathwayPopoverOpen(false); }}>
                                {pw.name}
                                {editPathwayId === pw.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    placeholder="e.g., kinase"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedProteinId = parseInt(editProteinId, 10);
                  const parsedPathwayId = parseInt(editPathwayId, 10);
                  if (isNaN(parsedProteinId) || parsedProteinId <= 0) {
                    return;
                  }
                  if (isNaN(parsedPathwayId) || parsedPathwayId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePathwayMembership(pathwayMembershipId, {
                      protein_id: parsedProteinId,
                      pathway_id: parsedPathwayId,
                      role: editRole.trim() || undefined,
                    });
                    if (success) {
                      await fetchPathwayMemberships();
                    }
                  } catch (error) {
                    console.error('Failed to update pathway membership:', error);
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
                  <h4 className="font-medium">Delete this pathway membership</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the pathway membership from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-pathway-membership">
                    Type <span className="font-semibold">{pathwayMembership.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-pathway-membership"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== pathwayMembership.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePathwayMembership(pathwayMembershipId);
                      if (success) {
                        router.push('/pathway-memberships');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete pathway membership:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== pathwayMembership.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Pathway Membership
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
