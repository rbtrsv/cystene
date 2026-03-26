'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { getPatentStatusVariant } from '@/modules/nexotype/schemas/commercial/patent.schemas';
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
import { ScrollText, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the patents table
 */
type SortField = 'patent_number' | 'filing_date';
type SortDirection = 'asc' | 'desc' | null;

export default function PatentsPage() {
  const router = useRouter();
  const {
    patents,
    isLoading,
    error,
  } = usePatents();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort patents
  // ==========================================

  const filteredPatents = useMemo(() => {
    let filtered = patents;

    // Search by patent number or title
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.patent_number.toLowerCase().includes(term) ||
        (p.title && p.title.toLowerCase().includes(term))
      );
    }

    // Filter by jurisdiction
    if (jurisdictionFilter !== 'all') {
      filtered = filtered.filter(p => p.jurisdiction === jurisdictionFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'patent_number':
            comparison = a.patent_number.localeCompare(b.patent_number);
            break;
          case 'filing_date':
            comparison = (a.filing_date || '').localeCompare(b.filing_date || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [patents, searchTerm, jurisdictionFilter, statusFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Patents</h1>
          <p className="text-muted-foreground">
            Manage intellectual property and patent filings
          </p>
        </div>
        <Link href="/patents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Patent
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patents</CardTitle>
          <CardDescription>
            All patents in the registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by patent number or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Jurisdictions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="WO">WO</SelectItem>
                  <SelectItem value="EP">EP</SelectItem>
                  <SelectItem value="CN">CN</SelectItem>
                  <SelectItem value="JP">JP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Granted">Granted</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or empty state */}
          {filteredPatents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {patents.length === 0 ? 'No patents yet' : 'No patents match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {patents.length === 0
                  ? 'Create your first patent to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {patents.length === 0 && (
                <Link href="/patents/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Patent
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
                        onClick={() => handleSort('patent_number')}
                      >
                        Patent Number
                        <SortIndicator field="patent_number" />
                      </Button>
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('filing_date')}
                      >
                        Filing Date
                        <SortIndicator field="filing_date" />
                      </Button>
                    </TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatents.map((patent) => (
                    <TableRow
                      key={patent.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/patents/${patent.id}/details`)}
                    >
                      <TableCell className="font-medium">{patent.patent_number}</TableCell>
                      <TableCell>{patent.title || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{patent.jurisdiction}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPatentStatusVariant(patent.status)}>{patent.status}</Badge>
                      </TableCell>
                      <TableCell>{patent.filing_date ? new Date(patent.filing_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{patent.expiry_date ? new Date(patent.expiry_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/patents/${patent.id}/details`);
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
                Showing {filteredPatents.length} of {patents.length} patents
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
