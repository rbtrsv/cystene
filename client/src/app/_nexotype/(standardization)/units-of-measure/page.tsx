'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnitsOfMeasure } from '@/modules/nexotype/hooks/standardization/use-units-of-measure';
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
import { Ruler, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the units of measure table
 */
type SortField = 'name' | 'symbol';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UnitsOfMeasurePage() {
  const router = useRouter();
  const {
    unitsOfMeasure,
    isLoading,
    error,
  } = useUnitsOfMeasure();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort units of measure
  // ==========================================

  const filteredUnitsOfMeasure = useMemo(() => {
    let filtered = unitsOfMeasure;

    // Search by name or symbol
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(uom =>
        uom.name.toLowerCase().includes(term) ||
        uom.symbol.toLowerCase().includes(term)
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
          case 'symbol':
            comparison = a.symbol.localeCompare(b.symbol);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [unitsOfMeasure, searchTerm, sortField, sortDirection]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Units of Measure</h1>
          <p className="text-muted-foreground">
            Manage units for dimensional consistency in lab data (nM, mg/kg, IU/mL)
          </p>
        </div>
        <Link href="/units-of-measure/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Unit of Measure
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Units of Measure</CardTitle>
          <CardDescription>
            All units of measure in the standardization registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filteredUnitsOfMeasure.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {unitsOfMeasure.length === 0 ? 'No units of measure yet' : 'No units of measure match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {unitsOfMeasure.length === 0
                  ? 'Create your first unit of measure to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {unitsOfMeasure.length === 0 && (
                <Link href="/units-of-measure/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Unit of Measure
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
                        onClick={() => handleSort('symbol')}
                      >
                        Symbol
                        <SortIndicator field="symbol" />
                      </Button>
                    </TableHead>
                    <TableHead>SI Conversion Factor</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnitsOfMeasure.map((unitOfMeasure) => (
                    <TableRow
                      key={unitOfMeasure.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/units-of-measure/${unitOfMeasure.id}/details`)}
                    >
                      <TableCell className="font-medium">{unitOfMeasure.name}</TableCell>
                      <TableCell>{unitOfMeasure.symbol}</TableCell>
                      <TableCell>{unitOfMeasure.si_conversion_factor ?? '—'}</TableCell>
                      <TableCell>{new Date(unitOfMeasure.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/units-of-measure/${unitOfMeasure.id}/details`);
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
                Showing {filteredUnitsOfMeasure.length} of {unitsOfMeasure.length} units of measure
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
