'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scale, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useBalanceSheets } from '@/modules/assetmanager/hooks/financial/use-balance-sheets';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { SCENARIO_OPTIONS } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
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
 * Sort field options for the balance sheets table
 */
type SortField = 'year' | 'total_assets' | 'total_liabilities' | 'total_shareholders_equity';
type SortDirection = 'asc' | 'desc' | null;

export default function BalanceSheetsPage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { balanceSheets, isLoading, error, fetchBalanceSheets } = useBalanceSheets();

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch all accessible balance sheets (backend filters by user entity access)
  useEffect(() => {
    if (activeEntity) {
      fetchBalanceSheets({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Build entity options for the filter dropdown from entities that have balance sheets
  const entityFilterOptions = useMemo(() => {
    const entityIds = [...new Set(balanceSheets.map((item) => item.entity_id))];
    return entityIds.map((id) => ({
      id,
      name: getEntityName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [balanceSheets, getEntityName]);

  // ==========================================
  // Filter and sort balance sheets
  // ==========================================

  const filteredRows = useMemo(() => {
    // Start with all accessible balance sheets (backend already filters by user access)
    let filtered = [...balanceSheets];

    // Filter by specific entity
    if (entityFilter !== 'all') {
      const entityId = parseInt(entityFilter);
      filtered = filtered.filter((item) => item.entity_id === entityId);
    }

    // Filter by scenario
    if (scenarioFilter !== 'all') {
      filtered = filtered.filter((item) => item.scenario === scenarioFilter);
    }

    // Filter by year
    if (yearFilter) {
      const year = parseInt(yearFilter);
      if (!isNaN(year)) {
        filtered = filtered.filter((item) => item.year === year);
      }
    }

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getEntityName(item.entity_id).toLowerCase().includes(term) ||
        item.scenario.toLowerCase().includes(term) ||
        item.year.toString().includes(term) ||
        (item.quarter && item.quarter.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'year':
            comparison = a.year - b.year;
            break;
          case 'total_assets':
            comparison = (a.total_assets ?? 0) - (b.total_assets ?? 0);
            break;
          case 'total_liabilities':
            comparison = (a.total_liabilities ?? 0) - (b.total_liabilities ?? 0);
            break;
          case 'total_shareholders_equity':
            comparison = (a.total_shareholders_equity ?? 0) - (b.total_shareholders_equity ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [balanceSheets, entityFilter, scenarioFilter, yearFilter, searchTerm, sortField, sortDirection, getEntityName]);

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

  // Helper to format nullable currency values
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';

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

  // Total count before filters (all accessible balance sheets)
  const totalCount = balanceSheets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance Sheets</h1>
          <p className="text-muted-foreground">
            Manage balance sheet records across all accessible entities
          </p>
        </div>
        <Link href="/balance-sheets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Balance Sheet
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-4">
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
              <Label htmlFor="scenario-filter">Scenario</Label>
              <Select value={scenarioFilter} onValueChange={setScenarioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Scenarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scenarios</SelectItem>
                  {SCENARIO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-filter">Year</Label>
              <Input
                id="year-filter"
                type="number"
                placeholder="Filter by year..."
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Scale className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {totalCount === 0 ? 'No balance sheets yet' : 'No balance sheets match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalCount === 0
                    ? 'Create your first balance sheet to track assets, liabilities, and equity'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {totalCount === 0 && (
                  <Link href="/balance-sheets/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Balance Sheet
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
                        onClick={() => handleSort('year')}
                      >
                        Year
                        <SortIndicator field="year" />
                      </Button>
                    </TableHead>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('total_assets')}
                      >
                        Total Assets
                        <SortIndicator field="total_assets" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('total_liabilities')}
                      >
                        Total Liabilities
                        <SortIndicator field="total_liabilities" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('total_shareholders_equity')}
                      >
                        Total Equity
                        <SortIndicator field="total_shareholders_equity" />
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
                      onClick={() => router.push(`/balance-sheets/${item.id}/details`)}
                    >
                      <TableCell className="font-medium">
                        {getEntityName(item.entity_id)}
                      </TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell className="capitalize">{item.scenario}</TableCell>
                      <TableCell>{item.quarter || '—'}</TableCell>
                      <TableCell>{fmtCurrency(item.total_assets)}</TableCell>
                      <TableCell>{fmtCurrency(item.total_liabilities)}</TableCell>
                      <TableCell>{fmtCurrency(item.total_shareholders_equity)}</TableCell>
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
                                router.push(`/balance-sheets/${item.id}/details`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/balance-sheets/${item.id}/details?tab=edit`);
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
                Showing {filteredRows.length} of {totalCount} balance sheets
              </p>
            </>
          )}
        </div>
    </div>
  );
}
