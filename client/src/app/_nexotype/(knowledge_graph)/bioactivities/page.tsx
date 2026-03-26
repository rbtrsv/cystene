'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBioactivities } from '@/modules/nexotype/hooks/knowledge_graph/use-bioactivities';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
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
import { Zap, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'activity_type';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Bioactivities list page
// Displays all bioactivities with search filtering by activity_type
// ---------------------------------------------------------------------------
export default function BioactivitiesPage() {
  const router = useRouter();
  const { bioactivities, isLoading, error } = useBioactivities();

  // Get referenced entities for FK name resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { pathways } = usePathways();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [pathwayFilter, setPathwayFilter] = useState<string>('all');
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Helper to resolve pathway name from FK ID
  const getPathwayName = (pathwayId: number) => {
    const pathway = pathways.find(p => p.id === pathwayId);
    return pathway ? pathway.name : `Pathway #${pathwayId}`;
  };

  // Build filter options from entities that appear in bioactivities
  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(bioactivities.map(b => b.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [bioactivities, therapeuticAssets]);

  const pathwayFilterOptions = useMemo(() => {
    const pathwayIds = [...new Set(bioactivities.map(b => b.pathway_id))];
    return pathwayIds.map(id => ({
      id,
      name: pathways.find(p => p.id === id)?.name || `Pathway #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [bioactivities, pathways]);

  // ==========================================
  // Filter and sort bioactivities
  // ==========================================

  const filteredBioactivities = useMemo(() => {
    let filtered = [...bioactivities];

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(b => b.asset_id === assetId);
    }

    // Filter by pathway
    if (pathwayFilter !== 'all') {
      const pathwayId = parseInt(pathwayFilter);
      filtered = filtered.filter(b => b.pathway_id === pathwayId);
    }

    // Search by activity_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.activity_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'activity_type':
            comparison = a.activity_type.localeCompare(b.activity_type);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [bioactivities, assetFilter, pathwayFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = bioactivities.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bioactivities</h1>
          <p className="text-muted-foreground">Manage bioactivities in the knowledge graph</p>
        </div>
        <Link href="/bioactivities/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Bioactivity
          </Button>
        </Link>
      </div>

      {/* Bioactivities table card */}
      <Card>
        <CardHeader>
          <CardTitle>Bioactivities</CardTitle>
          <CardDescription>All bioactivities in the registry</CardDescription>
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

            {/* Pathway FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Pathway</Label>
              <Popover open={pathwayPopoverOpen} onOpenChange={setPathwayPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={pathwayPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {pathwayFilter === 'all'
                        ? 'All Pathways'
                        : pathwayFilterOptions.find(opt => opt.id.toString() === pathwayFilter)?.name || 'All Pathways'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search pathway..." />
                    <CommandList>
                      <CommandEmpty>No pathways found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Pathways"
                          onSelect={() => {
                            setPathwayFilter('all');
                            setPathwayPopoverOpen(false);
                          }}
                        >
                          All Pathways
                          {pathwayFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {pathwayFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setPathwayFilter(opt.id.toString());
                              setPathwayPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {pathwayFilter === opt.id.toString() && (
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

            {/* Search input — filters by activity_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by activity type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredBioactivities.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No bioactivities yet' : 'No bioactivities match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first bioactivity' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/bioactivities/new"><Button><Plus className="mr-2 h-4 w-4" />Create Bioactivity</Button></Link>
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
                    <TableHead>Pathway</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('activity_type')}
                      >
                        Activity Type
                        <SortIndicator field="activity_type" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBioactivities.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(`/bioactivities/${b.id}/details`)}>
                      <TableCell className="font-medium">{b.id}</TableCell>
                      <TableCell>{getAssetName(b.asset_id)}</TableCell>
                      <TableCell>{getPathwayName(b.pathway_id)}</TableCell>
                      <TableCell>{b.activity_type}</TableCell>
                      <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/bioactivities/${b.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredBioactivities.length} of {totalCount} bioactivities
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
