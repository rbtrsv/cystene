'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Globe, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';

import { useAssets } from '@/modules/cybersecurity/hooks/discovery/use-assets';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getAssetTypeLabel, getAssetConfidenceLabel } from '@/modules/cybersecurity/schemas/discovery/assets.schemas';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/modules/shadcnui/components/ui/dropdown-menu';

// ==========================================
// Types
// ==========================================

type SortField = 'asset_type' | 'value' | 'service_name';
type SortDirection = 'asc' | 'desc' | null;

export default function AssetsPage() {
  const { activeOrganization } = useOrganizations();
  const { assets, isLoading, error, fetchAssets } = useAssets();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch assets when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort assets
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...assets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.value.toLowerCase().includes(term) ||
        getAssetTypeLabel(item.asset_type).toLowerCase().includes(term) ||
        (item.service_name && item.service_name.toLowerCase().includes(term)) ||
        (item.host && item.host.toLowerCase().includes(term))
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'asset_type': comparison = a.asset_type.localeCompare(b.asset_type); break;
          case 'value': comparison = a.value.localeCompare(b.value); break;
          case 'service_name': comparison = (a.service_name || '').localeCompare(b.service_name || ''); break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [assets, searchTerm, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
    } else { setSortField(field); setSortDirection('asc'); }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />;
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!activeOrganization) return <Alert><AlertDescription>Please select an organization first. <Link href="/organizations" className="underline">Go to Organizations</Link></AlertDescription></Alert>;

  const totalCount = assets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Discovered infrastructure from scans</p>
        </div>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by value, type, service, or host..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{totalCount === 0 ? 'No assets discovered yet' : 'No assets match filters'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{totalCount === 0 ? 'Run a scan to discover infrastructure assets' : 'Try adjusting your search criteria'}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('asset_type')}>Type <SortIndicator field="asset_type" /></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('value')}>Value <SortIndicator field="value" /></Button></TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('service_name')}>Service <SortIndicator field="service_name" /></Button></TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((asset) => (
                  <TableRow key={asset.id} className="cursor-pointer" onClick={() => window.location.href = `/assets/${asset.id}/details`}>
                    <TableCell>{getAssetTypeLabel(asset.asset_type)}</TableCell>
                    <TableCell className="font-mono text-sm max-w-[200px] truncate">{asset.value}</TableCell>
                    <TableCell className="font-mono text-sm">{asset.host || '—'}</TableCell>
                    <TableCell>{asset.port || '—'}</TableCell>
                    <TableCell>{asset.service_name || '—'}{asset.service_version ? ` ${asset.service_version}` : ''}</TableCell>
                    <TableCell>{getAssetConfidenceLabel(asset.confidence)}</TableCell>
                    <TableCell>{new Date(asset.first_seen_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/assets/${asset.id}/details`; }}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">Showing {filteredRows.length} of {totalCount} assets</p>
          </>
        )}
      </div>
    </div>
  );
}
