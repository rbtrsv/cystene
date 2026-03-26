'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDevelopmentPipelines } from '@/modules/nexotype/hooks/commercial/use-development-pipelines';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
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
import { Layers, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'phase' | 'status';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Development Pipelines list page
// Displays all development pipelines with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function DevelopmentPipelinesPage() {
  const router = useRouter();
  const { developmentPipelines, isLoading, error } = useDevelopmentPipelines();

  // Get referenced entities for FK name resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { indications } = useIndications();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [indicationFilter, setIndicationFilter] = useState<string>('all');
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Helper to resolve indication name from FK ID
  const getIndicationName = (indicationId: number) => {
    const indication = indications.find(i => i.id === indicationId);
    return indication ? indication.name : `Indication #${indicationId}`;
  };

  // Build filter options from entities that appear in development pipelines
  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(developmentPipelines.map(dp => dp.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [developmentPipelines, therapeuticAssets]);

  const indicationFilterOptions = useMemo(() => {
    const indicationIds = [...new Set(developmentPipelines.map(dp => dp.indication_id))];
    return indicationIds.map(id => ({
      id,
      name: indications.find(i => i.id === id)?.name || `Indication #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [developmentPipelines, indications]);

  // ==========================================
  // Filter and sort development pipelines
  // ==========================================

  const filteredDevelopmentPipelines = useMemo(() => {
    let filtered = [...developmentPipelines];

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(dp => dp.asset_id === assetId);
    }

    // Filter by indication
    if (indicationFilter !== 'all') {
      const indicationId = parseInt(indicationFilter);
      filtered = filtered.filter(dp => dp.indication_id === indicationId);
    }

    // Search by phase or nct_number
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dp =>
        (dp.phase && dp.phase.toLowerCase().includes(term)) ||
        (dp.nct_number && dp.nct_number.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'phase':
            comparison = (a.phase || '').localeCompare(b.phase || '');
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [developmentPipelines, assetFilter, indicationFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = developmentPipelines.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Development Pipelines</h1>
          <p className="text-muted-foreground">Manage development pipelines in the commercial registry</p>
        </div>
        <Link href="/development-pipelines/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Development Pipeline
          </Button>
        </Link>
      </div>

      {/* Development pipelines table card */}
      <Card>
        <CardHeader>
          <CardTitle>Development Pipelines</CardTitle>
          <CardDescription>All development pipelines in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Asset FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Asset</Label>
              <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assetPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {assetFilter === 'all'
                        ? 'All Assets'
                        : assetFilterOptions.find(opt => opt.id.toString() === assetFilter)?.name || 'All Assets'}
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
                        <CommandItem
                          value="All Assets"
                          onSelect={() => {
                            setAssetFilter('all');
                            setAssetPopoverOpen(false);
                          }}
                        >
                          All Assets
                          {assetFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {assetFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setAssetFilter(opt.id.toString());
                              setAssetPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {assetFilter === opt.id.toString() && (
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

            {/* Indication FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Indication</Label>
              <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={indicationPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {indicationFilter === 'all'
                        ? 'All Indications'
                        : indicationFilterOptions.find(opt => opt.id.toString() === indicationFilter)?.name || 'All Indications'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search indication..." />
                    <CommandList>
                      <CommandEmpty>No indications found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Indications"
                          onSelect={() => {
                            setIndicationFilter('all');
                            setIndicationPopoverOpen(false);
                          }}
                        >
                          All Indications
                          {indicationFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {indicationFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setIndicationFilter(opt.id.toString());
                              setIndicationPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {indicationFilter === opt.id.toString() && (
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

            {/* Search input — filters by phase or nct_number */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by phase or NCT number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredDevelopmentPipelines.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No development pipelines yet' : 'No development pipelines match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first development pipeline' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/development-pipelines/new"><Button><Plus className="mr-2 h-4 w-4" />Create Development Pipeline</Button></Link>
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
                    <TableHead>Indication</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('phase')}
                      >
                        Phase
                        <SortIndicator field="phase" />
                      </Button>
                    </TableHead>
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
                    <TableHead>NCT Number</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevelopmentPipelines.map((dp) => (
                    <TableRow key={dp.id} className="cursor-pointer" onClick={() => router.push(`/development-pipelines/${dp.id}/details`)}>
                      <TableCell className="font-medium">{dp.id}</TableCell>
                      <TableCell>{getAssetName(dp.asset_id)}</TableCell>
                      <TableCell>{getIndicationName(dp.indication_id)}</TableCell>
                      <TableCell>{dp.phase}</TableCell>
                      <TableCell>{dp.status}</TableCell>
                      <TableCell>{dp.nct_number ?? '—'}</TableCell>
                      <TableCell>{new Date(dp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/development-pipelines/${dp.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredDevelopmentPipelines.length} of {totalCount} development pipelines
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
