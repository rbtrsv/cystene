'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSources } from '@/modules/nexotype/hooks/knowledge_graph/use-sources';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { FileSearch, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Sources list page
// Displays all literature and data sources with search filtering by
// external_id, title, or authors
// ---------------------------------------------------------------------------
export default function SourcesPage() {
  const router = useRouter();
  const { sources, isLoading, error } = useSources();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sources by external_id, title, or authors
  const filteredSources = useMemo(() => {
    let filtered = sources;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.external_id.toLowerCase().includes(term) ||
        (s.title && s.title.toLowerCase().includes(term)) ||
        (s.authors && s.authors.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [sources, searchTerm]);

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

  return (
    <div className="space-y-6">
      {/* Page header with title and create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
          <p className="text-muted-foreground">Manage literature and data sources in the knowledge graph</p>
        </div>
        <Link href="/sources/new">
          <Button><Plus className="mr-2 h-4 w-4" />Create Source</Button>
        </Link>
      </div>

      {/* Sources table card */}
      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>All sources in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input — filters by external_id, title, or authors */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by external ID, title, or authors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {filteredSources.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {sources.length === 0 ? 'No sources yet' : 'No sources match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {sources.length === 0 ? 'Create your first source' : 'Try adjusting your search'}
              </p>
              {sources.length === 0 && (
                <Link href="/sources/new"><Button><Plus className="mr-2 h-4 w-4" />Create Source</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Results table */}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>External ID</TableHead>
                  <TableHead>Source Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Journal</TableHead>
                  <TableHead>Publication Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredSources.map((source) => (
                    <TableRow key={source.id} className="cursor-pointer" onClick={() => router.push(`/sources/${source.id}/details`)}>
                      <TableCell className="font-medium">{source.external_id}</TableCell>
                      <TableCell>{source.source_type}</TableCell>
                      <TableCell>{source.title ?? '—'}</TableCell>
                      <TableCell>{source.journal ?? '—'}</TableCell>
                      <TableCell>{source.publication_date ? new Date(source.publication_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/sources/${source.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filteredSources.length} of {sources.length} sources</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
