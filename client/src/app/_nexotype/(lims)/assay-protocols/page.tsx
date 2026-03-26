'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Loader2, Plus } from 'lucide-react';
import { useAssayProtocols } from '@/modules/nexotype/hooks/lims/use-assay-protocols';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Assay protocol list with search across name, version, and method text. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function AssayProtocolsPage() {
  const router = useRouter();
  const { assayProtocols, isLoading, error } = useAssayProtocols();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssayProtocols = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return assayProtocols;

    return assayProtocols.filter((protocol) =>
      protocol.name.toLowerCase().includes(term) ||
      protocol.version.toLowerCase().includes(term) ||
      String(protocol.method_description ?? '').toLowerCase().includes(term)
    );
  }, [assayProtocols, searchTerm]);

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
          <h1 className="text-3xl font-bold tracking-tight">Assay Protocols</h1>
          <p className="text-muted-foreground">Manage assay methods and versioned protocol metadata</p>
        </div>
        <Link href="/assay-protocols/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Assay Protocol
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assay Protocols</CardTitle>
          <CardDescription>All assay protocol records visible to your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, version, or method description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredAssayProtocols.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {assayProtocols.length === 0 ? 'No assay protocols yet' : 'No assay protocols match filters'}
              </h3>
              {assayProtocols.length === 0 && (
                <Link href="/assay-protocols/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assay Protocol
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
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Method Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssayProtocols.map((protocol) => (
                    <TableRow
                      key={protocol.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/assay-protocols/${protocol.id}/details`)}
                    >
                      <TableCell className="font-medium">{protocol.id}</TableCell>
                      <TableCell>{protocol.name}</TableCell>
                      <TableCell>{protocol.version}</TableCell>
                      <TableCell>{protocol.method_description ?? '—'}</TableCell>
                      <TableCell>{new Date(protocol.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/assay-protocols/${protocol.id}/details`);
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
                Showing {filteredAssayProtocols.length} of {assayProtocols.length} assay protocols
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
