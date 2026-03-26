'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database, Loader2, Plus } from 'lucide-react';
import { useDataSources } from '@/modules/nexotype/hooks/user/use-data-sources';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Data source list page with local text search. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function DataSourcesPage() {
  const router = useRouter();
  const { dataSources, isLoading, error } = useDataSources();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return dataSources;
    return dataSources.filter((item) => item.name.toLowerCase().includes(term) || item.source_type.toLowerCase().includes(term));
  }, [dataSources, search]);

    // Guard: loading state.
  if (isLoading) return <div className="flex items-center justify-center p-8">
<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>;
    // Guard: error state.
  if (error) return <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>;

    // Render page content.
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
<p className="text-muted-foreground">Manage source systems used for user-level data</p>
</div>
<Link href="/data-sources/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Data Source</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>Data Sources</CardTitle>
<CardDescription>All data source records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by name or source type..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<Database className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No data sources found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Name</TableHead>
<TableHead>Source Type</TableHead>
<TableHead>Created</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/data-sources/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.name}</TableCell>
<TableCell>{item.source_type}</TableCell>
<TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/data-sources/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {dataSources.length} data sources</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
