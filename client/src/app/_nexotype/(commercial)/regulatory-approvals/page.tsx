'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegulatoryApprovals } from '@/modules/nexotype/hooks/commercial/use-regulatory-approvals';
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
import { ShieldCheck, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'agency' | 'status';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Regulatory Approvals list page
// Displays all regulatory approvals with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function RegulatoryApprovalsPage() {
  const router = useRouter();
  const { regulatoryApprovals, isLoading, error } = useRegulatoryApprovals();

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

  // Build filter options from entities that appear in regulatory approvals
  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(regulatoryApprovals.map(ra => ra.asset_id))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [regulatoryApprovals, therapeuticAssets]);

  const indicationFilterOptions = useMemo(() => {
    const indicationIds = [...new Set(regulatoryApprovals.map(ra => ra.indication_id))];
    return indicationIds.map(id => ({
      id,
      name: indications.find(i => i.id === id)?.name || `Indication #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [regulatoryApprovals, indications]);

  // ==========================================
  // Filter and sort regulatory approvals
  // ==========================================

  const filteredRegulatoryApprovals = useMemo(() => {
    let filtered = [...regulatoryApprovals];

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(ra => ra.asset_id === assetId);
    }

    // Filter by indication
    if (indicationFilter !== 'all') {
      const indicationId = parseInt(indicationFilter);
      filtered = filtered.filter(ra => ra.indication_id === indicationId);
    }

    // Search by agency or approval_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ra =>
        (ra.agency && ra.agency.toLowerCase().includes(term)) ||
        (ra.approval_type && ra.approval_type.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'agency':
            comparison = (a.agency || '').localeCompare(b.agency || '');
            break;
          case 'status':
            comparison = (a.status || '').localeCompare(b.status || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [regulatoryApprovals, assetFilter, indicationFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = regulatoryApprovals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Regulatory Approvals</h1>
          <p className="text-muted-foreground">Manage regulatory approvals in the commercial module</p>
        </div>
        <Link href="/regulatory-approvals/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Regulatory Approval
          </Button>
        </Link>
      </div>

      {/* Regulatory approvals table card */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Approvals</CardTitle>
          <CardDescription>All regulatory approvals in the registry</CardDescription>
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

            {/* Indication FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Indication</Label>
              <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={indicationPopoverOpen} className="w-full justify-between font-normal">
                    <span className="truncate">
                      {indicationFilter === 'all' ? 'All Indications' : indicationFilterOptions.find(opt => opt.id.toString() === indicationFilter)?.name || 'All Indications'}
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
                        <CommandItem value="All Indications" onSelect={() => { setIndicationFilter('all'); setIndicationPopoverOpen(false); }}>
                          All Indications
                          {indicationFilter === 'all' && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                        {indicationFilterOptions.map(opt => (
                          <CommandItem key={opt.id} value={opt.name} onSelect={() => { setIndicationFilter(opt.id.toString()); setIndicationPopoverOpen(false); }}>
                            {opt.name}
                            {indicationFilter === opt.id.toString() && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search input — filters by agency or approval_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input id="search" placeholder="Search by agency or approval type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredRegulatoryApprovals.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No regulatory approvals yet' : 'No regulatory approvals match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first regulatory approval' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/regulatory-approvals/new"><Button><Plus className="mr-2 h-4 w-4" />Create Regulatory Approval</Button></Link>
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
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('agency')}>
                        Agency
                        <SortIndicator field="agency" />
                      </Button>
                    </TableHead>
                    <TableHead>Approval Type</TableHead>
                    <TableHead>Approval Date</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('status')}>
                        Status
                        <SortIndicator field="status" />
                      </Button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegulatoryApprovals.map((ra) => (
                    <TableRow key={ra.id} className="cursor-pointer" onClick={() => router.push(`/regulatory-approvals/${ra.id}/details`)}>
                      <TableCell className="font-medium">{ra.id}</TableCell>
                      <TableCell>{getAssetName(ra.asset_id)}</TableCell>
                      <TableCell>{getIndicationName(ra.indication_id)}</TableCell>
                      <TableCell>{ra.agency}</TableCell>
                      <TableCell>{ra.approval_type}</TableCell>
                      <TableCell>{new Date(ra.approval_date).toLocaleDateString()}</TableCell>
                      <TableCell>{ra.status}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/regulatory-approvals/${ra.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredRegulatoryApprovals.length} of {totalCount} regulatory approvals
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
