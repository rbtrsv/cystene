'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Atom, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProteinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proteinId = parseInt(params.id as string);
  const {
    proteins,
    isLoading,
    error,
    setActiveProtein,
    fetchProtein,
    updateProtein,
    deleteProtein,
    fetchProteins
  } = useProteins();

  // Get transcripts for resolving transcript_id to name and for the edit selector
  const { transcripts } = useTranscripts();

  const listItem = proteins.find(p => p.id === proteinId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const protein = listItem ?? fetchedItem ?? null;

  // Fetch by ID when the list doesn't contain this protein (prevents false-404)
  useEffect(() => {
    if (!listItem && proteinId && !isLoading) {
      fetchProtein(proteinId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, proteinId, isLoading, fetchProtein]);

  // Helper to resolve transcript name from ID
  const getTranscriptName = (transcriptId: number) => {
    const transcript = transcripts.find(t => t.id === transcriptId);
    return transcript ? transcript.ensembl_transcript_id : `Transcript #${transcriptId}`;
  };

  // Settings state
  const [transcriptPopoverOpen, setTranscriptPopoverOpen] = useState(false);
  const [editTranscriptId, setEditTranscriptId] = useState('');
  const [editUniprotAccession, setEditUniprotAccession] = useState('');
  const [editSequenceAa, setEditSequenceAa] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when protein changes
  useEffect(() => {
    if (protein) {
      setEditTranscriptId(protein.transcript_id.toString());
      setEditUniprotAccession(protein.uniprot_accession);
      setEditSequenceAa(protein.sequence_aa);
    }
  }, [protein]);

  // Set active protein when ID changes
  useEffect(() => {
    if (proteinId) {
      setActiveProtein(proteinId);
    }
  }, [proteinId, setActiveProtein]);

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

  if (!protein) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Protein not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/proteins">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Proteins
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Atom className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{protein.uniprot_accession}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getTranscriptName(protein.transcript_id)}</Badge>
                <Badge variant="outline">{protein.sequence_aa.length} aa</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Atom className="h-4 w-4" />
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
              <CardTitle>Protein Details</CardTitle>
              <CardDescription>
                Basic information about this protein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">UniProt Accession</p>
                <p className="text-lg font-medium">{protein.uniprot_accession}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transcript</p>
                <p className="text-lg font-medium">{getTranscriptName(protein.transcript_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sequence Length</p>
                <p className="text-lg font-medium">{protein.sequence_aa.length} amino acids</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amino Acid Sequence</p>
                <pre className="mt-1 p-3 bg-muted rounded-md text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                  {protein.sequence_aa}
                </pre>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(protein.created_at).toLocaleDateString()}
                </p>
              </div>
              {protein.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(protein.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Protein</CardTitle>
              <CardDescription>
                Update protein details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="transcript-id">Transcript</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="uniprot-accession">UniProt Accession</Label>
                  <Input
                    id="uniprot-accession"
                    value={editUniprotAccession}
                    onChange={(e) => setEditUniprotAccession(e.target.value)}
                    placeholder="e.g., P04637"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sequence-aa">Amino Acid Sequence</Label>
                  <Textarea
                    id="sequence-aa"
                    value={editSequenceAa}
                    onChange={(e) => setEditSequenceAa(e.target.value)}
                    placeholder="e.g., MEEPQSDPSVEPPLSQETFSDLWKLL..."
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editUniprotAccession.trim() || !editSequenceAa.trim()) {
                    return;
                  }
                  const parsedTranscriptId = parseInt(editTranscriptId, 10);
                  if (isNaN(parsedTranscriptId) || parsedTranscriptId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateProtein(proteinId, {
                      transcript_id: parsedTranscriptId,
                      uniprot_accession: editUniprotAccession.trim(),
                      sequence_aa: editSequenceAa.trim(),
                    });
                    if (success) {
                      await fetchProteins();
                    }
                  } catch (error) {
                    console.error('Failed to update protein:', error);
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
                  <h4 className="font-medium">Delete this protein</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the protein from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-protein">
                    Type <span className="font-semibold">{protein.uniprot_accession}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-protein"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="UniProt Accession"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== protein.uniprot_accession) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteProtein(proteinId);
                      if (success) {
                        router.push('/proteins');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete protein:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== protein.uniprot_accession}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Protein
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
