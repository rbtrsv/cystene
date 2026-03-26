'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Beaker, Loader2, Plus } from 'lucide-react';
import { useAssayRuns } from '@/modules/nexotype/hooks/lims/use-assay-runs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Assay run list with search across protocol/operator/date fields. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function AssayRunsPage() {
  const router = useRouter();
  const { assayRuns, isLoading, error } = useAssayRuns();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssayRuns = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return assayRuns;

    return assayRuns.filter((assayRun) =>
      String(assayRun.protocol_id).includes(term) ||
      String(assayRun.operator_id ?? '').includes(term) ||
      assayRun.run_date.toLowerCase().includes(term)
    );
  }, [assayRuns, searchTerm]);

  // Guard: loading state.
  if (isLoading) {
      // Render page content.
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assay Runs</h1>
          <p className="text-muted-foreground">Manage execution records for assay protocols</p>
        </div>
        <Link href="/assay-runs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Assay Run
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assay Runs</CardTitle>
          <CardDescription>All assay run records visible to your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by protocol ID, operator ID, or run date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredAssayRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Beaker className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {assayRuns.length === 0 ? 'No assay runs yet' : 'No assay runs match filters'}
              </h3>
              {assayRuns.length === 0 && (
                <Link href="/assay-runs/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assay Run
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Protocol ID</TableHead>
                    <TableHead>Run Date</TableHead>
                    <TableHead>Operator ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssayRuns.map((assayRun) => (
                    <TableRow
                      key={assayRun.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/assay-runs/${assayRun.id}/details`)}
                    >
                      <TableCell className="font-medium">{assayRun.id}</TableCell>
                      <TableCell>{assayRun.protocol_id}</TableCell>
                      <TableCell>{new Date(assayRun.run_date).toLocaleDateString()}</TableCell>
                      <TableCell>{assayRun.operator_id ?? '—'}</TableCell>
                      <TableCell>{new Date(assayRun.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assay-runs/${assayRun.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">
                Showing {filteredAssayRuns.length} of {assayRuns.length} assay runs
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
