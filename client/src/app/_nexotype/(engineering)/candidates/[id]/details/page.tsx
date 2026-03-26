'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, GitBranch, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useCandidates } from '@/modules/nexotype/hooks/engineering/use-candidates';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = parseInt(params.id as string, 10);
  const {
    candidates,
    isLoading,
    error,
    setActiveCandidate,
    fetchCandidate,
    updateCandidate,
    deleteCandidate,
    fetchCandidates
  } = useCandidates();

  // Get therapeutic assets for resolving asset_id to name
  const { therapeuticAssets } = useTherapeuticAssets();

  const listItem = candidates.find((x) => x.id === candidateId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [versionNumber, setVersionNumber] = useState('');
  const [parentId, setParentId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && candidateId && !isLoading) {
      fetchCandidate(candidateId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, candidateId, isLoading, fetchCandidate]);

  useEffect(() => {
    if (!item) return;
    setAssetId(String(item.asset_id));
    setVersionNumber(item.version_number);
    setParentId(item.parent_candidate_id == null ? '' : String(item.parent_candidate_id));
  }, [item]);

  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (candidateId) {
      setActiveCandidate(candidateId);
    }
  }, [candidateId, setActiveCandidate]);

  // Guard: loading state.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guard: error state.
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Candidate not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/candidates">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Candidates
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <GitBranch className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Candidate #{item.id}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{item.version_number}</Badge>
              {item.parent_candidate_id != null && (
                <Badge variant="secondary">Parent {item.parent_candidate_id}</Badge>
              )}
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

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Asset ID</p>
                <p className="text-lg font-medium">{item.asset_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Version Number</p>
                <p className="text-lg font-medium">{item.version_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Candidate ID</p>
                <p className="text-lg font-medium">{item.parent_candidate_id ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Candidate</CardTitle>
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
                          {assetId
                            ? therapeuticAssets.find(a => a.id.toString() === assetId)?.name || 'Select asset'
                            : 'Select asset'}
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
                              <CommandItem
                                key={a.id}
                                value={a.name}
                                onSelect={() => {
                                  setAssetId(a.id.toString());
                                  setAssetPopoverOpen(false);
                                }}
                              >
                                {a.name}
                                {assetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version Number</Label>
                  <Input
                    id="version"
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                  />
                </div>
                {/* Parent Candidate — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Parent Candidate</Label>
                  <Popover open={parentPopoverOpen} onOpenChange={setParentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={parentPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {parentId
                            ? candidates.find(c => c.id.toString() === parentId)?.version_number || 'Select parent'
                            : '— None —'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search candidate..." />
                        <CommandList>
                          <CommandEmpty>No candidates found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                setParentId('');
                                setParentPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!parentId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {candidates.filter(c => c.id !== candidateId).map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.version_number} #${c.id}`}
                                onSelect={() => {
                                  setParentId(c.id.toString());
                                  setParentPopoverOpen(false);
                                }}
                              >
                                {c.version_number} (#{c.id})
                                {parentId === c.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button
                disabled={isUpdating}
                onClick={async () => {
                  const parsedAssetId = parseInt(assetId, 10);
                  if (Number.isNaN(parsedAssetId) || !versionNumber.trim()) return;
                  setIsUpdating(true);
                  try {
                    const ok = await updateCandidate(candidateId, {
                      asset_id: parsedAssetId,
                      version_number: versionNumber.trim(),
                      parent_candidate_id: parentId ? parseInt(parentId, 10) : null,
                    });
                    if (ok) await fetchCandidates();
                  } finally {
                    setIsUpdating(false);
                  }
                }}
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

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will remove the candidate from active use. The record will be soft-deleted.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">Type {item.id} to confirm</Label>
                <Input
                  id="confirm-delete"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                disabled={isDeleting || confirm !== String(item.id)}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const ok = await deleteCandidate(candidateId);
                    if (ok) router.push('/candidates');
                    else setIsDeleting(false);
                  } catch {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Candidate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
