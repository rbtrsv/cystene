'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, Scissors, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useDesignMutations } from '@/modules/nexotype/hooks/engineering/use-design-mutations';
import { useCandidates } from '@/modules/nexotype/hooks/engineering/use-candidates';
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
export default function DesignMutationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const designMutationId = parseInt(params.id as string, 10);
  const {
    designMutations,
    isLoading,
    error,
    setActiveDesignMutation,
    fetchDesignMutation,
    updateDesignMutation,
    deleteDesignMutation,
    fetchDesignMutations
  } = useDesignMutations();

  const listItem = designMutations.find((x) => x.id === designMutationId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  // Get candidates for resolving candidate_id to version_number
  const { candidates: candidatesList } = useCandidates();

  const [candidatePopoverOpen, setCandidatePopoverOpen] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [position, setPosition] = useState('');
  const [wildType, setWildType] = useState('');
  const [mutant, setMutant] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!listItem && designMutationId && !isLoading) {
      fetchDesignMutation(designMutationId).then((res) => {
        if (res) setFetchedItem(res);
      });
    }
  }, [listItem, designMutationId, isLoading, fetchDesignMutation]);

  useEffect(() => {
    if (!item) return;
    setCandidateId(String(item.candidate_id));
    setPosition(String(item.position));
    setWildType(item.wild_type);
    setMutant(item.mutant);
  }, [item]);

  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (designMutationId) {
      setActiveDesignMutation(designMutationId);
    }
  }, [designMutationId, setActiveDesignMutation]);

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
        <AlertDescription>Design mutation not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/design-mutations">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Design Mutations
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Scissors className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Design Mutation #{item.id}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{item.wild_type}{item.position}{item.mutant}</Badge>
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

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Design Mutation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Candidate ID</p>
                <p className="text-lg font-medium">{item.candidate_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="text-lg font-medium">{item.position}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wild Type</p>
                <p className="text-lg font-medium">{item.wild_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mutant</p>
                <p className="text-lg font-medium">{item.mutant}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Design Mutation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Candidate — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Candidate</Label>
                  <Popover open={candidatePopoverOpen} onOpenChange={setCandidatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={candidatePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {candidateId
                            ? candidatesList.find(c => c.id.toString() === candidateId)?.version_number || 'Select candidate'
                            : 'Select candidate'}
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
                            {candidatesList.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.version_number} #${c.id}`}
                                onSelect={() => {
                                  setCandidateId(c.id.toString());
                                  setCandidatePopoverOpen(false);
                                }}
                              >
                                {c.version_number} (#{c.id})
                                {candidateId === c.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    type="number"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wild-type">Wild Type</Label>
                  <Input
                    id="wild-type"
                    value={wildType}
                    onChange={(e) => setWildType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mutant">Mutant</Label>
                  <Input
                    id="mutant"
                    value={mutant}
                    onChange={(e) => setMutant(e.target.value)}
                  />
                </div>
              </div>
              <Button
                disabled={isUpdating}
                onClick={async () => {
                  const c = parseInt(candidateId, 10);
                  const p = parseInt(position, 10);
                  if (Number.isNaN(c) || Number.isNaN(p) || !wildType.trim() || !mutant.trim()) return;
                  setIsUpdating(true);
                  try {
                    const ok = await updateDesignMutation(designMutationId, {
                      candidate_id: c,
                      position: p,
                      wild_type: wildType.trim(),
                      mutant: mutant.trim(),
                    });
                    if (ok) await fetchDesignMutations();
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
                This will remove the design mutation from active use. The record will be soft-deleted.
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
                    const ok = await deleteDesignMutation(designMutationId);
                    if (ok) router.push('/design-mutations');
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
                    Delete Design Mutation
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
