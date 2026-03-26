'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-asset-technology-platforms';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
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
import { Combine, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'role';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Asset Technology Platforms list page
// Displays all asset-technology platform associations with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function AssetTechnologyPlatformsPage() {
  const router = useRouter();
  const { assetTechnologyPlatforms, isLoading, error } = useAssetTechnologyPlatforms();

  // Get referenced entities for FK name resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { technologyPlatforms } = useTechnologyPlatforms();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [platformPopoverOpen, setPlatformPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Helper to resolve platform name from FK ID
  const getPlatformName = (platformId: number) => {
    const platform = technologyPlatforms.find(tp => tp.id === platformId);
    return platform ? platform.name : `Platform #${platformId}`;
  };

  // Build filter options from entities that appear in asset technology platforms
  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(assetTechnologyPlatforms.map(atp => atp.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [assetTechnologyPlatforms, therapeuticAssets]);

  const platformFilterOptions = useMemo(() => {
    const platformIds = [...new Set(assetTechnologyPlatforms.map(atp => atp.technology_platform_id))];
    return platformIds.map(id => ({
      id,
      name: technologyPlatforms.find(tp => tp.id === id)?.name || `Platform #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [assetTechnologyPlatforms, technologyPlatforms]);

  // ==========================================
  // Filter and sort asset technology platforms
  // ==========================================

  const filteredAssetTechnologyPlatforms = useMemo(() => {
    let filtered = [...assetTechnologyPlatforms];

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(atp => atp.asset_id === assetId);
    }

    // Filter by platform
    if (platformFilter !== 'all') {
      const platformId = parseInt(platformFilter);
      filtered = filtered.filter(atp => atp.technology_platform_id === platformId);
    }

    // Search by role
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(atp =>
        atp.role && atp.role.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'role':
            comparison = (a.role || '').localeCompare(b.role || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [assetTechnologyPlatforms, assetFilter, platformFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = assetTechnologyPlatforms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Asset Technology Platforms</h1>
          <p className="text-muted-foreground">Manage asset-technology platform associations in the commercial registry</p>
        </div>
        <Link href="/asset-technology-platforms/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Asset Technology Platform
          </Button>
        </Link>
      </div>

      {/* Asset technology platforms table card */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Technology Platforms</CardTitle>
          <CardDescription>All asset technology platforms in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Asset FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Asset</Label>
              <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
                    <span className="truncate">
                      {assetFilter === 'all' ? 'All Assets' : assetFilterOptions.find(opt => opt.id.toString() === assetFilter)?.name || 'All Assets'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search asset..." />
                    <CommandList>
                      <CommandEmpty>No assets found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="All Assets" onSelect={() => { setAssetFilter('all'); setAssetPopoverOpen(false); }}>
                          All Assets
                          {assetFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                        {assetFilterOptions.map(opt => (
                          <CommandItem key={opt.id} value={opt.name} onSelect={() => { setAssetFilter(opt.id.toString()); setAssetPopoverOpen(false); }}>
                            {opt.name}
                            {assetFilter === opt.id.toString() && <Check className="ml-auto h-4 w-4" />}
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

            {/* Search input — filters by role */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input id="search" placeholder="Search by role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredAssetTechnologyPlatforms.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Combine className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No asset technology platforms yet' : 'No asset technology platforms match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first asset technology platform' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/asset-technology-platforms/new"><Button><Plus className="mr-2 h-4 w-4" />Create Asset Technology Platform</Button></Link>
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
                    <TableHead>Asset</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('role')}>
                        Role
                        <SortIndicator field="role" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssetTechnologyPlatforms.map((atp) => (
                    <TableRow key={atp.id} className="cursor-pointer" onClick={() => router.push(`/asset-technology-platforms/${atp.id}/details`)}>
                      <TableCell className="font-medium">{atp.id}</TableCell>
                      <TableCell>{getAssetName(atp.asset_id)}</TableCell>
                      <TableCell>{getPlatformName(atp.technology_platform_id)}</TableCell>
                      <TableCell>{atp.role ?? '—'}</TableCell>
                      <TableCell>{new Date(atp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/asset-technology-platforms/${atp.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredAssetTechnologyPlatforms.length} of {totalCount} asset technology platforms
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
