'use client';

import { useState, useCallback } from 'react';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useEntityOrganizationInvitations } from '@/modules/assetmanager/hooks/entity/use-entity-organization-invitations';
import { getEntityTypeLabel } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import type { EntityDiscoveryResult } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Search, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverEntitiesPage() {
  const { discoverEntities, joinByInviteCode } = useEntities();
  const { activeOrganization } = useOrganizations();
  const { requestAccess } = useEntityOrganizationInvitations();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntityDiscoveryResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [requestingEntityId, setRequestingEntityId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinByCode = async () => {
    if (!inviteCode.trim() || !activeOrganization) return;

    setIsJoining(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const result = await joinByInviteCode(inviteCode.trim(), activeOrganization.id);

    if (result.success) {
      setSuccessMessage(result.message || 'Successfully joined entity!');
      setInviteCode('');
    } else {
      setErrorMessage(result.error || 'Failed to join. Invalid code or already a member.');
    }

    setIsJoining(false);
  };

  const handleSearch = useCallback(async () => {
    if (query.length < 2 || !activeOrganization) return;

    setIsSearching(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const data = await discoverEntities(query, activeOrganization.id);
      setResults(data);
      setHasSearched(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [query, activeOrganization, discoverEntities]);

  const handleRequestAccess = async (entityId: number, entityName: string) => {
    if (!activeOrganization) return;

    setRequestingEntityId(entityId);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const success = await requestAccess({
        entity_id: entityId,
        organization_id: activeOrganization.id,
      });

      if (success) {
        setSuccessMessage(`Access request sent for "${entityName}". The entity owner will review your request.`);
        // Remove from results to prevent duplicate requests
        setResults(prev => prev.filter(r => r.id !== entityId));
      } else {
        setErrorMessage('Failed to send access request. It may already exist.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to request access');
    } finally {
      setRequestingEntityId(null);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/entities">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Entities
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Discover Entities</h1>
        <p className="text-muted-foreground">
          Search for discoverable entities and request access
        </p>
      </div>

      {/* Join by Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle>Have an invite code?</CardTitle>
          <CardDescription>
            Enter an invite code to join an entity directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Paste invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inviteCode.trim() && activeOrganization) {
                  handleJoinByCode();
                }
              }}
              className="font-mono"
            />
            <Button
              onClick={handleJoinByCode}
              disabled={!inviteCode.trim() || isJoining || !activeOrganization}
            >
              {isJoining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Join'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Find entities that other organizations have made discoverable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by entity name (min 2 characters)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.length >= 2) {
                  handleSearch();
                }
              }}
            />
            <Button
              onClick={handleSearch}
              disabled={query.length < 2 || isSearching}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback messages */}
      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {results.length === 0
                ? 'No discoverable entities found matching your search'
                : `Found ${results.length} discoverable entit${results.length === 1 ? 'y' : 'ies'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No entities found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getEntityTypeLabel(entity.entity_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleRequestAccess(entity.id, entity.name)}
                          disabled={requestingEntityId === entity.id}
                        >
                          {requestingEntityId === entity.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Request Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
