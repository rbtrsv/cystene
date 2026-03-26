'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContextAttributes } from '@/modules/nexotype/hooks/knowledge_graph/use-context-attributes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Tag, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Context Attributes list page
// Displays all context attributes for evidence assertions with search
// filtering by key or value
// ---------------------------------------------------------------------------
export default function ContextAttributesPage() {
  const router = useRouter();
  const { contextAttributes, isLoading, error } = useContextAttributes();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter context attributes by key or value
  const filteredContextAttributes = useMemo(() => {
    let filtered = contextAttributes;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ca =>
        ca.key.toLowerCase().includes(term) ||
        ca.value.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [contextAttributes, searchTerm]);

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
          <h1 className="text-3xl font-bold tracking-tight">Context Attributes</h1>
          <p className="text-muted-foreground">Manage context attributes for evidence assertions</p>
        </div>
        <Link href="/context-attributes/new">
          <Button><Plus className="mr-2 h-4 w-4" />Create Context Attribute</Button>
        </Link>
      </div>

      {/* Context attributes table card */}
      <Card>
        <CardHeader>
          <CardTitle>Context Attributes</CardTitle>
          <CardDescription>All context attributes in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input — filters by key or value */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by key or value..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {filteredContextAttributes.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {contextAttributes.length === 0 ? 'No context attributes yet' : 'No context attributes match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {contextAttributes.length === 0 ? 'Create your first context attribute' : 'Try adjusting your search'}
              </p>
              {contextAttributes.length === 0 && (
                <Link href="/context-attributes/new"><Button><Plus className="mr-2 h-4 w-4" />Create Context Attribute</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Results table */}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Evidence ID</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredContextAttributes.map((ca) => (
                    <TableRow key={ca.id} className="cursor-pointer" onClick={() => router.push(`/context-attributes/${ca.id}/details`)}>
                      <TableCell className="font-medium">{ca.id}</TableCell>
                      <TableCell>{ca.evidence_id}</TableCell>
                      <TableCell>{ca.key}</TableCell>
                      <TableCell>{ca.value}</TableCell>
                      <TableCell>{new Date(ca.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/context-attributes/${ca.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filteredContextAttributes.length} of {contextAttributes.length} context attributes</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
