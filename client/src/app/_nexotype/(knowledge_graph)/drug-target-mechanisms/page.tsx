'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDrugTargetMechanisms } from '@/modules/nexotype/hooks/knowledge_graph/use-drug-target-mechanisms';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
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
import { Crosshair, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the drug target mechanisms table
 */
type SortField = 'mechanism' | 'affinity_value';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Drug Target Mechanisms list page
// Displays all drug-target mechanisms with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function DrugTargetMechanismsPage() {
  const router = useRouter();
  const { drugTargetMechanisms, isLoading, error } = useDrugTargetMechanisms();

  // Get referenced entities for FK name resolution
  const { therapeuticAssets } = useTherapeuticAssets();
  const { proteins } = useProteins();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [proteinFilter, setProteinFilter] = useState<string>('all');
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Helper to resolve protein name from FK ID
  const getProteinName = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // Build filter options from entities that appear in drug target mechanisms
  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(drugTargetMechanisms.map(dtm => dtm.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [drugTargetMechanisms, therapeuticAssets]);

  const proteinFilterOptions = useMemo(() => {
    const proteinIds = [...new Set(drugTargetMechanisms.map(dtm => dtm.protein_id))];
    return proteinIds.map(id => ({
      id,
      name: proteins.find(p => p.id === id)?.uniprot_accession || `Protein #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [drugTargetMechanisms, proteins]);

  // ==========================================
  // Filter and sort drug target mechanisms
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...drugTargetMechanisms];

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(dtm => dtm.asset_id === assetId);
    }

    // Filter by protein
    if (proteinFilter !== 'all') {
      const proteinId = parseInt(proteinFilter);
      filtered = filtered.filter(dtm => dtm.protein_id === proteinId);
    }

    // Search by mechanism
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dtm =>
        dtm.mechanism.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'mechanism':
            comparison = a.mechanism.localeCompare(b.mechanism);
            break;
          case 'affinity_value':
            comparison = (a.affinity_value ?? 0) - (b.affinity_value ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [drugTargetMechanisms, assetFilter, proteinFilter, searchTerm, sortField, sortDirection]);

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

  // ==========================================
  // Render
  // ==========================================

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

  const totalCount = drugTargetMechanisms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Drug Target Mechanisms</h1>
          <p className="text-muted-foreground">Manage drug-target mechanisms in the knowledge graph</p>
        </div>
        <Link href="/drug-target-mechanisms/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Drug Target Mechanism
          </Button>
        </Link>
      </div>

      {/* Drug target mechanisms table card */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Target Mechanisms</CardTitle>
          <CardDescription>All drug target mechanisms in the registry</CardDescription>
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

            {/* Protein FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Protein</Label>
              <Popover open={proteinPopoverOpen} onOpenChange={setProteinPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={proteinPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {proteinFilter === 'all'
                        ? 'All Proteins'
                        : proteinFilterOptions.find(opt => opt.id.toString() === proteinFilter)?.name || 'All Proteins'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search protein..." />
                    <CommandList>
                      <CommandEmpty>No proteins found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Proteins"
                          onSelect={() => {
                            setProteinFilter('all');
                            setProteinPopoverOpen(false);
                          }}
                        >
                          All Proteins
                          {proteinFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {proteinFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setProteinFilter(opt.id.toString());
                              setProteinPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {proteinFilter === opt.id.toString() && (
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

            {/* Search input — filters by mechanism */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by mechanism..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRows.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Crosshair className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No drug target mechanisms yet' : 'No drug target mechanisms match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first drug target mechanism' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/drug-target-mechanisms/new"><Button><Plus className="mr-2 h-4 w-4" />Create Drug Target Mechanism</Button></Link>
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
                    <TableHead>Protein</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('mechanism')}
                      >
                        Mechanism
                        <SortIndicator field="mechanism" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('affinity_value')}
                      >
                        Affinity Value
                        <SortIndicator field="affinity_value" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((dtm) => (
                    <TableRow key={dtm.id} className="cursor-pointer" onClick={() => router.push(`/drug-target-mechanisms/${dtm.id}/details`)}>
                      <TableCell className="font-medium">{dtm.id}</TableCell>
                      <TableCell>{getAssetName(dtm.asset_id)}</TableCell>
                      <TableCell>{getProteinName(dtm.protein_id)}</TableCell>
                      <TableCell>{dtm.mechanism}</TableCell>
                      <TableCell>{dtm.affinity_value ?? '—'}</TableCell>
                      <TableCell>{new Date(dtm.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/drug-target-mechanisms/${dtm.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredRows.length} of {totalCount} drug target mechanisms
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
