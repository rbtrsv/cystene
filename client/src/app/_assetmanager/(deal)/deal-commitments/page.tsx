'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HandCoins, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useDealCommitments } from '@/modules/assetmanager/hooks/deal/use-deal-commitments';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useDeals } from '@/modules/assetmanager/hooks/deal/use-deals';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
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

type SortField = 'deal_name' | 'commitment_type' | 'amount';
type SortDirection = 'asc' | 'desc' | null;

export default function DealCommitmentsPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { dealCommitments, isLoading, error, fetchDealCommitments, getCommitmentsByEntity } = useDealCommitments();
  const { getDealById } = useDeals();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    if (activeEntity) {
      fetchDealCommitments({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  const entityCommitments = activeEntity ? getCommitmentsByEntity(activeEntity.id) : dealCommitments;

  // Helper to get deal name
  const getDealName = (dealId: number) => {
    const deal = getDealById(dealId);
    return deal ? deal.name : `Deal #${dealId}`;
  };

  // ==========================================
  // Filter and sort commitments
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entityCommitments];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getDealName(item.deal_id).toLowerCase().includes(term) ||
        item.commitment_type.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term))
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'deal_name':
            comparison = getDealName(a.deal_id).localeCompare(getDealName(b.deal_id));
            break;
          case 'commitment_type':
            comparison = a.commitment_type.localeCompare(b.commitment_type);
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityCommitments, searchTerm, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
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

  const totalCount = entityCommitments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deal Commitments</h1>
          <p className="text-muted-foreground">Manage commitments for {activeEntity.name}</p>
        </div>
        <Link href="/deal-commitments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Commitment
          </Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by deal, type, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HandCoins className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No commitments yet' : 'No commitments match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first commitment to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/deal-commitments/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Commitment
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
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('deal_name')}>
                      Deal
                      <SortIndicator field="deal_name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('commitment_type')}>
                      Type
                      <SortIndicator field="commitment_type" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('amount')}>
                      Amount
                      <SortIndicator field="amount" />
                    </Button>
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityCommitments.length > 0 && filteredRows.map((commitment) => (
                  <TableRow
                    key={commitment.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/deal-commitments/${commitment.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                        {getDealName(commitment.deal_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={commitment.commitment_type === 'firm' ? 'default' : 'secondary'}>
                        {commitment.commitment_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>${commitment.amount.toLocaleString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {commitment.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deal-commitments/${commitment.id}/details`); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deal-commitments/${commitment.id}/details?tab=edit`); }}>
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

            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {totalCount} commitments
            </p>
          </>
        )}
      </div>
    </div>
  );
}
