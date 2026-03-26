'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
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
import { GitBranch, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the variants table
 */
type SortField = 'db_snp_id';
type SortDirection = 'asc' | 'desc' | null;

export default function VariantsPage() {
  const router = useRouter();
  const {
    variants,
    isLoading,
    error,
  } = useVariants();

  // Get genes for resolving gene_id to name
  const { genes } = useGenes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [geneFilter, setGeneFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve gene name from ID
  const getGeneName = (geneId: number) => {
    const gene = genes.find(g => g.id === geneId);
    return gene ? gene.hgnc_symbol : `Gene #${geneId}`;
  };

  // ==========================================
  // Filter and sort variants
  // ==========================================

  const filteredVariants = useMemo(() => {
    let filtered = variants;

    // Search by dbSNP ID, HGVS c., or HGVS p.
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.db_snp_id.toLowerCase().includes(term) ||
        (v.hgvs_c && v.hgvs_c.toLowerCase().includes(term)) ||
        (v.hgvs_p && v.hgvs_p.toLowerCase().includes(term))
      );
    }

    // Filter by gene
    if (geneFilter !== 'all') {
      const geneId = parseInt(geneFilter);
      filtered = filtered.filter(v => v.gene_id === geneId);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'db_snp_id':
            comparison = a.db_snp_id.localeCompare(b.db_snp_id);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [variants, searchTerm, geneFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Variants</h1>
          <p className="text-muted-foreground">
            Manage genetic variants in the omics registry
          </p>
        </div>
        <Link href="/variants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Variant
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>
            All variants in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by dbSNP ID, HGVS c., or HGVS p..."
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
          </div>

          {/* Table or empty state */}
          {filteredVariants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {variants.length === 0 ? 'No variants yet' : 'No variants match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {variants.length === 0
                  ? 'Create your first variant to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {variants.length === 0 && (
                <Link href="/variants/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Variant
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
                        onClick={() => handleSort('db_snp_id')}
                      >
                        dbSNP ID
                        <SortIndicator field="db_snp_id" />
                      </Button>
                    </TableHead>
                    <TableHead>Gene</TableHead>
                    <TableHead>HGVS c.</TableHead>
                    <TableHead>HGVS p.</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariants.map((variant) => (
                    <TableRow
                      key={variant.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/variants/${variant.id}/details`)}
                    >
                      <TableCell className="font-medium">{variant.db_snp_id}</TableCell>
                      <TableCell>{getGeneName(variant.gene_id)}</TableCell>
                      <TableCell>{variant.hgvs_c || '—'}</TableCell>
                      <TableCell>{variant.hgvs_p || '—'}</TableCell>
                      <TableCell>{new Date(variant.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/variants/${variant.id}/details`);
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
                Showing {filteredVariants.length} of {variants.length} variants
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
