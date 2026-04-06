'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useValuations } from '@/modules/assetmanager/hooks/holding/use-valuations';
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
 * Sort field options for the valuations table
 */
type SortField = 'date' | 'valuation_value';
type SortDirection = 'asc' | 'desc' | null;

export default function ValuationsPage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { valuations, isLoading, error, fetchValuations } = useValuations();
  const { getFundingRoundName } = useFundingRounds();

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch all accessible valuations (backend filters by user entity access)
  useEffect(() => {
    if (activeEntity) {
      fetchValuations({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Build entity options for the filter dropdown from entities that have valuations
  const entityFilterOptions = useMemo(() => {
    const entityIds = [...new Set(valuations.map((item) => item.entity_id))];
    return entityIds.map((id) => ({
      id,
      name: getEntityName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [valuations, getEntityName]);

  // ==========================================
  // Filter and sort valuations
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...valuations];

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
        (item.date && item.date.toLowerCase().includes(term)) ||
        String(item.valuation_value).includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term)) ||
        (item.funding_round_id && getFundingRoundName(item.funding_round_id).toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = (a.date || '').localeCompare(b.date || '');
            break;
          case 'valuation_value':
            comparison = a.valuation_value - b.valuation_value;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [valuations, entityFilter, searchTerm, sortField, sortDirection, getEntityName, getFundingRoundName]);

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
  const fmtCurrency = (val: number): string =>
    `$${val.toLocaleString()}`;
  const fmtDecimal = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';
  const fmtDecimal4 = (val: number | null): string =>
    val != null ? val.toFixed(4) : '—';

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

  const totalCount = valuations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Valuations</h1>
          <p className="text-muted-foreground">
            Manage valuations across all accessible entities
          </p>
        </div>
        <Link href="/valuations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Valuation
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
                placeholder="Search by date, value, notes, funding round..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {totalCount === 0 ? 'No valuations yet' : 'No valuations match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalCount === 0
                    ? 'Create your first valuation to start tracking company values'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {totalCount === 0 && (
                  <Link href="/valuations/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Valuation
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
                        onClick={() => handleSort('date')}
                      >
                        Date
                        <SortIndicator field="date" />
                      </Button>
                    </TableHead>
                    <TableHead>Funding Round</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('valuation_value')}
                      >
                        Valuation Value
                        <SortIndicator field="valuation_value" />
                      </Button>
                    </TableHead>
                    <TableHead>Total Fund Units</TableHead>
                    <TableHead>NAV/Share</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/valuations/${item.id}/details`)}
                    >
                      <TableCell className="font-medium">
                        {getEntityName(item.entity_id)}
                      </TableCell>
                      <TableCell>{item.date || '—'}</TableCell>
                      <TableCell>
                        {item.funding_round_id
                          ? getFundingRoundName(item.funding_round_id)
                          : '—'}
                      </TableCell>
                      <TableCell>{fmtCurrency(item.valuation_value)}</TableCell>
                      <TableCell>{fmtDecimal(item.total_fund_units)}</TableCell>
                      <TableCell>{fmtDecimal4(item.nav_per_share)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.notes || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/valuations/${item.id}/details`); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/valuations/${item.id}/details?tab=edit`); }}>
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
                Showing {filteredRows.length} of {totalCount} valuations
              </p>
            </>
          )}
        </div>
    </div>
  );
}
