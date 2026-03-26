'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, Plus } from 'lucide-react';
import { useGenomicFiles } from '@/modules/nexotype/hooks/user/use-genomic-files';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Genomic file list page with local search support. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function GenomicFilesPage() {
  const router = useRouter();
  const { genomicFiles, isLoading, error } = useGenomicFiles();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return genomicFiles;
    return genomicFiles.filter((item) => String(item.subject_id).includes(term) || item.file_url.toLowerCase().includes(term) || item.status.toLowerCase().includes(term));
  }, [genomicFiles, search]);

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
<h1 className="text-3xl font-bold tracking-tight">Genomic Files</h1>
<p className="text-muted-foreground">Manage subject-linked genomic file metadata</p>
</div>
<Link href="/genomic-files/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Genomic File</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>Genomic Files</CardTitle>
<CardDescription>All genomic file records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by subject_id, file_url, status..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<FileText className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No genomic files found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Subject ID</TableHead>
<TableHead>File URL</TableHead>
<TableHead>Status</TableHead>
<TableHead>Created</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/genomic-files/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.subject_id}</TableCell>
<TableCell className="max-w-[360px] truncate">{item.file_url}</TableCell>
<TableCell>{item.status}</TableCell>
<TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/genomic-files/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {genomicFiles.length} genomic files</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
