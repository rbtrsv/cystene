'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TestTubeDiagonal, Loader2, Plus } from 'lucide-react';
import { useBiospecimens } from '@/modules/nexotype/hooks/lims/use-biospecimens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Biospecimen list with search on barcode and linked subject metadata. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function BiospecimensPage() {
  const router = useRouter();
  const { biospecimens, isLoading, error } = useBiospecimens();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBiospecimens = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return biospecimens;

    return biospecimens.filter((biospecimen) =>
      biospecimen.barcode.toLowerCase().includes(term) ||
      biospecimen.sample_type.toLowerCase().includes(term) ||
      String(biospecimen.subject_id).includes(term) ||
      String(biospecimen.freezer_location ?? '').toLowerCase().includes(term)
    );
  }, [biospecimens, searchTerm]);

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
          <h1 className="text-3xl font-bold tracking-tight">Biospecimens</h1>
          <p className="text-muted-foreground">Manage biospecimen records and storage metadata</p>
        </div>
        <Link href="/biospecimens/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Biospecimen
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biospecimens</CardTitle>
          <CardDescription>All biospecimen records visible to your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by barcode, sample type, subject ID, or freezer location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredBiospecimens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <TestTubeDiagonal className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {biospecimens.length === 0 ? 'No biospecimens yet' : 'No biospecimens match filters'}
              </h3>
              {biospecimens.length === 0 && (
                <Link href="/biospecimens/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Biospecimen
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
                    <TableHead>Subject ID</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Sample Type</TableHead>
                    <TableHead>Freezer Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBiospecimens.map((biospecimen) => (
                    <TableRow
                      key={biospecimen.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/biospecimens/${biospecimen.id}/details`)}
                    >
                      <TableCell className="font-medium">{biospecimen.id}</TableCell>
                      <TableCell>{biospecimen.subject_id}</TableCell>
                      <TableCell>{biospecimen.barcode}</TableCell>
                      <TableCell>{biospecimen.sample_type}</TableCell>
                      <TableCell>{biospecimen.freezer_location ?? '—'}</TableCell>
                      <TableCell>{new Date(biospecimen.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/biospecimens/${biospecimen.id}/details`);
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
                Showing {filteredBiospecimens.length} of {biospecimens.length} biospecimens
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
