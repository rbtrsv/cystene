'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEvidenceAssertions } from '@/modules/nexotype/hooks/knowledge_graph/use-evidence-assertions';
import { useSources } from '@/modules/nexotype/hooks/knowledge_graph/use-sources';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ShieldCheck, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function EvidenceAssertionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const evidenceAssertionId = parseInt(params.id as string);
  const {
    evidenceAssertions,
    isLoading,
    error,
    setActiveEvidenceAssertion,
    fetchEvidenceAssertion,
    updateEvidenceAssertion,
    deleteEvidenceAssertion,
    fetchEvidenceAssertions
  } = useEvidenceAssertions();
  const { sources } = useSources();

  // Resolve source FK to display name
  const getSourceName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = sources.find(s => s.id === id);
    return item ? item.external_id : `Source #${id}`;
  };

  const listItem = evidenceAssertions.find(ea => ea.id === evidenceAssertionId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const evidenceAssertion = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editRelationshipTable, setEditRelationshipTable] = useState('');
  const [editRelationshipId, setEditRelationshipId] = useState('');
  const [editSourceId, setEditSourceId] = useState('');
  const [editConfidenceScore, setEditConfidenceScore] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);

  // Fetch by ID when list item is missing (prevents false-404 on direct navigation)
  useEffect(() => {
    if (!listItem && evidenceAssertionId && !isLoading) {
      fetchEvidenceAssertion(evidenceAssertionId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, evidenceAssertionId, isLoading, fetchEvidenceAssertion]);

  // Initialize edit form when evidence assertion changes
  useEffect(() => {
    if (evidenceAssertion) {
      setEditRelationshipTable(evidenceAssertion.relationship_table);
      setEditRelationshipId(evidenceAssertion.relationship_id.toString());
      setEditSourceId(evidenceAssertion.source_id.toString());
      setEditConfidenceScore(evidenceAssertion.confidence_score.toString());
    }
  }, [evidenceAssertion]);

  // Set active evidence assertion when ID changes
  useEffect(() => {
    if (evidenceAssertionId) {
      setActiveEvidenceAssertion(evidenceAssertionId);
    }
  }, [evidenceAssertionId, setActiveEvidenceAssertion]);

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

  if (!evidenceAssertion) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Evidence assertion not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/evidence-assertions">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Evidence Assertions
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Evidence Assertion #{evidenceAssertion.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{evidenceAssertion.confidence_score.toFixed(2)}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <ShieldCheck className="h-4 w-4" />
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
              <CardTitle>Evidence Assertion Details</CardTitle>
              <CardDescription>
                Basic information about this evidence assertion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Relationship Table</p>
                <p className="text-lg font-medium">{evidenceAssertion.relationship_table}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relationship ID</p>
                <p className="text-lg font-medium">{evidenceAssertion.relationship_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-lg font-medium">{getSourceName(evidenceAssertion.source_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence Score</p>
                <p className="text-lg font-medium">{evidenceAssertion.confidence_score.toFixed(2)}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(evidenceAssertion.created_at).toLocaleDateString()}
                </p>
              </div>
              {evidenceAssertion.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(evidenceAssertion.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Evidence Assertion</CardTitle>
              <CardDescription>
                Update evidence assertion details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="relationship-table">Relationship Table</Label>
                  <Input
                    id="relationship-table"
                    value={editRelationshipTable}
                    onChange={(e) => setEditRelationshipTable(e.target.value)}
                    placeholder="e.g., biological_relationships"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship-id">Relationship ID</Label>
                  <Input
                    id="relationship-id"
                    type="number"
                    value={editRelationshipId}
                    onChange={(e) => setEditRelationshipId(e.target.value)}
                    placeholder="e.g., 1"
                  />
                </div>
                {/* Source — searchable combobox */}
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Popover open={sourcePopoverOpen} onOpenChange={setSourcePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={sourcePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editSourceId
                            ? sources.find(s => s.id.toString() === editSourceId)?.external_id || 'Select source'
                            : 'Select source'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search source..." />
                        <CommandList>
                          <CommandEmpty>No sources found.</CommandEmpty>
                          <CommandGroup>
                            {sources.map((s) => (
                              <CommandItem
                                key={s.id}
                                value={s.external_id}
                                onSelect={() => {
                                  setEditSourceId(s.id.toString());
                                  setSourcePopoverOpen(false);
                                }}
                              >
                                {s.external_id}
                                {editSourceId === s.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="confidence-score">Confidence Score</Label>
                  <Input
                    id="confidence-score"
                    type="number"
                    step="0.01"
                    value={editConfidenceScore}
                    onChange={(e) => setEditConfidenceScore(e.target.value)}
                    placeholder="e.g., 0.95"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editRelationshipTable.trim()) {
                    return;
                  }
                  const parsedRelationshipId = parseInt(editRelationshipId, 10);
                  const parsedSourceId = parseInt(editSourceId, 10);
                  const parsedConfidenceScore = parseFloat(editConfidenceScore);
                  if (isNaN(parsedRelationshipId) || parsedRelationshipId <= 0) {
                    return;
                  }
                  if (isNaN(parsedSourceId) || parsedSourceId <= 0) {
                    return;
                  }
                  if (isNaN(parsedConfidenceScore)) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateEvidenceAssertion(evidenceAssertionId, {
                      relationship_table: editRelationshipTable.trim(),
                      relationship_id: parsedRelationshipId,
                      source_id: parsedSourceId,
                      confidence_score: parsedConfidenceScore,
                    });
                    if (success) {
                      await fetchEvidenceAssertions();
                    }
                  } catch (error) {
                    console.error('Failed to update evidence assertion:', error);
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
                  <h4 className="font-medium">Delete this evidence assertion</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the evidence assertion from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-evidence-assertion">
                    Type <span className="font-semibold">{evidenceAssertion.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-evidence-assertion"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== evidenceAssertion.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteEvidenceAssertion(evidenceAssertionId);
                      if (success) {
                        router.push('/evidence-assertions');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete evidence assertion:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== evidenceAssertion.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Evidence Assertion
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
