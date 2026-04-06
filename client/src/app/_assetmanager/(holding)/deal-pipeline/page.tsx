'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitPullRequest, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useDealPipelines } from '@/modules/assetmanager/hooks/holding/use-deal-pipelines';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
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

const PIPELINE_STATUS_OPTIONS = [
  { value: 'initial_screening', label: 'Initial Screening' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' },
  { value: 'passed', label: 'Passed' },
  { value: 'rejected', label: 'Rejected' },
] as const;

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the deal pipeline table
 */
type SortField = 'deal_name' | 'investment_amount';
type SortDirection = 'asc' | 'desc' | null;

export default function DealPipelinePage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { dealPipelines, isLoading, error, fetchDealPipelines } = useDealPipelines();

  // Filter state
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch all accessible deal pipelines (backend filters by user entity access)
  useEffect(() => {
    if (activeEntity) {
      fetchDealPipelines({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Build entity options for the filter dropdown from entities that have deal pipelines
  const entityFilterOptions = useMemo(() => {
    const entityIds = [...new Set(dealPipelines.map((item) => item.entity_id))];
    return entityIds.map((id) => ({
      id,
      name: getEntityName(id),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [dealPipelines, getEntityName]);

  // ==========================================
  // Filter and sort deal pipelines
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...dealPipelines];

    // Filter by specific entity
    if (entityFilter !== 'all') {
      const entityId = parseInt(entityFilter);
      filtered = filtered.filter((item) => item.entity_id === entityId);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getEntityName(item.entity_id).toLowerCase().includes(term) ||
        item.deal_name.toLowerCase().includes(term) ||
        (item.company_name && item.company_name.toLowerCase().includes(term)) ||
        item.priority.toLowerCase().includes(term) ||
        item.sector.toLowerCase().includes(term) ||
        item.round_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'deal_name':
            comparison = a.deal_name.localeCompare(b.deal_name);
            break;
          case 'investment_amount':
            comparison = (a.investment_amount ?? 0) - (b.investment_amount ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [dealPipelines, entityFilter, statusFilter, searchTerm, sortField, sortDirection, getEntityName]);

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

  // Helper to format nullable currency values
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';

  // Helper to format status display
  const fmtStatus = (val: string): string =>
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

  const totalCount = dealPipelines.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deal Pipeline</h1>
          <p className="text-muted-foreground">
            Manage deal pipeline entries across all accessible entities
          </p>
        </div>
        <Link href="/deal-pipeline/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Deal Pipeline
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
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PIPELINE_STATUS_OPTIONS.map((opt) => (
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
                placeholder="Search by name, company, priority, sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitPullRequest className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {totalCount === 0 ? 'No deal pipeline entries yet' : 'No entries match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {totalCount === 0
                    ? 'Create your first deal pipeline entry to start tracking potential investments'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {totalCount === 0 && (
                  <Link href="/deal-pipeline/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Deal Pipeline
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
                        onClick={() => handleSort('deal_name')}
                      >
                        Deal Name
                        <SortIndicator field="deal_name" />
                      </Button>
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('investment_amount')}
                      >
                        Investment Amount
                        <SortIndicator field="investment_amount" />
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
                      onClick={() => router.push(`/deal-pipeline/${item.id}/details`)}
                    >
                      <TableCell className="font-medium">
                        {getEntityName(item.entity_id)}
                      </TableCell>
                      <TableCell>{item.deal_name}</TableCell>
                      <TableCell>{item.company_name || '—'}</TableCell>
                      <TableCell>{fmtStatus(item.status)}</TableCell>
                      <TableCell className="uppercase">{item.priority}</TableCell>
                      <TableCell>{item.sector}</TableCell>
                      <TableCell>{fmtCurrency(item.investment_amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deal-pipeline/${item.id}/details`); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/deal-pipeline/${item.id}/details?tab=edit`); }}>
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
                Showing {filteredRows.length} of {totalCount} deal pipeline entries
              </p>
            </>
          )}
        </div>
    </div>
  );
}
