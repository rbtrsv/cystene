'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Receipt, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useFees } from '@/modules/assetmanager/hooks/captable/use-fees';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getFeeTypeLabel, getFrequencyLabel } from '@/modules/assetmanager/schemas/captable/fee.schemas';
import { getScenarioLabel } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
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
 * Sort field options for the fees table
 */
type SortField = 'fee_type' | 'year' | 'amount';
type SortDirection = 'asc' | 'desc' | null;

export default function FeesPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { fees, isLoading, error, fetchFees, getFeesByEntity } = useFees();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch fees when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchFees({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Filter fees for the active entity
  const entityFees = activeEntity
    ? getFeesByEntity(activeEntity.id)
    : [];

  // ==========================================
  // Filter and sort fees
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entityFees];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getFeeTypeLabel(item.fee_type).toLowerCase().includes(term) ||
        (item.fee_cost_name && item.fee_cost_name.toLowerCase().includes(term)) ||
        getFrequencyLabel(item.frequency).toLowerCase().includes(term) ||
        item.year.toString().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'fee_type':
            comparison = a.fee_type.localeCompare(b.fee_type);
            break;
          case 'year':
            comparison = a.year - b.year;
            break;
          case 'amount':
            comparison = (a.amount ?? 0) - (b.amount ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [entityFees, searchTerm, sortField, sortDirection]);

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

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Total count before filters
  const totalCount = entityFees.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
          <p className="text-muted-foreground">
            Manage fees for {activeEntity.name}
          </p>
        </div>
        <Link href="/fees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Fee
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
              placeholder="Search by type, name, or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table or empty state */}
        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No fees yet' : 'No fees match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first fee to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/fees/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Fee
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
                      onClick={() => handleSort('fee_type')}
                    >
                      Type
                      <SortIndicator field="fee_type" />
                    </Button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('year')}
                    >
                      Year
                      <SortIndicator field="year" />
                    </Button>
                  </TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <SortIndicator field="amount" />
                    </Button>
                  </TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((fee) => (
                  <TableRow
                    key={fee.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/fees/${fee.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {getFeeTypeLabel(fee.fee_type)}
                      </div>
                    </TableCell>
                    <TableCell>{fee.fee_cost_name || '—'}</TableCell>
                    <TableCell>
                      {fee.year}
                      {fee.quarter ? ` ${fee.quarter}` : ''}
                    </TableCell>
                    <TableCell>{getFrequencyLabel(fee.frequency)}</TableCell>
                    <TableCell>
                      {fee.amount != null ? `$${fee.amount.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>{getScenarioLabel(fee.scenario)}</TableCell>
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
                              router.push(`/fees/${fee.id}/details`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/fees/${fee.id}/details?tab=edit`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {totalCount} fees
            </p>
          </>
        )}
      </div>
    </div>
  );
}
