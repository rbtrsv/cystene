'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getSecurityTypeLabel } from '@/modules/assetmanager/schemas/captable/security.schemas';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shadcnui/components/ui/dropdown-menu';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the securities table
 */
type SortField = 'security_name' | 'security_type' | 'code';
type SortDirection = 'asc' | 'desc' | null;

export default function SecuritiesPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { fundingRounds, fetchFundingRounds, getFundingRoundsByEntity } = useFundingRounds();
  const { securities, isLoading, error, fetchSecurities } = useSecurities();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch funding rounds when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchFundingRounds({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Fetch securities when funding rounds are loaded
  useEffect(() => {
    if (activeEntity) {
      const entityRounds = getFundingRoundsByEntity(activeEntity.id);
      if (entityRounds.length > 0) {
        // Fetch all securities for all funding rounds of this entity
        // The API supports filtering by funding_round_id, but we fetch all and filter client-side
        fetchSecurities();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity, fundingRounds]);

  // Filter securities for the active entity's funding rounds
  const entityRoundIds = activeEntity
    ? getFundingRoundsByEntity(activeEntity.id).map(r => r.id)
    : [];
  const entitySecurities = securities.filter(s => entityRoundIds.includes(s.funding_round_id));

  // Get funding round name by ID for display
  const getFundingRoundName = (fundingRoundId: number) => {
    const round = fundingRounds.find(r => r.id === fundingRoundId);
    return round ? round.name : 'Unknown Round';
  };

  // ==========================================
  // Filter and sort securities
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entitySecurities];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.security_name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        getSecurityTypeLabel(item.security_type).toLowerCase().includes(term) ||
        getFundingRoundName(item.funding_round_id).toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'security_name':
            comparison = a.security_name.localeCompare(b.security_name);
            break;
          case 'security_type':
            comparison = a.security_type.localeCompare(b.security_type);
            break;
          case 'code':
            comparison = a.code.localeCompare(b.code);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitySecurities, searchTerm, sortField, sortDirection]);

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

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Total count before filters
  const totalCount = entitySecurities.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Securities</h1>
          <p className="text-muted-foreground">
            Manage securities for {activeEntity.name}
          </p>
        </div>
        <Link href="/securities/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Security
          </Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, code, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table or empty state */}
        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No securities yet' : 'No securities match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first security to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/securities/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Security
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
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
                      onClick={() => handleSort('security_name')}
                    >
                      Name
                      <SortIndicator field="security_name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('code')}
                    >
                      Code
                      <SortIndicator field="code" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('security_type')}
                    >
                      Type
                      <SortIndicator field="security_type" />
                    </Button>
                  </TableHead>
                  <TableHead>Funding Round</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((security) => (
                  <TableRow
                    key={security.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/securities/${security.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {security.security_name}
                      </div>
                    </TableCell>
                    <TableCell>{security.code}</TableCell>
                    <TableCell>{getSecurityTypeLabel(security.security_type)}</TableCell>
                    <TableCell>{getFundingRoundName(security.funding_round_id)}</TableCell>
                    <TableCell>{security.currency}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/securities/${security.id}/details`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/securities/${security.id}/details?tab=edit`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {totalCount} securities
            </p>
          </>
        )}
      </div>
    </div>
  );
}
