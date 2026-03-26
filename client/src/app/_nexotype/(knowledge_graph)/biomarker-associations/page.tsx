'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBiomarkerAssociations } from '@/modules/nexotype/hooks/knowledge_graph/use-biomarker-associations';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
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
import { Link2, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'correlation';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Biomarker Associations list page
// Displays all biomarker associations with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function BiomarkerAssociationsPage() {
  const router = useRouter();
  const { biomarkerAssociations, isLoading, error } = useBiomarkerAssociations();

  // Get referenced entities for FK name resolution
  const { biomarkers } = useBiomarkers();
  const { indications } = useIndications();
  const { phenotypes } = usePhenotypes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [biomarkerFilter, setBiomarkerFilter] = useState<string>('all');
  const [biomarkerPopoverOpen, setBiomarkerPopoverOpen] = useState(false);
  const [indicationFilter, setIndicationFilter] = useState<string>('all');
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);
  const [phenotypeFilter, setPhenotypeFilter] = useState<string>('all');
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve biomarker name from FK ID
  const getBiomarkerName = (biomarkerId: number) => {
    const biomarker = biomarkers.find(b => b.id === biomarkerId);
    return biomarker ? biomarker.name : `Biomarker #${biomarkerId}`;
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

  // Build filter options from entities that appear in biomarker associations
  const biomarkerFilterOptions = useMemo(() => {
    const biomarkerIds = [...new Set(biomarkerAssociations.map(ba => ba.biomarker_id))];
    return biomarkerIds.map(id => ({
      id,
      name: biomarkers.find(b => b.id === id)?.name || `Biomarker #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [biomarkerAssociations, biomarkers]);

  const indicationFilterOptions = useMemo(() => {
    const indicationIds = [...new Set(biomarkerAssociations.map(ba => ba.indication_id).filter((id): id is number => id != null))];
    return indicationIds.map(id => ({
      id,
      name: indications.find(i => i.id === id)?.name || `Indication #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [biomarkerAssociations, indications]);

  const phenotypeFilterOptions = useMemo(() => {
    const phenotypeIds = [...new Set(biomarkerAssociations.map(ba => ba.phenotype_id).filter((id): id is number => id != null))];
    return phenotypeIds.map(id => ({
      id,
      name: phenotypes.find(p => p.id === id)?.name || `Phenotype #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [biomarkerAssociations, phenotypes]);

  // ==========================================
  // Filter and sort biomarker associations
  // ==========================================

  const filteredBiomarkerAssociations = useMemo(() => {
    let filtered = [...biomarkerAssociations];

    // Filter by biomarker
    if (biomarkerFilter !== 'all') {
      const biomarkerId = parseInt(biomarkerFilter);
      filtered = filtered.filter(ba => ba.biomarker_id === biomarkerId);
    }

    // Filter by indication
    if (indicationFilter !== 'all') {
      const indicationId = parseInt(indicationFilter);
      filtered = filtered.filter(ba => ba.indication_id === indicationId);
    }

    // Filter by phenotype
    if (phenotypeFilter !== 'all') {
      const phenotypeId = parseInt(phenotypeFilter);
      filtered = filtered.filter(ba => ba.phenotype_id === phenotypeId);
    }

    // Search by correlation
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ba =>
        ba.correlation.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'correlation':
            comparison = a.correlation.localeCompare(b.correlation);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [biomarkerAssociations, biomarkerFilter, indicationFilter, phenotypeFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = biomarkerAssociations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Biomarker Associations</h1>
          <p className="text-muted-foreground">Manage biomarker associations in the knowledge graph</p>
        </div>
        <Link href="/biomarker-associations/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Biomarker Association
          </Button>
        </Link>
      </div>

      {/* Biomarker associations table card */}
      <Card>
        <CardHeader>
          <CardTitle>Biomarker Associations</CardTitle>
          <CardDescription>All biomarker associations in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Biomarker FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Biomarker</Label>
              <Popover open={biomarkerPopoverOpen} onOpenChange={setBiomarkerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={biomarkerPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {biomarkerFilter === 'all'
                        ? 'All Biomarkers'
                        : biomarkerFilterOptions.find(opt => opt.id.toString() === biomarkerFilter)?.name || 'All Biomarkers'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search biomarker..." />
                    <CommandList>
                      <CommandEmpty>No biomarkers found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Biomarkers"
                          onSelect={() => {
                            setBiomarkerFilter('all');
                            setBiomarkerPopoverOpen(false);
                          }}
                        >
                          All Biomarkers
                          {biomarkerFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {biomarkerFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setBiomarkerFilter(opt.id.toString());
                              setBiomarkerPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {biomarkerFilter === opt.id.toString() && (
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

            {/* Search input — filters by correlation */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by correlation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredBiomarkerAssociations.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No biomarker associations yet' : 'No biomarker associations match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first biomarker association' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/biomarker-associations/new"><Button><Plus className="mr-2 h-4 w-4" />Create Biomarker Association</Button></Link>
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
                    <TableHead>Biomarker</TableHead>
                    <TableHead>Indication</TableHead>
                    <TableHead>Phenotype</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('correlation')}
                      >
                        Correlation
                        <SortIndicator field="correlation" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBiomarkerAssociations.map((ba) => (
                    <TableRow key={ba.id} className="cursor-pointer" onClick={() => router.push(`/biomarker-associations/${ba.id}/details`)}>
                      <TableCell className="font-medium">{ba.id}</TableCell>
                      <TableCell>{getBiomarkerName(ba.biomarker_id)}</TableCell>
                      <TableCell>{getIndicationName(ba.indication_id)}</TableCell>
                      <TableCell>{getPhenotypeName(ba.phenotype_id)}</TableCell>
                      <TableCell>{ba.correlation}</TableCell>
                      <TableCell>{new Date(ba.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/biomarker-associations/${ba.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredBiomarkerAssociations.length} of {totalCount} biomarker associations
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
