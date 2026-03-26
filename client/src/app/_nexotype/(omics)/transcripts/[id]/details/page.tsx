'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, FileText, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TranscriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transcriptId = parseInt(params.id as string);
  const {
    transcripts,
    isLoading,
    error,
    setActiveTranscript,
    fetchTranscript,
    updateTranscript,
    deleteTranscript,
    fetchTranscripts
  } = useTranscripts();

  // Get genes for resolving gene_id to name and for the edit selector
  const { genes } = useGenes();

  const listItem = transcripts.find(t => t.id === transcriptId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const transcript = listItem ?? fetchedItem ?? null;

  // Fetch by ID fallback when list doesn't contain the item (prevents false-404)
  useEffect(() => {
    if (!listItem && transcriptId && !isLoading) {
      fetchTranscript(transcriptId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, transcriptId, isLoading, fetchTranscript]);

  // Helper to resolve gene name from ID
  const getGeneName = (geneId: number) => {
    const gene = genes.find(g => g.id === geneId);
    return gene ? gene.hgnc_symbol : `Gene #${geneId}`;
  };

  // Settings state
  const [genePopoverOpen, setGenePopoverOpen] = useState(false);
  const [editGeneId, setEditGeneId] = useState('');
  const [editEnsemblTranscriptId, setEditEnsemblTranscriptId] = useState('');
  const [editIsCanonical, setEditIsCanonical] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when transcript changes
  useEffect(() => {
    if (transcript) {
      setEditGeneId(transcript.gene_id.toString());
      setEditEnsemblTranscriptId(transcript.ensembl_transcript_id);
      setEditIsCanonical(transcript.is_canonical);
    }
  }, [transcript]);

  // Set active transcript when ID changes
  useEffect(() => {
    if (transcriptId) {
      setActiveTranscript(transcriptId);
    }
  }, [transcriptId, setActiveTranscript]);

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

  if (!transcript) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Transcript not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/transcripts">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Transcripts
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{transcript.ensembl_transcript_id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getGeneName(transcript.gene_id)}</Badge>
                {transcript.is_canonical && (
                  <Badge variant="default">Canonical</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4" />
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
              <CardTitle>Transcript Details</CardTitle>
              <CardDescription>
                Basic information about this transcript
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Ensembl Transcript ID</p>
                <p className="text-lg font-medium">{transcript.ensembl_transcript_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gene</p>
                <p className="text-lg font-medium">{getGeneName(transcript.gene_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canonical</p>
                <p className="text-lg font-medium">{transcript.is_canonical ? 'Yes' : 'No'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(transcript.created_at).toLocaleDateString()}
                </p>
              </div>
              {transcript.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(transcript.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Transcript</CardTitle>
              <CardDescription>
                Update transcript details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gene — searchable combobox */}
              <div className="space-y-2">
                <Label>Gene</Label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ensembl-transcript-id">Ensembl Transcript ID</Label>
                  <Input
                    id="ensembl-transcript-id"
                    value={editEnsemblTranscriptId}
                    onChange={(e) => setEditEnsemblTranscriptId(e.target.value)}
                    placeholder="e.g., ENST00000269305"
                  />
                </div>
                <div className="flex items-center space-x-2 sm:col-span-2">
                  <Checkbox
                    id="is-canonical"
                    checked={editIsCanonical}
                    onCheckedChange={(checked) => setEditIsCanonical(checked === true)}
                  />
                  <Label htmlFor="is-canonical" className="cursor-pointer">
                    Canonical transcript
                  </Label>
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editEnsemblTranscriptId.trim()) {
                    return;
                  }
                  const parsedGeneId = parseInt(editGeneId, 10);
                  if (isNaN(parsedGeneId) || parsedGeneId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateTranscript(transcriptId, {
                      gene_id: parsedGeneId,
                      ensembl_transcript_id: editEnsemblTranscriptId.trim(),
                      is_canonical: editIsCanonical,
                    });
                    if (success) { await fetchTranscripts(); }
                  } catch (error) {
                    console.error('Failed to update transcript:', error);
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
                  <h4 className="font-medium">Delete this transcript</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the transcript from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-transcript">
                    Type <span className="font-semibold">{transcript.ensembl_transcript_id}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-transcript"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Ensembl Transcript ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== transcript.ensembl_transcript_id) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteTranscript(transcriptId);
                      if (success) { router.push('/transcripts'); } else { setIsDeleting(false); }
                    } catch (error) {
                      console.error('Failed to delete transcript:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== transcript.ensembl_transcript_id}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Transcript
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
