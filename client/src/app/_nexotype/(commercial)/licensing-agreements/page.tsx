'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLicensingAgreements } from '@/modules/nexotype/hooks/commercial/use-licensing-agreements';
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
import { Handshake, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'agreement_type' | 'value_usd' | 'status';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Licensing Agreements list page
// Displays all licensing agreements with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function LicensingAgreementsPage() {
  const router = useRouter();
  const { licensingAgreements, isLoading, error } = useLicensingAgreements();

  // Get referenced entities for FK name resolution
  const { marketOrganizations } = useMarketOrganizations();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [licensorFilter, setLicensorFilter] = useState<string>('all');
  const [licensorPopoverOpen, setLicensorPopoverOpen] = useState(false);
  const [licenseeFilter, setLicenseeFilter] = useState<string>('all');
  const [licenseePopoverOpen, setLicenseePopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve organization name from FK ID
  const getOrgName = (orgId: number) => {
    const org = marketOrganizations.find(o => o.id === orgId);
    return org ? org.legal_name : `Organization #${orgId}`;
  };

  // Build filter options from entities that appear in licensing agreements
  const licensorFilterOptions = useMemo(() => {
    const licensorIds = [...new Set(licensingAgreements.map(la => la.licensor_id))];
    return licensorIds.map(id => ({
      id,
      name: marketOrganizations.find(o => o.id === id)?.legal_name || `Organization #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [licensingAgreements, marketOrganizations]);

  const licenseeFilterOptions = useMemo(() => {
    const licenseeIds = [...new Set(licensingAgreements.map(la => la.licensee_id))];
    return licenseeIds.map(id => ({
      id,
      name: marketOrganizations.find(o => o.id === id)?.legal_name || `Organization #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [licensingAgreements, marketOrganizations]);

  // ==========================================
  // Filter and sort licensing agreements
  // ==========================================

  const filteredLicensingAgreements = useMemo(() => {
    let filtered = [...licensingAgreements];

    // Filter by licensor
    if (licensorFilter !== 'all') {
      const licensorId = parseInt(licensorFilter);
      filtered = filtered.filter(la => la.licensor_id === licensorId);
    }

    // Filter by licensee
    if (licenseeFilter !== 'all') {
      const licenseeId = parseInt(licenseeFilter);
      filtered = filtered.filter(la => la.licensee_id === licenseeId);
    }

    // Search by agreement_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(la =>
        la.agreement_type && la.agreement_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'agreement_type':
            comparison = (a.agreement_type || '').localeCompare(b.agreement_type || '');
            break;
          case 'value_usd':
            comparison = (a.value_usd ?? 0) - (b.value_usd ?? 0);
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [licensingAgreements, licensorFilter, licenseeFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = licensingAgreements.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Licensing Agreements</h1>
          <p className="text-muted-foreground">Manage licensing agreements in the commercial registry</p>
        </div>
        <Link href="/licensing-agreements/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Licensing Agreement
          </Button>
        </Link>
      </div>

      {/* Licensing agreements table card */}
      <Card>
        <CardHeader>
          <CardTitle>Licensing Agreements</CardTitle>
          <CardDescription>All licensing agreements in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Licensor FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Licensor</Label>
              <Popover open={licensorPopoverOpen} onOpenChange={setLicensorPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={licensorPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {licensorFilter === 'all'
                        ? 'All Licensors'
                        : licensorFilterOptions.find(opt => opt.id.toString() === licensorFilter)?.name || 'All Licensors'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search licensor..." />
                    <CommandList>
                      <CommandEmpty>No licensors found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Licensors"
                          onSelect={() => {
                            setLicensorFilter('all');
                            setLicensorPopoverOpen(false);
                          }}
                        >
                          All Licensors
                          {licensorFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {licensorFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setLicensorFilter(opt.id.toString());
                              setLicensorPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {licensorFilter === opt.id.toString() && (
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

            {/* Licensee FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Licensee</Label>
              <Popover open={licenseePopoverOpen} onOpenChange={setLicenseePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={licenseePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {licenseeFilter === 'all'
                        ? 'All Licensees'
                        : licenseeFilterOptions.find(opt => opt.id.toString() === licenseeFilter)?.name || 'All Licensees'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search licensee..." />
                    <CommandList>
                      <CommandEmpty>No licensees found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Licensees"
                          onSelect={() => {
                            setLicenseeFilter('all');
                            setLicenseePopoverOpen(false);
                          }}
                        >
                          All Licensees
                          {licenseeFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {licenseeFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setLicenseeFilter(opt.id.toString());
                              setLicenseePopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {licenseeFilter === opt.id.toString() && (
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

            {/* Search input — filters by agreement_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by agreement type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredLicensingAgreements.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Handshake className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No licensing agreements yet' : 'No licensing agreements match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first licensing agreement' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/licensing-agreements/new"><Button><Plus className="mr-2 h-4 w-4" />Create Licensing Agreement</Button></Link>
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
                    <TableHead>Licensor</TableHead>
                    <TableHead>Licensee</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('agreement_type')}
                      >
                        Agreement Type
                        <SortIndicator field="agreement_type" />
                      </Button>
                    </TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('value_usd')}
                      >
                        Value USD
                        <SortIndicator field="value_usd" />
                      </Button>
                    </TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <SortIndicator field="status" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicensingAgreements.map((la) => (
                    <TableRow key={la.id} className="cursor-pointer" onClick={() => router.push(`/licensing-agreements/${la.id}/details`)}>
                      <TableCell className="font-medium">{la.id}</TableCell>
                      <TableCell>{getOrgName(la.licensor_id)}</TableCell>
                      <TableCell>{getOrgName(la.licensee_id)}</TableCell>
                      <TableCell>{la.agreement_type}</TableCell>
                      <TableCell>{la.territory ?? '—'}</TableCell>
                      <TableCell>{la.value_usd ?? '—'}</TableCell>
                      <TableCell>{new Date(la.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{la.status}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/licensing-agreements/${la.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredLicensingAgreements.length} of {totalCount} licensing agreements
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
