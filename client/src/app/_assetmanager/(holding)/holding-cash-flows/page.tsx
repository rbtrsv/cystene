'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDownUp, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useHoldingCashFlows } from '@/modules/assetmanager/hooks/holding/use-holding-cash-flows';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useHoldings } from '@/modules/assetmanager/hooks/holding/use-holdings';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
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
// Enum dropdown options
// ==========================================

const CASH_FLOW_TYPE_OPTIONS = [
  { value: 'investment', label: 'Investment' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'fee', label: 'Fee' },
  { value: 'other', label: 'Other' },
] as const;

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the holding cash flows table
 */
type SortField = 'date' | 'amount_debit' | 'amount_credit';
type SortDirection = 'asc' | 'desc' | null;

export default function HoldingCashFlowsPage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { holdingCashFlows, isLoading, error, fetchHoldingCashFlows } = useHoldingCashFlows();
  const { holdings, fetchHoldings } = useHoldings();

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch all accessible holding cash flows and holdings (backend filters by user entity access)
  useEffect(() => {
    if (activeEntity) {
      fetchHoldingCashFlows({});
      fetchHoldings({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Helper to resolve holding name
  const getHoldingName = (holdingId: number): string => {
    const holding = holdings.find((h) => h.id === holdingId);
    return holding ? holding.investment_name : `Holding #${holdingId}`;
  };

  // Build entity options for the filter dropdown from entities that have cash flows
  const entityFilterOptions = useMemo(() => {
    const entityIds = [...new Set(holdingCashFlows.map((item) => item.entity_id))];
    return entityIds.map((id) => ({
      id,
      name: getEntityName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [holdingCashFlows, getEntityName]);

  // ==========================================
  // Filter and sort holding cash flows
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...holdingCashFlows];

    // Filter by specific entity
    if (entityFilter !== 'all') {
      const entityId = parseInt(entityFilter);
      filtered = filtered.filter((item) => item.entity_id === entityId);
    }

    // Filter by cash flow type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.cash_flow_type === typeFilter);
    }

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getEntityName(item.entity_id).toLowerCase().includes(term) ||
        getHoldingName(item.holding_id).toLowerCase().includes(term) ||
        item.cash_flow_type.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.scenario.toLowerCase().includes(term) ||
        item.currency.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.transaction_reference && item.transaction_reference.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = a.date.localeCompare(b.date);
            break;
          case 'amount_debit':
            comparison = a.amount_debit - b.amount_debit;
            break;
          case 'amount_credit':
            comparison = a.amount_credit - b.amount_credit;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdingCashFlows, entityFilter, typeFilter, searchTerm, sortField, sortDirection, getEntityName, holdings]);

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

  // Helper to format currency values
  const fmtCurrency = (val: number, currency: string): string =>
    `${currency} ${val.toLocaleString()}`;

  // Helper to capitalize enum values
  const fmtEnum = (val: string): string =>
    val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

  const totalCount = holdingCashFlows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holding Cash Flows</h1>
          <p className="text-muted-foreground">
            Manage holding cash flows across all accessible entities
          </p>
        </div>
        <Link href="/holding-cash-flows/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Cash Flow
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label>Cash Flow Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {CASH_FLOW_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by holding, type, category, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowDownUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {totalCount === 0 ? 'No holding cash flows yet' : 'No cash flows match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalCount === 0
                    ? 'Create your first holding cash flow to start tracking investment movements'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {totalCount === 0 && (
                  <Link href="/holding-cash-flows/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Cash Flow
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
                    <TableHead>Holding</TableHead>
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
                    <TableHead>Type</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('amount_debit')}
                      >
                        Debit
                        <SortIndicator field="amount_debit" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('amount_credit')}
                      >
                        Credit
                        <SortIndicator field="amount_credit" />
                      </Button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/holding-cash-flows/${item.id}/details`)}
                    >
                      <TableCell className="font-medium">
                        {getEntityName(item.entity_id)}
                      </TableCell>
                      <TableCell>{getHoldingName(item.holding_id)}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{fmtEnum(item.cash_flow_type)}</TableCell>
                      <TableCell>{fmtCurrency(item.amount_debit, item.currency)}</TableCell>
                      <TableCell>{fmtCurrency(item.amount_credit, item.currency)}</TableCell>
                      <TableCell>{fmtEnum(item.category)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/holding-cash-flows/${item.id}/details`); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/holding-cash-flows/${item.id}/details?tab=edit`); }}>
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
                Showing {filteredRows.length} of {totalCount} holding cash flows
              </p>
            </>
          )}
        </div>
    </div>
  );
}
