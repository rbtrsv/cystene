'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Atom, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the proteins table
 */
type SortField = 'uniprot_accession' | 'sequence_length';
type SortDirection = 'asc' | 'desc' | null;

export default function ProteinsPage() {
  const router = useRouter();
  const {
    proteins,
    isLoading,
    error,
  } = useProteins();

  // Get transcripts for resolving transcript_id to name
  const { transcripts } = useTranscripts();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [transcriptFilter, setTranscriptFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve transcript name from ID
  const getTranscriptName = (transcriptId: number) => {
    const transcript = transcripts.find(t => t.id === transcriptId);
    return transcript ? transcript.ensembl_transcript_id : `Transcript #${transcriptId}`;
  };

  // ==========================================
  // Filter and sort proteins
  // ==========================================

  const filteredProteins = useMemo(() => {
    let filtered = proteins;

    // Search by UniProt accession
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.uniprot_accession.toLowerCase().includes(term)
      );
    }

    // Filter by transcript
    if (transcriptFilter !== 'all') {
      const transcriptId = parseInt(transcriptFilter);
      filtered = filtered.filter(p => p.transcript_id === transcriptId);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'uniprot_accession':
            comparison = a.uniprot_accession.localeCompare(b.uniprot_accession);
            break;
          case 'sequence_length':
            comparison = a.sequence_aa.length - b.sequence_aa.length;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [proteins, searchTerm, transcriptFilter, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  // ==========================================
  // Render
  // ==========================================

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proteins</h1>
          <p className="text-muted-foreground">
            Manage proteoforms and drug targets in the omics registry
          </p>
        </div>
        <Link href="/proteins/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Protein
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Proteins</CardTitle>
          <CardDescription>
            All proteins in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by UniProt accession..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transcript">Transcript</Label>
              <Select value={transcriptFilter} onValueChange={setTranscriptFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Transcripts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transcripts</SelectItem>
                  {transcripts.map((transcript) => (
                    <SelectItem key={transcript.id} value={transcript.id.toString()}>
                      {transcript.ensembl_transcript_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or empty state */}
          {filteredProteins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Atom className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {proteins.length === 0 ? 'No proteins yet' : 'No proteins match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {proteins.length === 0
                  ? 'Create your first protein to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {proteins.length === 0 && (
                <Link href="/proteins/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Protein
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('uniprot_accession')}
                      >
                        UniProt Accession
                        <SortIndicator field="uniprot_accession" />
                      </Button>
                    </TableHead>
                    <TableHead>Transcript</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('sequence_length')}
                      >
                        Sequence Length
                        <SortIndicator field="sequence_length" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProteins.map((protein) => (
                    <TableRow
                      key={protein.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/proteins/${protein.id}/details`)}
                    >
                      <TableCell className="font-medium">{protein.uniprot_accession}</TableCell>
                      <TableCell>{getTranscriptName(protein.transcript_id)}</TableCell>
                      <TableCell>{protein.sequence_aa.length.toLocaleString()} aa</TableCell>
                      <TableCell>{new Date(protein.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/proteins/${protein.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredProteins.length} of {proteins.length} proteins
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
