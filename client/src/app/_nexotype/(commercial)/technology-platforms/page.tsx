'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-technology-platforms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Cpu, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'name' | 'category' | 'readiness_level';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Technology Platforms list page
// Displays all technology platforms with sorting and search
// ---------------------------------------------------------------------------
export default function TechnologyPlatformsPage() {
  const router = useRouter();
  const { technologyPlatforms, isLoading, error } = useTechnologyPlatforms();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort technology platforms
  // ==========================================

  const filteredTechnologyPlatforms = useMemo(() => {
    let filtered = [...technologyPlatforms];

    // Search by name or category
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tp =>
        tp.name.toLowerCase().includes(term) ||
        tp.category.toLowerCase().includes(term)
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
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
          case 'readiness_level':
            comparison = (a.readiness_level ?? 0) - (b.readiness_level ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [technologyPlatforms, searchTerm, sortField, sortDirection]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>);
  }

  const totalCount = technologyPlatforms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Technology Platforms</h1>
          <p className="text-muted-foreground">Manage technology platforms in the commercial registry</p>
        </div>
        <Link href="/technology-platforms/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Technology Platform
          </Button>
        </Link>
      </div>

      {/* Technology platforms table card */}
      <Card>
        <CardHeader>
          <CardTitle>Technology Platforms</CardTitle>
          <CardDescription>All technology platforms in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input — filters by name or category */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {/* Table or empty state */}
          {filteredTechnologyPlatforms.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No technology platforms yet' : 'No technology platforms match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first technology platform' : 'Try adjusting your search'}
              </p>
              {totalCount === 0 && (
                <Link href="/technology-platforms/new"><Button><Plus className="mr-2 h-4 w-4" />Create Technology Platform</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Horizontal scroll on mobile for wide tables */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('name')}>
                        Name
                        <SortIndicator field="name" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('category')}>
                        Category
                        <SortIndicator field="category" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('readiness_level')}>
                        Readiness Level
                        <SortIndicator field="readiness_level" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTechnologyPlatforms.map((tp) => (
                    <TableRow key={tp.id} className="cursor-pointer" onClick={() => router.push(`/technology-platforms/${tp.id}/details`)}>
                      <TableCell className="font-medium">{tp.id}</TableCell>
                      <TableCell>{tp.name}</TableCell>
                      <TableCell>{tp.category}</TableCell>
                      <TableCell>{tp.readiness_level ?? '—'}</TableCell>
                      <TableCell>{new Date(tp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/technology-platforms/${tp.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredTechnologyPlatforms.length} of {totalCount} technology platforms
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
