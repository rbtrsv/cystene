'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { FileText, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the transcripts table
 */
type SortField = 'ensembl_transcript_id';
type SortDirection = 'asc' | 'desc' | null;

export default function TranscriptsPage() {
  const router = useRouter();
  const {
    transcripts,
    isLoading,
    error,
  } = useTranscripts();

  // Get genes for resolving gene_id to name
  const { genes } = useGenes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [geneFilter, setGeneFilter] = useState<string>('all');
  const [canonicalFilter, setCanonicalFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve gene name from ID
  const getGeneName = (geneId: number) => {
    const gene = genes.find(g => g.id === geneId);
    return gene ? gene.hgnc_symbol : `Gene #${geneId}`;
  };

  // ==========================================
  // Filter and sort transcripts
  // ==========================================

  const filteredTranscripts = useMemo(() => {
    let filtered = transcripts;

    // Search by Ensembl transcript ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.ensembl_transcript_id.toLowerCase().includes(term)
      );
    }

    // Filter by gene
    if (geneFilter !== 'all') {
      const geneId = parseInt(geneFilter);
      filtered = filtered.filter(t => t.gene_id === geneId);
    }

    // Filter by canonical status
    if (canonicalFilter !== 'all') {
      const isCanonical = canonicalFilter === 'yes';
      filtered = filtered.filter(t => t.is_canonical === isCanonical);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'ensembl_transcript_id':
            comparison = a.ensembl_transcript_id.localeCompare(b.ensembl_transcript_id);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [transcripts, searchTerm, geneFilter, canonicalFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Transcripts</h1>
          <p className="text-muted-foreground">
            Manage mRNA splice variants (isoforms) in the omics registry
          </p>
        </div>
        <Link href="/transcripts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Transcript
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transcripts</CardTitle>
          <CardDescription>
            All transcripts in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by Ensembl transcript ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gene">Gene</Label>
              <Select value={geneFilter} onValueChange={setGeneFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Genes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genes</SelectItem>
                  {genes.map((gene) => (
                    <SelectItem key={gene.id} value={gene.id.toString()}>
                      {gene.hgnc_symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonical">Canonical</Label>
              <Select value={canonicalFilter} onValueChange={setCanonicalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Canonical</SelectItem>
                  <SelectItem value="no">Non-canonical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or empty state */}
          {filteredTranscripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {transcripts.length === 0 ? 'No transcripts yet' : 'No transcripts match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {transcripts.length === 0
                  ? 'Create your first transcript to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {transcripts.length === 0 && (
                <Link href="/transcripts/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Transcript
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
                        onClick={() => handleSort('ensembl_transcript_id')}
                      >
                        Ensembl Transcript ID
                        <SortIndicator field="ensembl_transcript_id" />
                      </Button>
                    </TableHead>
                    <TableHead>Gene</TableHead>
                    <TableHead>Canonical</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranscripts.map((transcript) => (
                    <TableRow
                      key={transcript.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/transcripts/${transcript.id}/details`)}
                    >
                      <TableCell className="font-medium">{transcript.ensembl_transcript_id}</TableCell>
                      <TableCell>{getGeneName(transcript.gene_id)}</TableCell>
                      <TableCell>
                        {transcript.is_canonical ? (
                          <Badge variant="default">Canonical</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{new Date(transcript.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/transcripts/${transcript.id}/details`);
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
                Showing {filteredTranscripts.length} of {transcripts.length} transcripts
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
