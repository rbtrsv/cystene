'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/modules/nexotype/hooks/commercial/use-transactions';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
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
import { ArrowLeftRight, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'transaction_type' | 'value_usd';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Transactions list page
// Displays all transactions with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, isLoading, error } = useTransactions();

  // Get referenced entities for FK name resolution
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [buyerFilter, setBuyerFilter] = useState<string>('all');
  const [buyerPopoverOpen, setBuyerPopoverOpen] = useState(false);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve organization name from FK ID
  const getOrgName = (orgId: number | null | undefined) => {
    if (!orgId) return '—';
    const org = marketOrganizations.find(o => o.id === orgId);
    return org ? org.legal_name : `Organization #${orgId}`;
  };

  // Helper to resolve asset name from FK ID
  const getAssetName = (assetId: number | null | undefined) => {
    if (!assetId) return '—';
    const asset = therapeuticAssets.find(a => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  // Build filter options from entities that appear in transactions
  const buyerFilterOptions = useMemo(() => {
    const buyerIds = [...new Set(transactions.map(t => t.buyer_id))];
    return buyerIds.map(id => ({
      id,
      name: marketOrganizations.find(o => o.id === id)?.legal_name || `Organization #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, marketOrganizations]);

  const assetFilterOptions = useMemo(() => {
    const assetIds = [...new Set(transactions.map(t => t.asset_id).filter((id): id is number => id != null))];
    return assetIds.map(id => ({
      id,
      name: therapeuticAssets.find(a => a.id === id)?.name || `Asset #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, therapeuticAssets]);

  // ==========================================
  // Filter and sort transactions
  // ==========================================

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by buyer
    if (buyerFilter !== 'all') {
      const buyerId = parseInt(buyerFilter);
      filtered = filtered.filter(t => t.buyer_id === buyerId);
    }

    // Filter by asset
    if (assetFilter !== 'all') {
      const assetId = parseInt(assetFilter);
      filtered = filtered.filter(t => t.asset_id === assetId);
    }

    // Search by transaction_type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.transaction_type && t.transaction_type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'transaction_type':
            comparison = (a.transaction_type || '').localeCompare(b.transaction_type || '');
            break;
          case 'value_usd':
            comparison = (a.value_usd ?? 0) - (b.value_usd ?? 0);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [transactions, buyerFilter, assetFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = transactions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage transactions in the commercial registry</p>
        </div>
        <Link href="/transactions/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Transaction
          </Button>
        </Link>
      </div>

      {/* Transactions table card */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>All transactions in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Buyer FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Buyer</Label>
              <Popover open={buyerPopoverOpen} onOpenChange={setBuyerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={buyerPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {buyerFilter === 'all'
                        ? 'All Buyers'
                        : buyerFilterOptions.find(opt => opt.id.toString() === buyerFilter)?.name || 'All Buyers'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search buyer..." />
                    <CommandList>
                      <CommandEmpty>No buyers found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Buyers"
                          onSelect={() => {
                            setBuyerFilter('all');
                            setBuyerPopoverOpen(false);
                          }}
                        >
                          All Buyers
                          {buyerFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {buyerFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setBuyerFilter(opt.id.toString());
                              setBuyerPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {buyerFilter === opt.id.toString() && (
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

            {/* Search input — filters by transaction_type */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by transaction type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredTransactions.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No transactions yet' : 'No transactions match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first transaction' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/transactions/new"><Button><Plus className="mr-2 h-4 w-4" />Create Transaction</Button></Link>
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
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('transaction_type')}
                      >
                        Type
                        <SortIndicator field="transaction_type" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('value_usd')}
                      >
                        Value USD
                        <SortIndicator field="value_usd" />
                      </Button>
                    </TableHead>
                    <TableHead>Announced</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/transactions/${t.id}/details`)}>
                      <TableCell className="font-medium">{t.id}</TableCell>
                      <TableCell>{getOrgName(t.buyer_id)}</TableCell>
                      <TableCell>{getOrgName(t.seller_id)}</TableCell>
                      <TableCell>{getAssetName(t.asset_id)}</TableCell>
                      <TableCell>{t.transaction_type}</TableCell>
                      <TableCell>{t.value_usd ?? '—'}</TableCell>
                      <TableCell>{new Date(t.announced_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/transactions/${t.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {totalCount} transactions
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
