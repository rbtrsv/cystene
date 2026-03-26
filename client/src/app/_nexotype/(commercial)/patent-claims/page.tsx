'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatentClaims } from '@/modules/nexotype/hooks/commercial/use-patent-claims';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
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
import { FileCheck, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'claim_type';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Patent Claims list page
// Displays all patent claims with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function PatentClaimsPage() {
  const router = useRouter();
  const { patentClaims, isLoading, error } = usePatentClaims();

  // Get referenced entities for FK name resolution
  const { patents } = usePatents();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [patentFilter, setPatentFilter] = useState<string>('all');
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve patent name from FK ID
  const getPatentName = (patentId: number) => {
    const patent = patents.find(p => p.id === patentId);
    return patent ? patent.patent_number : `Patent #${patentId}`;
  };

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number) => {
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Build filter options from entities that appear in patent claims
  const patentFilterOptions = useMemo(() => {
    const patentIds = [...new Set(patentClaims.map(pc => pc.patent_id))];
    return patentIds.map(id => ({
      id,
      name: patents.find(p => p.id === id)?.patent_number || `Patent #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [patentClaims, patents]);

  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(patentClaims.map(pc => pc.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [patentClaims, therapeuticAssets]);

  // ==========================================
  // Filter and sort patent claims
  // ==========================================

  const filteredPatentClaims = useMemo(() => {
    let filtered = [...patentClaims];

    // Filter by patent
    if (patentFilter !== 'all') {
      const patentId = parseInt(patentFilter);
      filtered = filtered.filter(pc => pc.patent_id === patentId);
    }

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(pc => pc.asset_id === assetId);
    }

    // Search by claim_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pc =>
        pc.claim_type && pc.claim_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'claim_type':
            comparison = (a.claim_type || '').localeCompare(b.claim_type || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [patentClaims, patentFilter, assetFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = patentClaims.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Patent Claims</h1>
          <p className="text-muted-foreground">Manage patent claims in the commercial registry</p>
        </div>
        <Link href="/patent-claims/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Patent Claim
          </Button>
        </Link>
      </div>

      {/* Patent claims table card */}
      <Card>
        <CardHeader>
          <CardTitle>Patent Claims</CardTitle>
          <CardDescription>All patent claims in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Patent FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Patent</Label>
              <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={patentPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {patentFilter === 'all'
                        ? 'All Patents'
                        : patentFilterOptions.find(opt => opt.id.toString() === patentFilter)?.name || 'All Patents'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search patent..." />
                    <CommandList>
                      <CommandEmpty>No patents found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Patents"
                          onSelect={() => {
                            setPatentFilter('all');
                            setPatentPopoverOpen(false);
                          }}
                        >
                          All Patents
                          {patentFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {patentFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setPatentFilter(opt.id.toString());
                              setPatentPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {patentFilter === opt.id.toString() && (
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

            {/* Search input — filters by claim_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by claim type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredPatentClaims.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No patent claims yet' : 'No patent claims match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first patent claim' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/patent-claims/new"><Button><Plus className="mr-2 h-4 w-4" />Create Patent Claim</Button></Link>
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
                    <TableHead>Patent</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('claim_type')}
                      >
                        Claim Type
                        <SortIndicator field="claim_type" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatentClaims.map((pc) => (
                    <TableRow key={pc.id} className="cursor-pointer" onClick={() => router.push(`/patent-claims/${pc.id}/details`)}>
                      <TableCell className="font-medium">{pc.id}</TableCell>
                      <TableCell>{getPatentName(pc.patent_id)}</TableCell>
                      <TableCell>{getAssetName(pc.asset_id)}</TableCell>
                      <TableCell>{pc.claim_type}</TableCell>
                      <TableCell>{new Date(pc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/patent-claims/${pc.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredPatentClaims.length} of {totalCount} patent claims
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
