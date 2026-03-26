'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenomicAssociations } from '@/modules/nexotype/hooks/knowledge_graph/use-genomic-associations';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
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
import { Dna, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'odds_ratio';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Genomic Associations list page
// Displays all genomic associations with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function GenomicAssociationsPage() {
  const router = useRouter();
  const { genomicAssociations, isLoading, error } = useGenomicAssociations();

  // Get referenced entities for FK name resolution
  const { variants } = useVariants();
  const { indications } = useIndications();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [variantFilter, setVariantFilter] = useState<string>('all');
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);
  const [indicationFilter, setIndicationFilter] = useState<string>('all');
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve variant name from FK ID
  const getVariantName = (variantId: number) => {
    const variant = variants.find(v => v.id === variantId);
    return variant ? variant.db_snp_id : `Variant #${variantId}`;
  };

  // Helper to resolve indication name from FK ID
  const getIndicationName = (indicationId: number) => {
    const indication = indications.find(i => i.id === indicationId);
    return indication ? indication.name : `Indication #${indicationId}`;
  };

  // Build filter options from entities that appear in genomic associations
  const variantFilterOptions = useMemo(() => {
    const variantIds = [...new Set(genomicAssociations.map(ga => ga.variant_id))];
    return variantIds.map(id => ({
      id,
      name: variants.find(v => v.id === id)?.db_snp_id || `Variant #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [genomicAssociations, variants]);

  const indicationFilterOptions = useMemo(() => {
    const indicationIds = [...new Set(genomicAssociations.map(ga => ga.indication_id))];
    return indicationIds.map(id => ({
      id,
      name: indications.find(i => i.id === id)?.name || `Indication #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [genomicAssociations, indications]);

  // ==========================================
  // Filter and sort genomic associations
  // ==========================================

  const filteredGenomicAssociations = useMemo(() => {
    let filtered = [...genomicAssociations];

    // Filter by variant
    if (variantFilter !== 'all') {
      const variantId = parseInt(variantFilter);
      filtered = filtered.filter(ga => ga.variant_id === variantId);
    }

    // Filter by indication
    if (indicationFilter !== 'all') {
      const indicationId = parseInt(indicationFilter);
      filtered = filtered.filter(ga => ga.indication_id === indicationId);
    }

    // Search by odds_ratio (toString)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ga =>
        ga.odds_ratio !== null && ga.odds_ratio !== undefined && ga.odds_ratio.toString().toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'odds_ratio':
            comparison = (a.odds_ratio ?? 0) - (b.odds_ratio ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [genomicAssociations, variantFilter, indicationFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = genomicAssociations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Genomic Associations</h1>
          <p className="text-muted-foreground">Manage genomic associations in the knowledge graph</p>
        </div>
        <Link href="/genomic-associations/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Genomic Association
          </Button>
        </Link>
      </div>

      {/* Genomic associations table card */}
      <Card>
        <CardHeader>
          <CardTitle>Genomic Associations</CardTitle>
          <CardDescription>All genomic associations in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Variant FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Variant</Label>
              <Popover open={variantPopoverOpen} onOpenChange={setVariantPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={variantPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {variantFilter === 'all'
                        ? 'All Variants'
                        : variantFilterOptions.find(opt => opt.id.toString() === variantFilter)?.name || 'All Variants'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search variant..." />
                    <CommandList>
                      <CommandEmpty>No variants found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Variants"
                          onSelect={() => {
                            setVariantFilter('all');
                            setVariantPopoverOpen(false);
                          }}
                        >
                          All Variants
                          {variantFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {variantFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setVariantFilter(opt.id.toString());
                              setVariantPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {variantFilter === opt.id.toString() && (
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

            {/* Search input — filters by odds_ratio */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by odds ratio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredGenomicAssociations.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Dna className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No genomic associations yet' : 'No genomic associations match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first genomic association' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/genomic-associations/new"><Button><Plus className="mr-2 h-4 w-4" />Create Genomic Association</Button></Link>
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
                    <TableHead>Variant</TableHead>
                    <TableHead>Indication</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('odds_ratio')}
                      >
                        Odds Ratio
                        <SortIndicator field="odds_ratio" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGenomicAssociations.map((ga) => (
                    <TableRow key={ga.id} className="cursor-pointer" onClick={() => router.push(`/genomic-associations/${ga.id}/details`)}>
                      <TableCell className="font-medium">{ga.id}</TableCell>
                      <TableCell>{getVariantName(ga.variant_id)}</TableCell>
                      <TableCell>{getIndicationName(ga.indication_id)}</TableCell>
                      <TableCell>{ga.odds_ratio ?? '—'}</TableCell>
                      <TableCell>{new Date(ga.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/genomic-associations/${ga.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredGenomicAssociations.length} of {totalCount} genomic associations
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
