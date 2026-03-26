'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBiologics } from '@/modules/nexotype/hooks/asset/use-biologics';
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
import { FlaskConical, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the biologics table
 */
type SortField = 'name' | 'uid';
type SortDirection = 'asc' | 'desc' | null;

export default function BiologicsPage() {
  const router = useRouter();
  const {
    biologics,
    isLoading,
    error,
  } = useBiologics();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort biologics
  // ==========================================

  const filteredBiologics = useMemo(() => {
    let filtered = biologics;

    // Search by name, UID, Amino Acid Sequence, or Biologic Type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.uid.toLowerCase().includes(term) ||
        m.sequence_aa.toLowerCase().includes(term) ||
        (m.biologic_type && m.biologic_type.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'uid':
            comparison = a.uid.localeCompare(b.uid);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [biologics, searchTerm, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Biologics</h1>
          <p className="text-muted-foreground">
            Manage biological therapeutic agents
          </p>
        </div>
        <Link href="/biologics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Biologic
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Biologics</CardTitle>
          <CardDescription>
            All biologics in the asset registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, UID, Amino Acid Sequence, or Biologic Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredBiologics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {biologics.length === 0 ? 'No biologics yet' : 'No biologics match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {biologics.length === 0
                  ? 'Create your first biologic to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {biologics.length === 0 && (
                <Link href="/biologics/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Biologic
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
                        onClick={() => handleSort('name')}
                      >
                        Name
                        <SortIndicator field="name" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('uid')}
                      >
                        UID
                        <SortIndicator field="uid" />
                      </Button>
                    </TableHead>
                    <TableHead>Project Code</TableHead>
                    <TableHead>Biologic Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBiologics.map((biologic) => (
                    <TableRow
                      key={biologic.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/biologics/${biologic.id}/details`)}
                    >
                      <TableCell className="font-medium">{biologic.name}</TableCell>
                      <TableCell>{biologic.uid}</TableCell>
                      <TableCell>{biologic.project_code || '—'}</TableCell>
                      <TableCell className="text-xs">{biologic.biologic_type || '—'}</TableCell>
                      <TableCell>{new Date(biologic.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/biologics/${biologic.id}/details`);
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
                Showing {filteredBiologics.length} of {biologics.length} biologics
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
