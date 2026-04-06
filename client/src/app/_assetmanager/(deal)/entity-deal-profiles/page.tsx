'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useEntityDealProfiles } from '@/modules/assetmanager/hooks/deal/use-entity-deal-profiles';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
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

type SortField = 'short_description' | 'entity_type' | 'industry';
type SortDirection = 'asc' | 'desc' | null;

export default function EntityDealProfilesPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { entityDealProfiles, isLoading, error, fetchEntityDealProfiles } = useEntityDealProfiles();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch entity deal profiles when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchEntityDealProfiles({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Filter profiles for the active entity
  const entityProfiles = activeEntity
    ? entityDealProfiles.filter(p => p.entity_id === activeEntity.id)
    : [];

  // ==========================================
  // Filter and sort profiles
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...entityProfiles];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.short_description && item.short_description.toLowerCase().includes(term)) ||
        item.industry.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        getEntityTypeLabel(item.entity_type).toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'short_description':
            comparison = (a.short_description || '').localeCompare(b.short_description || '');
            break;
          case 'entity_type':
            comparison = a.entity_type.localeCompare(b.entity_type);
            break;
          case 'industry':
            comparison = a.industry.localeCompare(b.industry);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [entityProfiles, searchTerm, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
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

  const totalCount = entityProfiles.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entity Deal Profiles</h1>
          <p className="text-muted-foreground">
            Manage deal profiles for {activeEntity.name}
          </p>
        </div>
        <Link href="/entity-deal-profiles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Profile
          </Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, industry, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No deal profiles yet' : 'No profiles match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? 'Create your first entity deal profile to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/entity-deal-profiles/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Profile
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
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('short_description')}>
                      Name
                      <SortIndicator field="short_description" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('entity_type')}>
                      Type
                      <SortIndicator field="entity_type" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('industry')}>
                      Industry
                      <SortIndicator field="industry" />
                    </Button>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Valuation</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((profile) => (
                  <TableRow
                    key={profile.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/entity-deal-profiles/${profile.id}/details`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {profile.short_description || 'Untitled Profile'}
                      </div>
                    </TableCell>
                    <TableCell>{getEntityTypeLabel(profile.entity_type)}</TableCell>
                    <TableCell>{profile.industry}</TableCell>
                    <TableCell>{profile.location}</TableCell>
                    <TableCell>
                      {profile.current_valuation != null
                        ? `$${profile.current_valuation.toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/entity-deal-profiles/${profile.id}/details`); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/entity-deal-profiles/${profile.id}/details?tab=edit`); }}>
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

            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {totalCount} deal profiles
            </p>
          </>
        )}
      </div>
    </div>
  );
}
