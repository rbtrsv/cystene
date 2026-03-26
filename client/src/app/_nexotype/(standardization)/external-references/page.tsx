'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExternalReferences } from '@/modules/nexotype/hooks/standardization/use-external-references';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { getEntityTypeLabel } from '@/modules/nexotype/schemas/standardization/external-reference.schemas';
import { Link2, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the external references table
 */
type SortField = 'entity_type' | 'source';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function ExternalReferencesPage() {
  const router = useRouter();
  const {
    externalReferences,
    isLoading,
    error,
  } = useExternalReferences();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort external references
  // ==========================================

  const filteredExternalReferences = useMemo(() => {
    let filtered = externalReferences;

    // Search by entity_type, source, or external_id
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(er =>
        er.entity_type.toLowerCase().includes(term) ||
        er.source.toLowerCase().includes(term) ||
        er.external_id.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'entity_type':
            comparison = a.entity_type.localeCompare(b.entity_type);
            break;
          case 'source':
            comparison = a.source.localeCompare(b.source);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [externalReferences, searchTerm, sortField, sortDirection]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">External References</h1>
          <p className="text-muted-foreground">
            Manage cross-references to external databases (PDB, ClinVar, UniProt)
          </p>
        </div>
        <Link href="/external-references/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create External Reference
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>External References</CardTitle>
          <CardDescription>
            All external references in the standardization registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by entity type, source, or external ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filteredExternalReferences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {externalReferences.length === 0 ? 'No external references yet' : 'No external references match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {externalReferences.length === 0
                  ? 'Create your first external reference to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {externalReferences.length === 0 && (
                <Link href="/external-references/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create External Reference
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
                        onClick={() => handleSort('entity_type')}
                      >
                        Entity Type
                        <SortIndicator field="entity_type" />
                      </Button>
                    </TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('source')}
                      >
                        Source
                        <SortIndicator field="source" />
                      </Button>
                    </TableHead>
                    <TableHead>External ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExternalReferences.map((externalReference) => (
                    <TableRow
                      key={externalReference.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/external-references/${externalReference.id}/details`)}
                    >
                      <TableCell className="font-medium">{getEntityTypeLabel(externalReference.entity_type)}</TableCell>
                      <TableCell>{externalReference.entity_id}</TableCell>
                      <TableCell>{externalReference.source}</TableCell>
                      <TableCell>{externalReference.external_id}</TableCell>
                      <TableCell>{new Date(externalReference.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/external-references/${externalReference.id}/details`);
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
                Showing {filteredExternalReferences.length} of {externalReferences.length} external references
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
