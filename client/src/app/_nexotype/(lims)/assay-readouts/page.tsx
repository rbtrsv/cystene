'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Loader2, Plus } from 'lucide-react';
import { useAssayReadouts } from '@/modules/nexotype/hooks/lims/use-assay-readouts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Assay readout list with search across run/specimen/value fields. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function AssayReadoutsPage() {
  const router = useRouter();
  const { assayReadouts, isLoading, error } = useAssayReadouts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssayReadouts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return assayReadouts;

    return assayReadouts.filter((assayReadout) =>
      String(assayReadout.run_id).includes(term) ||
      String(assayReadout.biospecimen_id ?? '').includes(term) ||
      String(assayReadout.asset_id ?? '').includes(term) ||
      String(assayReadout.unit_id).includes(term) ||
      String(assayReadout.raw_value).toLowerCase().includes(term)
    );
  }, [assayReadouts, searchTerm]);

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
          <h1 className="text-3xl font-bold tracking-tight">Assay Readouts</h1>
          <p className="text-muted-foreground">Manage measured assay values tied to runs and biospecimens</p>
        </div>
        <Link href="/assay-readouts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Assay Readout
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assay Readouts</CardTitle>
          <CardDescription>All assay readout records visible to your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by run ID, specimen ID, asset ID, unit ID, or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredAssayReadouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {assayReadouts.length === 0 ? 'No assay readouts yet' : 'No assay readouts match filters'}
              </h3>
              {assayReadouts.length === 0 && (
                <Link href="/assay-readouts/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assay Readout
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
                    <TableHead>Run ID</TableHead>
                    <TableHead>Biospecimen ID</TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Raw Value</TableHead>
                    <TableHead>Unit ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssayReadouts.map((assayReadout) => (
                    <TableRow
                      key={assayReadout.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/assay-readouts/${assayReadout.id}/details`)}
                    >
                      <TableCell className="font-medium">{assayReadout.id}</TableCell>
                      <TableCell>{assayReadout.run_id}</TableCell>
                      <TableCell>{assayReadout.biospecimen_id ?? '—'}</TableCell>
                      <TableCell>{assayReadout.asset_id ?? '—'}</TableCell>
                      <TableCell>{assayReadout.raw_value}</TableCell>
                      <TableCell>{assayReadout.unit_id}</TableCell>
                      <TableCell>{new Date(assayReadout.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assay-readouts/${assayReadout.id}/details`);
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
                Showing {filteredAssayReadouts.length} of {assayReadouts.length} assay readouts
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
