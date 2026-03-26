'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
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
import { getAssetTypeLabel } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { FlaskConical, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the therapeutic assets table
 */
type SortField = 'name';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function TherapeuticAssetsPage() {
  const router = useRouter();
  const {
    therapeuticAssets,
    isLoading,
    error,
  } = useTherapeuticAssets();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort therapeutic assets
  // ==========================================

  const filteredAssets = useMemo(() => {
    let filtered = therapeuticAssets;

    // Search by name or UID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(term) ||
        a.uid.toLowerCase().includes(term)
      );
    }

    // Filter by asset type
    if (assetTypeFilter) {
      const term = assetTypeFilter.toLowerCase();
      filtered = filtered.filter(a => a.asset_type.toLowerCase().includes(term));
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [therapeuticAssets, searchTerm, assetTypeFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Therapeutic Assets</h1>
          <p className="text-muted-foreground">
            Manage drugs, biologics, and pipeline candidates
          </p>
        </div>
        <Link href="/therapeutic-assets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Asset
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Therapeutic Assets</CardTitle>
          <CardDescription>
            All therapeutic assets in the registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or UID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Input
                id="assetType"
                placeholder="Filter by asset type..."
                value={assetTypeFilter}
                onChange={(e) => setAssetTypeFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {therapeuticAssets.length === 0 ? 'No therapeutic assets yet' : 'No therapeutic assets match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {therapeuticAssets.length === 0
                  ? 'Create your first therapeutic asset to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {therapeuticAssets.length === 0 && (
                <Link href="/therapeutic-assets/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Asset
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
                    <TableHead>UID</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Project Code</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/therapeutic-assets/${asset.id}/details`)}
                    >
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell className="font-mono text-sm">{asset.uid}</TableCell>
                      <TableCell>{getAssetTypeLabel(asset.asset_type)}</TableCell>
                      <TableCell>{asset.project_code || '—'}</TableCell>
                      <TableCell>{new Date(asset.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/therapeutic-assets/${asset.id}/details`);
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
                Showing {filteredAssets.length} of {therapeuticAssets.length} therapeutic assets
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
