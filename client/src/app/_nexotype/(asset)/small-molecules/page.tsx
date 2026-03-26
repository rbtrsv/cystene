'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSmallMolecules } from '@/modules/nexotype/hooks/asset/use-small-molecules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Pill, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the small molecules table
 */
type SortField = 'name' | 'uid';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function SmallMoleculesPage() {
  const router = useRouter();
  const {
    smallMolecules,
    isLoading,
    error,
  } = useSmallMolecules();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort small molecules
  // ==========================================

  const filteredMolecules = useMemo(() => {
    let filtered = smallMolecules;

    // Search by name, UID, SMILES, or InChI Key
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.uid.toLowerCase().includes(term) ||
        m.smiles.toLowerCase().includes(term) ||
        (m.inchi_key && m.inchi_key.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'uid':
            comparison = a.uid.localeCompare(b.uid);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [smallMolecules, searchTerm, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  // ==========================================
  // Render
  // ==========================================

  // Guard: loading state.
  if (isLoading) {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Small Molecules</h1>
          <p className="text-muted-foreground">
            Manage small molecule chemical agents (NMEs)
          </p>
        </div>
        <Link href="/small-molecules/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Small Molecule
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Small Molecules</CardTitle>
          <CardDescription>
            All small molecules in the asset registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, UID, SMILES, or InChI Key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredMolecules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {smallMolecules.length === 0 ? 'No small molecules yet' : 'No small molecules match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {smallMolecules.length === 0
                  ? 'Create your first small molecule to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {smallMolecules.length === 0 && (
                <Link href="/small-molecules/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Small Molecule
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        <SortIndicator field="name" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('uid')}
                      >
                        UID
                        <SortIndicator field="uid" />
                      </Button>
                    </TableHead>
                    <TableHead>Project Code</TableHead>
                    <TableHead>InChI Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMolecules.map((molecule) => (
                    <TableRow
                      key={molecule.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/small-molecules/${molecule.id}/details`)}
                    >
                      <TableCell className="font-medium">{molecule.name}</TableCell>
                      <TableCell>{molecule.uid}</TableCell>
                      <TableCell>{molecule.project_code || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{molecule.inchi_key || '—'}</TableCell>
                      <TableCell>{new Date(molecule.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/small-molecules/${molecule.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredMolecules.length} of {smallMolecules.length} small molecules
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
