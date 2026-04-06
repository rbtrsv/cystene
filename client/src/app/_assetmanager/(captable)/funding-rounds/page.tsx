'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleDollarSign, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getRoundTypeLabel } from '@/modules/assetmanager/schemas/captable/funding-round.schemas';
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
 * Sort field options for the funding rounds table
 */
type SortField = 'name' | 'round_type' | 'date' | 'target_amount' | 'raised_amount';
type SortDirection = 'asc' | 'desc' | null;

export default function FundingRoundsPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { fundingRounds, isLoading, error, fetchFundingRounds, getFundingRoundsByEntity } = useFundingRounds();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch funding rounds when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchFundingRounds({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Filter funding rounds for the active entity
  const entityFundingRounds = activeEntity
    ? getFundingRoundsByEntity(activeEntity.id)
    : [];

  // ==========================================
  // Filter and sort funding rounds
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entityFundingRounds];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        getRoundTypeLabel(item.round_type).toLowerCase().includes(term)
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
          case 'round_type':
            comparison = a.round_type.localeCompare(b.round_type);
            break;
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'target_amount':
            comparison = a.target_amount - b.target_amount;
            break;
          case 'raised_amount':
            comparison = a.raised_amount - b.raised_amount;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [entityFundingRounds, searchTerm, sortField, sortDirection]);

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
  const totalCount = entityFundingRounds.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funding Rounds</h1>
          <p className="text-muted-foreground">
            Manage funding rounds for {activeEntity.name}
          </p>
        </div>
        <Link href="/funding-rounds/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Funding Round
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
              placeholder="Search by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table or empty state */}
        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CircleDollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No funding rounds yet' : 'No funding rounds match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first funding round to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/funding-rounds/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Funding Round
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
                      onClick={() => handleSort('round_type')}
                    >
                      Type
                      <SortIndicator field="round_type" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      <SortIndicator field="date" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('target_amount')}
                    >
                      Target
                      <SortIndicator field="target_amount" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('raised_amount')}
                    >
                      Raised
                      <SortIndicator field="raised_amount" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((round) => (
                  <TableRow
                    key={round.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/funding-rounds/${round.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        {round.name}
                      </div>
                    </TableCell>
                    <TableCell>{getRoundTypeLabel(round.round_type)}</TableCell>
                    <TableCell>{new Date(round.date).toLocaleDateString()}</TableCell>
                    <TableCell>${round.target_amount.toLocaleString()}</TableCell>
                    <TableCell>${round.raised_amount.toLocaleString()}</TableCell>
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
                              router.push(`/funding-rounds/${round.id}/details`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/funding-rounds/${round.id}/details?tab=edit`);
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
              Showing {filteredRows.length} of {totalCount} funding rounds
            </p>
          </>
        )}
      </div>
    </div>
  );
}
