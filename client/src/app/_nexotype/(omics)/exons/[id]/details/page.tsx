'use client';

import { useParams, useRouter } from 'next/navigation';
import { useExons } from '@/modules/nexotype/hooks/omics/use-exons';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Brackets, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ExonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const exonId = parseInt(params.id as string);
  const {
    exons,
    isLoading,
    error,
    setActiveExon,
    fetchExon,
    updateExon,
    deleteExon,
    fetchExons
  } = useExons();

  // Get transcripts for resolving transcript_id to name and for the edit selector
  const { transcripts } = useTranscripts();

  const listItem = exons.find(e => e.id === exonId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const exon = listItem ?? fetchedItem ?? null;

  // Fetch by ID fallback when list doesn't contain the item (prevents false-404)
  useEffect(() => {
    if (!listItem && exonId && !isLoading) {
      fetchExon(exonId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, exonId, isLoading, fetchExon]);

  // Helper to resolve transcript name from ID
  const getTranscriptName = (transcriptId: number) => {
    const transcript = transcripts.find(t => t.id === transcriptId);
    return transcript ? transcript.ensembl_transcript_id : `Transcript #${transcriptId}`;
  };

  // Settings state
  const [transcriptPopoverOpen, setTranscriptPopoverOpen] = useState(false);
  const [editTranscriptId, setEditTranscriptId] = useState('');
  const [editEnsemblExonId, setEditEnsemblExonId] = useState('');
  const [editStartPosition, setEditStartPosition] = useState('');
  const [editEndPosition, setEditEndPosition] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when exon changes
  useEffect(() => {
    if (exon) {
      setEditTranscriptId(exon.transcript_id.toString());
      setEditEnsemblExonId(exon.ensembl_exon_id);
      setEditStartPosition(exon.start_position.toString());
      setEditEndPosition(exon.end_position.toString());
    }
  }, [exon]);

  // Set active exon when ID changes
  useEffect(() => {
    if (exonId) {
      setActiveExon(exonId);
    }
  }, [exonId, setActiveExon]);

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

  if (!exon) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Exon not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/exons">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Exons
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Brackets className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{exon.ensembl_exon_id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getTranscriptName(exon.transcript_id)}</Badge>
                <Badge variant="outline">{exon.start_position.toLocaleString()} - {exon.end_position.toLocaleString()}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Brackets className="h-4 w-4" />
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
              <CardTitle>Exon Details</CardTitle>
              <CardDescription>
                Basic information about this exon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Ensembl Exon ID</p>
                <p className="text-lg font-medium">{exon.ensembl_exon_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transcript</p>
                <p className="text-lg font-medium">{getTranscriptName(exon.transcript_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Position</p>
                <p className="text-lg font-medium">{exon.start_position.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Position</p>
                <p className="text-lg font-medium">{exon.end_position.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Length</p>
                <p className="text-lg font-medium">{(exon.end_position - exon.start_position + 1).toLocaleString()} bp</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(exon.created_at).toLocaleDateString()}
                </p>
              </div>
              {exon.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(exon.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Exon</CardTitle>
              <CardDescription>
                Update exon details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transcript — searchable combobox */}
              <div className="space-y-2">
                <Label>Transcript</Label>
                <Popover open={transcriptPopoverOpen} onOpenChange={setTranscriptPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={transcriptPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {editTranscriptId
                          ? transcripts.find(t => t.id.toString() === editTranscriptId)?.ensembl_transcript_id || 'Select transcript'
                          : 'Select transcript'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search transcript..." />
                      <CommandList>
                        <CommandEmpty>No transcripts found.</CommandEmpty>
                        <CommandGroup>
                          {transcripts.map((t) => (
                            <CommandItem
                              key={t.id}
                              value={t.ensembl_transcript_id}
                              onSelect={() => {
                                setEditTranscriptId(t.id.toString());
                                setTranscriptPopoverOpen(false);
                              }}
                            >
                              {t.ensembl_transcript_id} {t.is_canonical ? '(canonical)' : ''}
                              {editTranscriptId === t.id.toString() && (
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ensembl-exon-id">Ensembl Exon ID</Label>
                  <Input
                    id="ensembl-exon-id"
                    value={editEnsemblExonId}
                    onChange={(e) => setEditEnsemblExonId(e.target.value)}
                    placeholder="e.g., ENSE00001494919"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-position">Start Position</Label>
                  <Input
                    id="start-position"
                    type="number"
                    value={editStartPosition}
                    onChange={(e) => setEditStartPosition(e.target.value)}
                    placeholder="e.g., 7687490"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-position">End Position</Label>
                  <Input
                    id="end-position"
                    type="number"
                    value={editEndPosition}
                    onChange={(e) => setEditEndPosition(e.target.value)}
                    placeholder="e.g., 7687538"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editEnsemblExonId.trim()) {
                    return;
                  }
                  const parsedTranscriptId = parseInt(editTranscriptId, 10);
                  if (isNaN(parsedTranscriptId) || parsedTranscriptId <= 0) {
                    return;
                  }
                  const parsedStart = parseInt(editStartPosition, 10);
                  const parsedEnd = parseInt(editEndPosition, 10);
                  if (isNaN(parsedStart) || isNaN(parsedEnd)) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateExon(exonId, {
                      transcript_id: parsedTranscriptId,
                      ensembl_exon_id: editEnsemblExonId.trim(),
                      start_position: parsedStart,
                      end_position: parsedEnd,
                    });
                    if (success) { await fetchExons(); }
                  } catch (error) {
                    console.error('Failed to update exon:', error);
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
                  <h4 className="font-medium">Delete this exon</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the exon from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-exon">
                    Type <span className="font-semibold">{exon.ensembl_exon_id}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-exon"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Ensembl Exon ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== exon.ensembl_exon_id) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteExon(exonId);
                      if (success) { router.push('/exons'); } else { setIsDeleting(false); }
                    } catch (error) {
                      console.error('Failed to delete exon:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== exon.ensembl_exon_id}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Exon
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
