'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDrugInteractions } from '@/modules/nexotype/hooks/knowledge_graph/use-drug-interactions';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
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
import { Repeat, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'interaction_type';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Drug Interactions list page
// Displays all drug interactions with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function DrugInteractionsPage() {
  const router = useRouter();
  const { drugInteractions, isLoading, error } = useDrugInteractions();

  // Get referenced entities for FK name resolution
  const { therapeuticAssets } = useTherapeuticAssets();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetAFilter, setAssetAFilter] = useState<string>('all');
  const [assetAPopoverOpen, setAssetAPopoverOpen] = useState(false);
  const [assetBFilter, setAssetBFilter] = useState<string>('all');
  const [assetBPopoverOpen, setAssetBPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Build filter options from entities that appear in drug interactions
  const assetAFilterOptions = useMemo(() => {
    const assetIds = [...new Set(drugInteractions.map(di => di.asset_a_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [drugInteractions, therapeuticAssets]);

  const assetBFilterOptions = useMemo(() => {
    const assetIds = [...new Set(drugInteractions.map(di => di.asset_b_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [drugInteractions, therapeuticAssets]);

  // ==========================================
  // Filter and sort drug interactions
  // ==========================================

  const filteredDrugInteractions = useMemo(() => {
    let filtered = [...drugInteractions];

    // Filter by asset A
    if (assetAFilter !== 'all') {
      const assetId = parseInt(assetAFilter);
      filtered = filtered.filter(di => di.asset_a_id === assetId);
    }

    // Filter by asset B
    if (assetBFilter !== 'all') {
      const assetId = parseInt(assetBFilter);
      filtered = filtered.filter(di => di.asset_b_id === assetId);
    }

    // Search by interaction_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(di =>
        di.interaction_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'interaction_type':
            comparison = a.interaction_type.localeCompare(b.interaction_type);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [drugInteractions, assetAFilter, assetBFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = drugInteractions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Drug Interactions</h1>
          <p className="text-muted-foreground">Manage drug interactions in the knowledge graph</p>
        </div>
        <Link href="/drug-interactions/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Drug Interaction
          </Button>
        </Link>
      </div>

      {/* Drug interactions table card */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Interactions</CardTitle>
          <CardDescription>All drug interactions in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Asset A FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Asset A</Label>
              <Popover open={assetAPopoverOpen} onOpenChange={setAssetAPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assetAPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {assetAFilter === 'all'
                        ? 'All Assets'
                        : assetAFilterOptions.find(opt => opt.id.toString() === assetAFilter)?.name || 'All Assets'}
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
                          value="All Assets A"
                          onSelect={() => {
                            setAssetAFilter('all');
                            setAssetAPopoverOpen(false);
                          }}
                        >
                          All Assets
                          {assetAFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {assetAFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setAssetAFilter(opt.id.toString());
                              setAssetAPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {assetAFilter === opt.id.toString() && (
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

            {/* Asset B FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Asset B</Label>
              <Popover open={assetBPopoverOpen} onOpenChange={setAssetBPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assetBPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {assetBFilter === 'all'
                        ? 'All Assets'
                        : assetBFilterOptions.find(opt => opt.id.toString() === assetBFilter)?.name || 'All Assets'}
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
                          value="All Assets B"
                          onSelect={() => {
                            setAssetBFilter('all');
                            setAssetBPopoverOpen(false);
                          }}
                        >
                          All Assets
                          {assetBFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {assetBFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setAssetBFilter(opt.id.toString());
                              setAssetBPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {assetBFilter === opt.id.toString() && (
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

            {/* Search input — filters by interaction_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by interaction type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredDrugInteractions.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No drug interactions yet' : 'No drug interactions match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first drug interaction' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/drug-interactions/new"><Button><Plus className="mr-2 h-4 w-4" />Create Drug Interaction</Button></Link>
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
                    <TableHead>Asset A</TableHead>
                    <TableHead>Asset B</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('interaction_type')}
                      >
                        Interaction Type
                        <SortIndicator field="interaction_type" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrugInteractions.map((di) => (
                    <TableRow key={di.id} className="cursor-pointer" onClick={() => router.push(`/drug-interactions/${di.id}/details`)}>
                      <TableCell className="font-medium">{di.id}</TableCell>
                      <TableCell>{getAssetName(di.asset_a_id)}</TableCell>
                      <TableCell>{getAssetName(di.asset_b_id)}</TableCell>
                      <TableCell>{di.interaction_type}</TableCell>
                      <TableCell>{new Date(di.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/drug-interactions/${di.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredDrugInteractions.length} of {totalCount} drug interactions
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
