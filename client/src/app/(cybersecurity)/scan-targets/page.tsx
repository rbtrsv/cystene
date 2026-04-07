'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Target, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil, ShieldCheck } from 'lucide-react';

import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getTargetTypeLabel } from '@/modules/cybersecurity/schemas/infrastructure/scan-targets.schemas';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shadcnui/components/ui/dropdown-menu';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the scan targets table
 */
type SortField = 'name' | 'target_type' | 'target_value';
type SortDirection = 'asc' | 'desc' | null;

export default function ScanTargetsPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { scanTargets, isLoading, error, fetchScanTargets, verifyScanTarget } = useScanTargets();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch scan targets when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchScanTargets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort scan targets
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...scanTargets];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        item.target_value.toLowerCase().includes(term) ||
        getTargetTypeLabel(item.target_type).toLowerCase().includes(term)
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
          case 'target_type':
            comparison = a.target_type.localeCompare(b.target_type);
            break;
          case 'target_value':
            comparison = a.target_value.localeCompare(b.target_value);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [scanTargets, searchTerm, sortField, sortDirection]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!activeOrganization) {
    return (
      <Alert>
        <AlertDescription>
          Please select an organization first.{' '}
          <Link href="/organizations" className="underline">
            Go to Organizations
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Total count before filters
  const totalCount = scanTargets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan Targets</h1>
          <p className="text-muted-foreground">
            Manage scan targets for {activeOrganization.name}
          </p>
        </div>
        <Link href="/scan-targets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Target
          </Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, value, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table or empty state */}
        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No scan targets yet' : 'No targets match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Add your first scan target to start scanning'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/scan-targets/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Target
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
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
                      onClick={() => handleSort('target_type')}
                    >
                      Type
                      <SortIndicator field="target_type" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('target_value')}
                    >
                      Value
                      <SortIndicator field="target_value" />
                    </Button>
                  </TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((target) => (
                  <TableRow
                    key={target.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/scan-targets/${target.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        {target.name}
                      </div>
                    </TableCell>
                    <TableCell>{getTargetTypeLabel(target.target_type)}</TableCell>
                    <TableCell className="font-mono text-sm">{target.target_value}</TableCell>
                    <TableCell>
                      {target.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <ShieldCheck className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not verified</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(target.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/scan-targets/${target.id}/details`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/scan-targets/${target.id}/details?tab=edit`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {!target.is_verified && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                verifyScanTarget(target.id);
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Verify Ownership
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {totalCount} scan targets
            </p>
          </>
        )}
      </div>
    </div>
  );
}
