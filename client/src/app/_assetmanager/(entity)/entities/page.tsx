'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil, CheckCircle } from 'lucide-react';

import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getEntityTypeLabel } from '@/modules/assetmanager/schemas/entity/entity.schemas';
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
 * Sort field options for the entities table
 */
type SortField = 'name' | 'entity_type';
type SortDirection = 'asc' | 'desc' | null;

export default function EntitiesPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { entities, isLoading, error, fetchEntities, getEntitiesByOrganization, activeEntity, setActiveEntity } = useEntities();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch all entities — store holds ALL accessible entities across all user's orgs
  // Sidebar filters client-side via getEntitiesByOrganization() below
  useEffect(() => {
    if (activeOrganization) {
      fetchEntities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // Filter entities for the active organization (client-side)
  const organizationEntities = activeOrganization
    ? getEntitiesByOrganization(activeOrganization.id)
    : [];

  // ==========================================
  // Filter and sort entities
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...organizationEntities];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        getEntityTypeLabel(item.entity_type).toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'entity_type':
            comparison = a.entity_type.localeCompare(b.entity_type);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [organizationEntities, searchTerm, sortField, sortDirection]);

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

  if (!activeOrganization) {
    return (
      <Alert>
        <AlertDescription>
          Please select an organization first.{' '}
          <Link href="/organizations" className="underline">
            Go to Organizations
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Total count before filters
  const totalCount = organizationEntities.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entities</h1>
          <p className="text-muted-foreground">
            Manage entities for {activeOrganization.name}
          </p>
        </div>
        <Link href="/entities/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Entity
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
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No entities yet' : 'No entities match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first entity to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/entities/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Entity
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
                      onClick={() => handleSort('entity_type')}
                    >
                      Type
                      <SortIndicator field="entity_type" />
                    </Button>
                  </TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((entity) => (
                  <TableRow
                    key={entity.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/entities/${entity.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {entity.name}
                        {activeEntity?.id === entity.id && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getEntityTypeLabel(entity.entity_type)}</TableCell>
                    <TableCell>{new Date(entity.created_at).toLocaleDateString()}</TableCell>
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
                              setActiveEntity(entity.id);
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Set as Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/entities/${entity.id}/details`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/entities/${entity.id}/details?tab=edit`);
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
              Showing {filteredRows.length} of {totalCount} entities
            </p>
          </>
        )}
      </div>
    </div>
  );
}
