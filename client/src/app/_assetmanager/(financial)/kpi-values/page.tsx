'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useKPIValues } from '@/modules/assetmanager/hooks/financial/use-kpi-values';
import { useKPIs } from '@/modules/assetmanager/hooks/financial/use-kpis';
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
 * Sort field options for the KPI values table
 */
type SortField = 'year' | 'value';
type SortDirection = 'asc' | 'desc' | null;

export default function KPIValuesPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { kpis, fetchKPIs } = useKPIs();
  const { kpiValues, isLoading, error, fetchKPIValues } = useKPIValues();

  // Filter state
  const [kpiFilter, setKpiFilter] = useState<string>('all');
  const [kpiPopoverOpen, setKpiPopoverOpen] = useState(false);
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch KPIs for the active entity and all KPI values
  useEffect(() => {
    if (activeEntity) {
      fetchKPIs({ entity_id: activeEntity.id });
      fetchKPIValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // KPIs belonging to the active entity
  const entityKpis = useMemo(() => {
    if (!activeEntity) return [];
    return kpis.filter((kpi) => kpi.entity_id === activeEntity.id);
  }, [kpis, activeEntity]);

  // Set of KPI IDs for the active entity (for filtering values)
  const entityKpiIds = useMemo(() => {
    return new Set(entityKpis.map((kpi) => kpi.id));
  }, [entityKpis]);

  // Helper to get KPI name by ID
  const getKpiName = (kpiId: number): string => {
    const kpi = kpis.find((k) => k.id === kpiId);
    return kpi ? kpi.name : `KPI #${kpiId}`;
  };

  // ==========================================
  // Filter and sort KPI values
  // ==========================================

  const filteredRows = useMemo(() => {
    // Start with KPI values belonging to the active entity's KPIs
    let filtered = kpiValues.filter((item) => entityKpiIds.has(item.kpi_id));

    // Filter by specific KPI
    if (kpiFilter !== 'all') {
      const kpiId = parseInt(kpiFilter);
      filtered = filtered.filter((item) => item.kpi_id === kpiId);
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
        getKpiName(item.kpi_id).toLowerCase().includes(term) ||
        item.scenario.toLowerCase().includes(term) ||
        item.year.toString().includes(term) ||
        (item.quarter && item.quarter.toLowerCase().includes(term)) ||
        (item.notes && item.notes.toLowerCase().includes(term))
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
          case 'value':
            comparison = (a.value ?? 0) - (b.value ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kpiValues, entityKpiIds, kpiFilter, scenarioFilter, yearFilter, searchTerm, sortField, sortDirection]);

  // Total count of entity's KPI values (before filters)
  const totalCount = useMemo(() => {
    return kpiValues.filter((item) => entityKpiIds.has(item.kpi_id)).length;
  }, [kpiValues, entityKpiIds]);

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

  // Helper to format nullable numbers
  const fmtNum = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Values</h1>
          <p className="text-muted-foreground">
            Manage KPI data points for {activeEntity.name}
          </p>
        </div>
        <Link href="/kpi-values/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create KPI Value
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>KPI</Label>
              <Popover open={kpiPopoverOpen} onOpenChange={setKpiPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={kpiPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {kpiFilter === 'all'
                        ? 'All KPIs'
                        : entityKpis.find((kpi) => kpi.id.toString() === kpiFilter)?.name || 'All KPIs'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search KPI..." />
                    <CommandList>
                      <CommandEmpty>No KPIs found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All KPIs"
                          onSelect={() => {
                            setKpiFilter('all');
                            setKpiPopoverOpen(false);
                          }}
                        >
                          All KPIs
                          {kpiFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {entityKpis.map((kpi) => (
                          <CommandItem
                            key={kpi.id}
                            value={kpi.name}
                            onSelect={() => {
                              setKpiFilter(kpi.id.toString());
                              setKpiPopoverOpen(false);
                            }}
                          >
                            {kpi.name}
                            {kpiFilter === kpi.id.toString() && (
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
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {totalCount === 0 ? 'No KPI values yet' : 'No KPI values match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalCount === 0
                    ? 'Create your first KPI value to start recording performance data'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {totalCount === 0 && (
                  <Link href="/kpi-values/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create KPI Value
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
                    <TableHead>KPI</TableHead>
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
                        onClick={() => handleSort('value')}
                      >
                        Value
                        <SortIndicator field="value" />
                      </Button>
                    </TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/kpi-values/${item.id}/details`)}
                    >
                      <TableCell className="font-medium">
                        {getKpiName(item.kpi_id)}
                      </TableCell>
                      <TableCell>{item.year}</TableCell>
                      <TableCell className="capitalize">{item.scenario}</TableCell>
                      <TableCell>{item.quarter || '—'}</TableCell>
                      <TableCell>{fmtNum(item.value)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.notes || '—'}
                      </TableCell>
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
                                router.push(`/kpi-values/${item.id}/details`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/kpi-values/${item.id}/details?tab=edit`);
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
                Showing {filteredRows.length} of {totalCount} KPI values
              </p>
            </>
          )}
        </div>
    </div>
  );
}
