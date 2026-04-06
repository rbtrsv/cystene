'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useHoldingPerformances } from '@/modules/assetmanager/hooks/holding/use-holding-performances';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
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
 * Sort field options for the holding performance table
 */
type SortField = 'report_date' | 'total_invested_amount' | 'irr';
type SortDirection = 'asc' | 'desc' | null;

export default function HoldingPerformancePage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { holdingPerformances, isLoading, error, fetchHoldingPerformances } = useHoldingPerformances();
  const { getFundingRoundName } = useFundingRounds();

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch all accessible holding performances (backend filters by user entity access)
  useEffect(() => {
    if (activeEntity) {
      fetchHoldingPerformances({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Build entity options for the filter dropdown from entities that have performance records
  const entityFilterOptions = useMemo(() => {
    const entityIds = [...new Set(holdingPerformances.map((item) => item.entity_id))];
    return entityIds.map((id) => ({
      id,
      name: getEntityName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [holdingPerformances, getEntityName]);

  // ==========================================
  // Filter and sort holding performances
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...holdingPerformances];

    // Filter by specific entity
    if (entityFilter !== 'all') {
      const entityId = parseInt(entityFilter);
      filtered = filtered.filter((item) => item.entity_id === entityId);
    }

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getEntityName(item.entity_id).toLowerCase().includes(term) ||
        item.report_date.toLowerCase().includes(term) ||
        (item.funding_round_id && getFundingRoundName(item.funding_round_id).toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'report_date':
            comparison = a.report_date.localeCompare(b.report_date);
            break;
          case 'total_invested_amount':
            comparison = (a.total_invested_amount ?? 0) - (b.total_invested_amount ?? 0);
            break;
          case 'irr':
            comparison = (a.irr ?? 0) - (b.irr ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [holdingPerformances, entityFilter, searchTerm, sortField, sortDirection, getEntityName, getFundingRoundName]);

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

  // Format helpers
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';
  const fmtDecimal = (val: number | null): string =>
    val != null ? val.toFixed(2) : '—';
  const fmtPercent = (val: number | null): string =>
    val != null ? `${val.toFixed(2)}%` : '—';

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

  const totalCount = holdingPerformances.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holding Performance</h1>
          <p className="text-muted-foreground">
            Manage holding performance records across all accessible entities
          </p>
        </div>
        <Link href="/holding-performance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Performance
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Entity</Label>
              <Popover open={entityPopoverOpen} onOpenChange={setEntityPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={entityPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {entityFilter === 'all'
                        ? 'All Entities'
                        : entityFilterOptions.find((opt) => opt.id.toString() === entityFilter)?.name || 'All Entities'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search entity..." />
                    <CommandList>
                      <CommandEmpty>No entities found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Entities"
                          onSelect={() => {
                            setEntityFilter('all');
                            setEntityPopoverOpen(false);
                          }}
                        >
                          All Entities
                          {entityFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {entityFilterOptions.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setEntityFilter(opt.id.toString());
                              setEntityPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {entityFilter === opt.id.toString() && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by entity, date, funding round..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {totalCount === 0 ? 'No performance records yet' : 'No records match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalCount === 0
                    ? 'Create your first holding performance record to start tracking returns'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {totalCount === 0 && (
                  <Link href="/holding-performance/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Performance
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
                    <TableHead>Entity</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('report_date')}
                      >
                        Report Date
                        <SortIndicator field="report_date" />
                      </Button>
                    </TableHead>
                    <TableHead>Funding Round</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('total_invested_amount')}
                      >
                        Total Invested
                        <SortIndicator field="total_invested_amount" />
                      </Button>
                    </TableHead>
                    <TableHead>Fair Value</TableHead>
                    <TableHead>TVPI</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('irr')}
                      >
                        IRR
                        <SortIndicator field="irr" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/holding-performance/${item.id}/details`)}
                    >
                      <TableCell className="font-medium">
                        {getEntityName(item.entity_id)}
                      </TableCell>
                      <TableCell>{item.report_date}</TableCell>
                      <TableCell>
                        {item.funding_round_id
                          ? getFundingRoundName(item.funding_round_id)
                          : '—'}
                      </TableCell>
                      <TableCell>{fmtCurrency(item.total_invested_amount)}</TableCell>
                      <TableCell>{fmtCurrency(item.fair_value)}</TableCell>
                      <TableCell>{fmtDecimal(item.tvpi)}</TableCell>
                      <TableCell>{fmtPercent(item.irr)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/holding-performance/${item.id}/details`); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/holding-performance/${item.id}/details?tab=edit`); }}>
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
                Showing {filteredRows.length} of {totalCount} performance records
              </p>
            </>
          )}
        </div>
    </div>
  );
}
