'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { getOrgStatusVariant, getOrgTypeVariant } from '@/modules/nexotype/schemas/commercial/market-organization.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Building2, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the market organizations table
 */
type SortField = 'legal_name';
type SortDirection = 'asc' | 'desc' | null;

export default function MarketOrganizationsPage() {
  const router = useRouter();
  const {
    marketOrganizations,
    isLoading,
    error,
  } = useMarketOrganizations();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort market organizations
  // ==========================================

  const filteredOrgs = useMemo(() => {
    let filtered = marketOrganizations;

    // Search by legal name or ticker symbol
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(org =>
        org.legal_name.toLowerCase().includes(term) ||
        (org.ticker_symbol && org.ticker_symbol.toLowerCase().includes(term))
      );
    }

    // Filter by org type
    if (orgTypeFilter !== 'all') {
      filtered = filtered.filter(org => org.org_type === orgTypeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'legal_name':
            comparison = a.legal_name.localeCompare(b.legal_name);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [marketOrganizations, searchTerm, orgTypeFilter, statusFilter, sortField, sortDirection]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Organizations</h1>
          <p className="text-muted-foreground">
            Manage companies, universities, and organizations in the market
          </p>
        </div>
        <Link href="/market-organizations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Market Organizations</CardTitle>
          <CardDescription>
            All market organizations in the registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or ticker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgType">Org Type</Label>
              <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="University">University</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Acquired">Acquired</SelectItem>
                  <SelectItem value="Bankrupt">Bankrupt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or empty state */}
          {filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {marketOrganizations.length === 0 ? 'No market organizations yet' : 'No market organizations match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {marketOrganizations.length === 0
                  ? 'Create your first market organization to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {marketOrganizations.length === 0 && (
                <Link href="/market-organizations/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('legal_name')}
                      >
                        Legal Name
                        <SortIndicator field="legal_name" />
                      </Button>
                    </TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Org Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Headquarters</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => (
                    <TableRow
                      key={org.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/market-organizations/${org.id}/details`)}
                    >
                      <TableCell className="font-medium">{org.legal_name}</TableCell>
                      <TableCell>{org.ticker_symbol || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={getOrgTypeVariant(org.org_type)}>{org.org_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getOrgStatusVariant(org.status)}>{org.status}</Badge>
                      </TableCell>
                      <TableCell>{org.headquarters || '—'}</TableCell>
                      <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/market-organizations/${org.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrgs.length} of {marketOrganizations.length} market organizations
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
