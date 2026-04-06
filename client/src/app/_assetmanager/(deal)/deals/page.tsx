'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Handshake, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useDeals } from '@/modules/assetmanager/hooks/deal/use-deals';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getDealTypeLabel } from '@/modules/assetmanager/schemas/deal/deal.schemas';
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

type SortField = 'name' | 'deal_type' | 'target_amount' | 'firm_commitments';
type SortDirection = 'asc' | 'desc' | null;

export default function DealsPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { deals, isLoading, error, fetchDeals, getDealsByEntity } = useDeals();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    if (activeEntity) {
      fetchDeals({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  const entityDeals = activeEntity ? getDealsByEntity(activeEntity.id) : deals;

  // ==========================================
  // Filter and sort deals
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entityDeals];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        getDealTypeLabel(item.deal_type).toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term)
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'deal_type':
            comparison = a.deal_type.localeCompare(b.deal_type);
            break;
          case 'target_amount':
            comparison = (a.target_amount ?? 0) - (b.target_amount ?? 0);
            break;
          case 'firm_commitments':
            comparison = a.firm_commitments - b.firm_commitments;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [entityDeals, searchTerm, sortField, sortDirection]);

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

  const totalCount = entityDeals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">Manage deals for {activeEntity.name}</p>
        </div>
        <Link href="/deals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Deal
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
              placeholder="Search by name, type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No deals yet' : 'No deals match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first deal to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/deals/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Deal
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
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('name')}>
                      Name
                      <SortIndicator field="name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('deal_type')}>
                      Type
                      <SortIndicator field="deal_type" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('target_amount')}>
                      Target
                      <SortIndicator field="target_amount" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('firm_commitments')}>
                      Firm Commitments
                      <SortIndicator field="firm_commitments" />
                    </Button>
                  </TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/deals/${deal.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Handshake className="h-4 w-4 text-muted-foreground" />
                        {deal.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getDealTypeLabel(deal.deal_type)}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{deal.status}</TableCell>
                    <TableCell>
                      {deal.target_amount != null ? `$${deal.target_amount.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>${deal.firm_commitments.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      {deal.start_date} — {deal.end_date}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deals/${deal.id}/details`); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deals/${deal.id}/details?tab=edit`); }}>
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
              Showing {filteredRows.length} of {totalCount} deals
            </p>
          </>
        )}
      </div>
    </div>
  );
}
