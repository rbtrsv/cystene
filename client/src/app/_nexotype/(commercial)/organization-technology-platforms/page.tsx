'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-organization-technology-platforms';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-technology-platforms';
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
import { Building2, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'utilization_type';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Organization Technology Platforms list page
// Displays all organization-technology platform associations with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function OrganizationTechnologyPlatformsPage() {
  const router = useRouter();
  const { organizationTechnologyPlatforms, isLoading, error } = useOrganizationTechnologyPlatforms();

  // Get referenced entities for FK name resolution
  const { marketOrganizations } = useMarketOrganizations();
  const { technologyPlatforms } = useTechnologyPlatforms();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [platformPopoverOpen, setPlatformPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve organization name from FK ID
  const getOrgName = (orgId: number) => {
    const org = marketOrganizations.find(o => o.id === orgId);
    return org ? org.legal_name : `Organization #${orgId}`;
  };

  // Helper to resolve platform name from FK ID
  const getPlatformName = (platformId: number) => {
    const platform = technologyPlatforms.find(tp => tp.id === platformId);
    return platform ? platform.name : `Platform #${platformId}`;
  };

  // Build filter options from entities that appear in organization technology platforms
  const orgFilterOptions = useMemo(() => {
    const orgIds = [...new Set(organizationTechnologyPlatforms.map(otp => otp.market_organization_id))];
    return orgIds.map(id => ({
      id,
      name: marketOrganizations.find(o => o.id === id)?.legal_name || `Organization #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [organizationTechnologyPlatforms, marketOrganizations]);

  const platformFilterOptions = useMemo(() => {
    const platformIds = [...new Set(organizationTechnologyPlatforms.map(otp => otp.technology_platform_id))];
    return platformIds.map(id => ({
      id,
      name: technologyPlatforms.find(tp => tp.id === id)?.name || `Platform #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [organizationTechnologyPlatforms, technologyPlatforms]);

  // ==========================================
  // Filter and sort organization technology platforms
  // ==========================================

  const filteredOrganizationTechnologyPlatforms = useMemo(() => {
    let filtered = [...organizationTechnologyPlatforms];

    // Filter by organization
    if (orgFilter !== 'all') {
      const orgId = parseInt(orgFilter);
      filtered = filtered.filter(otp => otp.market_organization_id === orgId);
    }

    // Filter by platform
    if (platformFilter !== 'all') {
      const platformId = parseInt(platformFilter);
      filtered = filtered.filter(otp => otp.technology_platform_id === platformId);
    }

    // Search by utilization_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(otp =>
        otp.utilization_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'utilization_type':
            comparison = a.utilization_type.localeCompare(b.utilization_type);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [organizationTechnologyPlatforms, orgFilter, platformFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = organizationTechnologyPlatforms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Organization Technology Platforms</h1>
          <p className="text-muted-foreground">Manage organization-technology platform associations in the commercial registry</p>
        </div>
        <Link href="/organization-technology-platforms/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Organization Technology Platform
          </Button>
        </Link>
      </div>

      {/* Organization technology platforms table card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Technology Platforms</CardTitle>
          <CardDescription>All organization technology platforms in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Organization FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Organization</Label>
              <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={orgPopoverOpen} className="w-full justify-between font-normal">
                    <span className="truncate">
                      {orgFilter === 'all' ? 'All Organizations' : orgFilterOptions.find(opt => opt.id.toString() === orgFilter)?.name || 'All Organizations'}
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
                        <CommandItem value="All Organizations" onSelect={() => { setOrgFilter('all'); setOrgPopoverOpen(false); }}>
                          All Organizations
                          {orgFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                        {orgFilterOptions.map(opt => (
                          <CommandItem key={opt.id} value={opt.name} onSelect={() => { setOrgFilter(opt.id.toString()); setOrgPopoverOpen(false); }}>
                            {opt.name}
                            {orgFilter === opt.id.toString() && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Platform FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <Popover open={platformPopoverOpen} onOpenChange={setPlatformPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={platformPopoverOpen} className="w-full justify-between font-normal">
                    <span className="truncate">
                      {platformFilter === 'all' ? 'All Platforms' : platformFilterOptions.find(opt => opt.id.toString() === platformFilter)?.name || 'All Platforms'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search platform..." />
                    <CommandList>
                      <CommandEmpty>No platforms found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="All Platforms" onSelect={() => { setPlatformFilter('all'); setPlatformPopoverOpen(false); }}>
                          All Platforms
                          {platformFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                        {platformFilterOptions.map(opt => (
                          <CommandItem key={opt.id} value={opt.name} onSelect={() => { setPlatformFilter(opt.id.toString()); setPlatformPopoverOpen(false); }}>
                            {opt.name}
                            {platformFilter === opt.id.toString() && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search input — filters by utilization_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input id="search" placeholder="Search by utilization type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredOrganizationTechnologyPlatforms.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No organization technology platforms yet' : 'No organization technology platforms match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first organization technology platform' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/organization-technology-platforms/new"><Button><Plus className="mr-2 h-4 w-4" />Create Organization Technology Platform</Button></Link>
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
                    <TableHead>Organization</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('utilization_type')}>
                        Utilization Type
                        <SortIndicator field="utilization_type" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizationTechnologyPlatforms.map((otp) => (
                    <TableRow key={otp.id} className="cursor-pointer" onClick={() => router.push(`/organization-technology-platforms/${otp.id}/details`)}>
                      <TableCell className="font-medium">{otp.id}</TableCell>
                      <TableCell>{getOrgName(otp.market_organization_id)}</TableCell>
                      <TableCell>{getPlatformName(otp.technology_platform_id)}</TableCell>
                      <TableCell>{otp.utilization_type}</TableCell>
                      <TableCell>{new Date(otp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/organization-technology-platforms/${otp.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrganizationTechnologyPlatforms.length} of {totalCount} organization technology platforms
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
