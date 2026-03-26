'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pill, Loader2, Plus } from 'lucide-react';
import { useUserTreatmentLogs } from '@/modules/nexotype/hooks/user/use-user-treatment-logs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** User treatment log list page with local search support. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserTreatmentLogsPage() {
  const router = useRouter();
  const { userTreatmentLogs, isLoading, error } = useUserTreatmentLogs();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return userTreatmentLogs;
    return userTreatmentLogs.filter((item) => String(item.subject_id).includes(term) || String(item.asset_id).includes(term) || item.dosage.toLowerCase().includes(term));
  }, [userTreatmentLogs, search]);

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
<h1 className="text-3xl font-bold tracking-tight">User Treatment Logs</h1>
<p className="text-muted-foreground">Manage treatment history for subjects</p>
</div>
<Link href="/user-treatment-logs/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Treatment Log</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>User Treatment Logs</CardTitle>
<CardDescription>All treatment log records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by subject_id, asset_id, dosage..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<Pill className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No treatment logs found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Subject</TableHead>
<TableHead>Asset</TableHead>
<TableHead>Dosage</TableHead>
<TableHead>Started</TableHead>
<TableHead>Ended</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/user-treatment-logs/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.subject_id}</TableCell>
<TableCell>{item.asset_id}</TableCell>
<TableCell>{item.dosage}</TableCell>
<TableCell>{item.started_at}</TableCell>
<TableCell>{item.ended_at ?? '—'}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/user-treatment-logs/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {userTreatmentLogs.length} treatment logs</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
