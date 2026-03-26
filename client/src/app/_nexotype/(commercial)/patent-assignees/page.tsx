'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatentAssignees } from '@/modules/nexotype/hooks/commercial/use-patent-assignees';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { UserCheck, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'assignment_date';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Patent Assignees list page
// Displays all patent assignees with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function PatentAssigneesPage() {
  const router = useRouter();
  const { patentAssignees, isLoading, error } = usePatentAssignees();

  // Get referenced entities for FK name resolution
  const { patents } = usePatents();
  const { marketOrganizations } = useMarketOrganizations();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [patentFilter, setPatentFilter] = useState<string>('all');
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve patent name from FK ID
  const getPatentName = (patentId: number) => {
    const patent = patents.find(p => p.id === patentId);
    return patent ? patent.patent_number : `Patent #${patentId}`;
  };

  // Helper to resolve organization name from FK ID
  const getOrgName = (orgId: number) => {
    const org = marketOrganizations.find(o => o.id === orgId);
    return org ? org.legal_name : `Organization #${orgId}`;
  };

  // Build filter options from entities that appear in patent assignees
  const patentFilterOptions = useMemo(() => {
    const patentIds = [...new Set(patentAssignees.map(pa => pa.patent_id))];
    return patentIds.map(id => ({
      id,
      name: patents.find(p => p.id === id)?.patent_number || `Patent #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [patentAssignees, patents]);

  const orgFilterOptions = useMemo(() => {
    const orgIds = [...new Set(patentAssignees.map(pa => pa.market_organization_id))];
    return orgIds.map(id => ({
      id,
      name: marketOrganizations.find(o => o.id === id)?.legal_name || `Organization #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [patentAssignees, marketOrganizations]);

  // ==========================================
  // Filter and sort patent assignees
  // ==========================================

  const filteredPatentAssignees = useMemo(() => {
    let filtered = [...patentAssignees];

    // Filter by patent
    if (patentFilter !== 'all') {
      const patentId = parseInt(patentFilter);
      filtered = filtered.filter(pa => pa.patent_id === patentId);
    }

    // Filter by organization
    if (orgFilter !== 'all') {
      const orgId = parseInt(orgFilter);
      filtered = filtered.filter(pa => pa.market_organization_id === orgId);
    }

    // Search by assignment_date
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pa =>
        pa.assignment_date && pa.assignment_date.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'assignment_date':
            comparison = (a.assignment_date || '').localeCompare(b.assignment_date || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [patentAssignees, patentFilter, orgFilter, searchTerm, sortField, sortDirection]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>);
  }

  const totalCount = patentAssignees.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Patent Assignees</h1>
          <p className="text-muted-foreground">Manage patent assignees in the commercial registry</p>
        </div>
        <Link href="/patent-assignees/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Patent Assignee
          </Button>
        </Link>
      </div>

      {/* Patent assignees table card */}
      <Card>
        <CardHeader>
          <CardTitle>Patent Assignees</CardTitle>
          <CardDescription>All patent assignees in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Patent FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Patent</Label>
              <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={patentPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {patentFilter === 'all'
                        ? 'All Patents'
                        : patentFilterOptions.find(opt => opt.id.toString() === patentFilter)?.name || 'All Patents'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search patent..." />
                    <CommandList>
                      <CommandEmpty>No patents found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Patents"
                          onSelect={() => {
                            setPatentFilter('all');
                            setPatentPopoverOpen(false);
                          }}
                        >
                          All Patents
                          {patentFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {patentFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setPatentFilter(opt.id.toString());
                              setPatentPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {patentFilter === opt.id.toString() && (
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

            {/* Organization FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Organization</Label>
              <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={orgPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {orgFilter === 'all'
                        ? 'All Organizations'
                        : orgFilterOptions.find(opt => opt.id.toString() === orgFilter)?.name || 'All Organizations'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search organization..." />
                    <CommandList>
                      <CommandEmpty>No organizations found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Organizations"
                          onSelect={() => {
                            setOrgFilter('all');
                            setOrgPopoverOpen(false);
                          }}
                        >
                          All Organizations
                          {orgFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {orgFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setOrgFilter(opt.id.toString());
                              setOrgPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {orgFilter === opt.id.toString() && (
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

            {/* Search input — filters by assignment_date */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by assignment date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredPatentAssignees.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No patent assignees yet' : 'No patent assignees match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first patent assignee' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/patent-assignees/new"><Button><Plus className="mr-2 h-4 w-4" />Create Patent Assignee</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Horizontal scroll on mobile for wide tables */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Patent</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('assignment_date')}
                      >
                        Assignment Date
                        <SortIndicator field="assignment_date" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatentAssignees.map((pa) => (
                    <TableRow key={pa.id} className="cursor-pointer" onClick={() => router.push(`/patent-assignees/${pa.id}/details`)}>
                      <TableCell className="font-medium">{pa.id}</TableCell>
                      <TableCell>{getPatentName(pa.patent_id)}</TableCell>
                      <TableCell>{getOrgName(pa.market_organization_id)}</TableCell>
                      <TableCell>{new Date(pa.assignment_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(pa.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/patent-assignees/${pa.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredPatentAssignees.length} of {totalCount} patent assignees
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
