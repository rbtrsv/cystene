'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTherapeuticEfficacies } from '@/modules/nexotype/hooks/knowledge_graph/use-therapeutic-efficacies';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
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
import { TrendingUp, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'direction' | 'magnitude';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Therapeutic Efficacies list page
// Displays all therapeutic efficacies with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function TherapeuticEfficaciesPage() {
  const router = useRouter();
  const { therapeuticEfficacies, isLoading, error } = useTherapeuticEfficacies();

  // Get referenced entities for FK name resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { indications } = useIndications();
  const { phenotypes } = usePhenotypes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [indicationFilter, setIndicationFilter] = useState<string>('all');
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);
  const [phenotypeFilter, setPhenotypeFilter] = useState<string>('all');
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Helper to resolve indication name from FK ID
  const getIndicationName = (indicationId: number | null | undefined) => {
    if (!indicationId) return '—';
    const indication = indications.find(i => i.id === indicationId);
    return indication ? indication.name : `Indication #${indicationId}`;
  };

  // Helper to resolve phenotype name from FK ID
  const getPhenotypeName = (phenotypeId: number | null | undefined) => {
    if (!phenotypeId) return '—';
    const phenotype = phenotypes.find(p => p.id === phenotypeId);
    return phenotype ? phenotype.name : `Phenotype #${phenotypeId}`;
  };

  // Build filter options from entities that appear in therapeutic efficacies
  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(therapeuticEfficacies.map(te => te.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [therapeuticEfficacies, therapeuticAssets]);

  const indicationFilterOptions = useMemo(() => {
    const indicationIds = [...new Set(therapeuticEfficacies.map(te => te.indication_id).filter((id): id is number => id != null))];
    return indicationIds.map(id => ({
      id,
      name: indications.find(i => i.id === id)?.name || `Indication #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [therapeuticEfficacies, indications]);

  const phenotypeFilterOptions = useMemo(() => {
    const phenotypeIds = [...new Set(therapeuticEfficacies.map(te => te.phenotype_id).filter((id): id is number => id != null))];
    return phenotypeIds.map(id => ({
      id,
      name: phenotypes.find(p => p.id === id)?.name || `Phenotype #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [therapeuticEfficacies, phenotypes]);

  // ==========================================
  // Filter and sort therapeutic efficacies
  // ==========================================

  const filteredTherapeuticEfficacies = useMemo(() => {
    let filtered = [...therapeuticEfficacies];

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(te => te.asset_id === assetId);
    }

    // Filter by indication
    if (indicationFilter !== 'all') {
      const indicationId = parseInt(indicationFilter);
      filtered = filtered.filter(te => te.indication_id === indicationId);
    }

    // Filter by phenotype
    if (phenotypeFilter !== 'all') {
      const phenotypeId = parseInt(phenotypeFilter);
      filtered = filtered.filter(te => te.phenotype_id === phenotypeId);
    }

    // Search by direction
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(te =>
        te.direction.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'direction':
            comparison = a.direction.localeCompare(b.direction);
            break;
          case 'magnitude':
            comparison = (a.magnitude ?? '').localeCompare(b.magnitude ?? '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [therapeuticEfficacies, assetFilter, indicationFilter, phenotypeFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = therapeuticEfficacies.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Therapeutic Efficacies</h1>
          <p className="text-muted-foreground">Manage therapeutic efficacies in the knowledge graph</p>
        </div>
        <Link href="/therapeutic-efficacies/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Therapeutic Efficacy
          </Button>
        </Link>
      </div>

      {/* Therapeutic efficacies table card */}
      <Card>
        <CardHeader>
          <CardTitle>Therapeutic Efficacies</CardTitle>
          <CardDescription>All therapeutic efficacies in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

            {/* Phenotype FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Phenotype</Label>
              <Popover open={phenotypePopoverOpen} onOpenChange={setPhenotypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={phenotypePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {phenotypeFilter === 'all'
                        ? 'All Phenotypes'
                        : phenotypeFilterOptions.find(opt => opt.id.toString() === phenotypeFilter)?.name || 'All Phenotypes'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search phenotype..." />
                    <CommandList>
                      <CommandEmpty>No phenotypes found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Phenotypes"
                          onSelect={() => {
                            setPhenotypeFilter('all');
                            setPhenotypePopoverOpen(false);
                          }}
                        >
                          All Phenotypes
                          {phenotypeFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {phenotypeFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setPhenotypeFilter(opt.id.toString());
                              setPhenotypePopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {phenotypeFilter === opt.id.toString() && (
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

            {/* Search input — filters by direction */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by direction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredTherapeuticEfficacies.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No therapeutic efficacies yet' : 'No therapeutic efficacies match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first therapeutic efficacy' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/therapeutic-efficacies/new"><Button><Plus className="mr-2 h-4 w-4" />Create Therapeutic Efficacy</Button></Link>
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
                    <TableHead>Phenotype</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('direction')}
                      >
                        Direction
                        <SortIndicator field="direction" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('magnitude')}
                      >
                        Magnitude
                        <SortIndicator field="magnitude" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTherapeuticEfficacies.map((te) => (
                    <TableRow key={te.id} className="cursor-pointer" onClick={() => router.push(`/therapeutic-efficacies/${te.id}/details`)}>
                      <TableCell className="font-medium">{te.id}</TableCell>
                      <TableCell>{getAssetName(te.asset_id)}</TableCell>
                      <TableCell>{getIndicationName(te.indication_id)}</TableCell>
                      <TableCell>{getPhenotypeName(te.phenotype_id)}</TableCell>
                      <TableCell>{te.direction}</TableCell>
                      <TableCell>{te.magnitude ?? '—'}</TableCell>
                      <TableCell>{new Date(te.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/therapeutic-efficacies/${te.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredTherapeuticEfficacies.length} of {totalCount} therapeutic efficacies
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
