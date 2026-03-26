'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lightbulb, Loader2, Plus } from 'lucide-react';
import { useRecommendations } from '@/modules/nexotype/hooks/user/use-recommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Recommendation list page with local search support. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function RecommendationsPage() {
  const router = useRouter();
  const { recommendations, isLoading, error } = useRecommendations();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return recommendations;
    return recommendations.filter((item) => String(item.user_profile_id).includes(term) || String(item.asset_id).includes(term) || item.reason.toLowerCase().includes(term) || item.priority.toLowerCase().includes(term));
  }, [recommendations, search]);

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
<h1 className="text-3xl font-bold tracking-tight">Recommendations</h1>
<p className="text-muted-foreground">Manage personalized recommendation records</p>
</div>
<Link href="/recommendations/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Recommendation</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>Recommendations</CardTitle>
<CardDescription>All recommendation records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by profile, asset, reason, priority..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No recommendations found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>User Profile</TableHead>
<TableHead>Asset</TableHead>
<TableHead>Priority</TableHead>
<TableHead>Reason</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/recommendations/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.user_profile_id}</TableCell>
<TableCell>{item.asset_id}</TableCell>
<TableCell>{item.priority}</TableCell>
<TableCell className="max-w-[360px] truncate">{item.reason}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/recommendations/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {recommendations.length} recommendations</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
