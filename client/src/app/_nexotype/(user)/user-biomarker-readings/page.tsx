'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Loader2, Plus } from 'lucide-react';
import { useUserBiomarkerReadings } from '@/modules/nexotype/hooks/user/use-user-biomarker-readings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** User biomarker reading list page with local search support. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserBiomarkerReadingsPage() {
  const router = useRouter();
  const { userBiomarkerReadings, isLoading, error } = useUserBiomarkerReadings();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return userBiomarkerReadings;
    return userBiomarkerReadings.filter((item) => String(item.subject_id).includes(term) || String(item.biomarker_id).includes(term) || String(item.value).includes(term));
  }, [userBiomarkerReadings, search]);

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
<h1 className="text-3xl font-bold tracking-tight">User Biomarker Readings</h1>
<p className="text-muted-foreground">Manage measured biomarker values for subjects</p>
</div>
<Link href="/user-biomarker-readings/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Reading</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>User Biomarker Readings</CardTitle>
<CardDescription>All user biomarker reading records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by subject_id, biomarker_id, value..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<Activity className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No readings found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Subject</TableHead>
<TableHead>Biomarker</TableHead>
<TableHead>Value</TableHead>
<TableHead>Unit</TableHead>
<TableHead>Measured At</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/user-biomarker-readings/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.subject_id}</TableCell>
<TableCell>{item.biomarker_id}</TableCell>
<TableCell>{item.value}</TableCell>
<TableCell>{item.unit_id}</TableCell>
<TableCell>{new Date(item.measured_at).toLocaleString()}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/user-biomarker-readings/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {userBiomarkerReadings.length} readings</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
