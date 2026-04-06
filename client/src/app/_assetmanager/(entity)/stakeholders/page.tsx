'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getStakeholderTypeLabel } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
import type { Stakeholder } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
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
 * Sort field options for the stakeholders table
 */
type SortField = 'name' | 'type' | 'board_seats';
type SortDirection = 'asc' | 'desc' | null;

export default function StakeholdersPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { stakeholders, isLoading, error, fetchStakeholders, getStakeholdersByEntity } = useStakeholders();
  const { getEntityName } = useEntities();

  // Helper to get stakeholder display name from source entity
  const getStakeholderName = (s: Stakeholder) => getEntityName(s.source_entity_id);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch stakeholders when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchStakeholders({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Filter stakeholders for the active entity
  const entityStakeholders = activeEntity
    ? getStakeholdersByEntity(activeEntity.id)
    : [];

  // ==========================================
  // Filter and sort stakeholders
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entityStakeholders];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getStakeholderName(item).toLowerCase().includes(term) ||
        getStakeholderTypeLabel(item.type).toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = getStakeholderName(a).localeCompare(getStakeholderName(b));
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'board_seats':
            comparison = a.board_seats - b.board_seats;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityStakeholders, searchTerm, sortField, sortDirection]);

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
  const totalCount = entityStakeholders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stakeholders</h1>
          <p className="text-muted-foreground">
            Manage stakeholders for {activeEntity.name}
          </p>
        </div>
        <Link href="/stakeholders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Stakeholder
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
              placeholder="Search by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table or empty state */}
        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No stakeholders yet' : 'No stakeholders match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first stakeholder to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/stakeholders/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Stakeholder
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
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <SortIndicator field="name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('type')}
                    >
                      Type
                      <SortIndicator field="type" />
                    </Button>
                  </TableHead>
                  <TableHead>Voting Rights</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-medium hover:bg-transparent"
                      onClick={() => handleSort('board_seats')}
                    >
                      Board Seats
                      <SortIndicator field="board_seats" />
                    </Button>
                  </TableHead>
                  <TableHead>Carry %</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((stakeholder) => (
                  <TableRow
                    key={stakeholder.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/stakeholders/${stakeholder.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {getStakeholderName(stakeholder)}
                      </div>
                    </TableCell>
                    <TableCell>{getStakeholderTypeLabel(stakeholder.type)}</TableCell>
                    <TableCell>{stakeholder.voting_rights ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{stakeholder.board_seats}</TableCell>
                    <TableCell>
                      {stakeholder.carried_interest_percentage != null
                        ? `${stakeholder.carried_interest_percentage}%`
                        : '—'}
                    </TableCell>
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
                              router.push(`/stakeholders/${stakeholder.id}/details`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/stakeholders/${stakeholder.id}/details?tab=edit`);
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
              Showing {filteredRows.length} of {totalCount} stakeholders
            </p>
          </>
        )}
      </div>
    </div>
  );
}
