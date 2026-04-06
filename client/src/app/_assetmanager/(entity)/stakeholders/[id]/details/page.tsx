'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getStakeholderTypeLabel } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
import { EntityDiscoveryResult } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Users, Pencil, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/modules/shadcnui/components/ui/command';
import { cn } from '@/modules/shadcnui/lib/utils';
import { useEffect, useState } from 'react';

export default function StakeholderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stakeholderId = parseInt(params.id as string);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const { stakeholders, isLoading, error, fetchStakeholder, updateStakeholder, deleteStakeholder, fetchStakeholders } = useStakeholders();
  const { entities, getEntityName, discoverEntities } = useEntities();
  const { activeOrganization } = useOrganizations();

  const stakeholder = stakeholders.find(s => s.id === stakeholderId);

  // Split entities into current org vs other orgs (excluding stakeholder's entity — can't be a source for yourself)
  // Why: entities from the store contains ALL accessible entities across all user's orgs
  const currentOrgEntities = entities.filter(e => e.id !== stakeholder?.entity_id && e.organization_id === activeOrganization?.id);
  const otherOrgEntities = entities.filter(e => e.id !== stakeholder?.entity_id && e.organization_id !== activeOrganization?.id);

  // Derive name from source entity
  const stakeholderName = stakeholder ? getEntityName(stakeholder.source_entity_id) : '';

  // Settings state - Core Info
  const [editSourceEntityId, setEditSourceEntityId] = useState<number | null>(null);
  const [editType, setEditType] = useState<string>('');
  // Settings state - Investment Rights
  const [editCarriedInterest, setEditCarriedInterest] = useState<string>('');
  const [editPreferredReturn, setEditPreferredReturn] = useState<string>('');
  const [editDistributionTier, setEditDistributionTier] = useState<string>('');
  // Settings state - Governance Rights
  const [editBoardSeats, setEditBoardSeats] = useState<string>('');
  const [editVotingRights, setEditVotingRights] = useState(true);
  const [editProRataRights, setEditProRataRights] = useState(false);
  const [editDragAlong, setEditDragAlong] = useState(false);
  const [editTagAlong, setEditTagAlong] = useState(false);
  const [editObserverRights, setEditObserverRights] = useState(false);
  // Settings state - Investment Terms
  const [editMinInvestment, setEditMinInvestment] = useState<string>('');
  const [editMaxInvestment, setEditMaxInvestment] = useState<string>('');
  // Discovery state — cross-org entity search
  const [discoveryResults, setDiscoveryResults] = useState<EntityDiscoveryResult[]>([]);
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sourceEntityOpen, setSourceEntityOpen] = useState(false);
  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when stakeholder loads
  useEffect(() => {
    if (stakeholder) {
      setEditType(stakeholder.type);
      setEditSourceEntityId(stakeholder.source_entity_id);
      setEditCarriedInterest(stakeholder.carried_interest_percentage?.toString() || '');
      setEditPreferredReturn(stakeholder.preferred_return_rate?.toString() || '');
      setEditDistributionTier(stakeholder.distribution_tier.toString());
      setEditBoardSeats(stakeholder.board_seats.toString());
      setEditVotingRights(stakeholder.voting_rights);
      setEditProRataRights(stakeholder.pro_rata_rights);
      setEditDragAlong(stakeholder.drag_along);
      setEditTagAlong(stakeholder.tag_along);
      setEditObserverRights(stakeholder.observer_rights);
      setEditMinInvestment(stakeholder.minimum_investment?.toString() || '');
      setEditMaxInvestment(stakeholder.maximum_investment?.toString() || '');
    }
  }, [stakeholder]);

  // Fetch stakeholder if not in store
  useEffect(() => {
    if (stakeholderId && !stakeholder) {
      fetchStakeholder(stakeholderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stakeholderId]);

  // Debounced discovery search — triggers when user types 2+ chars
  useEffect(() => {
    if (discoverySearch.length < 2) {
      setDiscoveryResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await discoverEntities(discoverySearch, activeOrganization!.id);
      setDiscoveryResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverySearch]);

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

  if (!stakeholder) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Stakeholder not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/stakeholders">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Stakeholders
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{stakeholderName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getStakeholderTypeLabel(stakeholder.type)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getEntityName(stakeholder.entity_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Users className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Core Info */}
          <Card>
            <CardHeader>
              <CardTitle>Core Info</CardTitle>
              <CardDescription>
                Basic stakeholder information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-lg font-medium">{stakeholderName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-medium">{getStakeholderTypeLabel(stakeholder.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity (Cap Table)</p>
                  <p className="text-lg font-medium">{getEntityName(stakeholder.entity_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source Entity (Investor)</p>
                  <p className="text-lg font-medium">{getEntityName(stakeholder.source_entity_id)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Rights</CardTitle>
              <CardDescription>
                Carried interest and distribution settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Carried Interest %</p>
                  <p className="text-lg font-medium">
                    {stakeholder.carried_interest_percentage !== null
                      ? `${stakeholder.carried_interest_percentage}%`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Return Rate %</p>
                  <p className="text-lg font-medium">
                    {stakeholder.preferred_return_rate !== null
                      ? `${stakeholder.preferred_return_rate}%`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distribution Tier</p>
                  <p className="text-lg font-medium">{stakeholder.distribution_tier}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governance Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Governance Rights</CardTitle>
              <CardDescription>
                Voting, board seats, and other governance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Board Seats</p>
                  <p className="text-lg font-medium">{stakeholder.board_seats}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Voting Rights</p>
                  <p className="text-lg font-medium">{stakeholder.voting_rights ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pro Rata Rights</p>
                  <p className="text-lg font-medium">{stakeholder.pro_rata_rights ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drag Along</p>
                  <p className="text-lg font-medium">{stakeholder.drag_along ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tag Along</p>
                  <p className="text-lg font-medium">{stakeholder.tag_along ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Observer Rights</p>
                  <p className="text-lg font-medium">{stakeholder.observer_rights ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Terms</CardTitle>
              <CardDescription>
                Minimum and maximum investment amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Investment</p>
                  <p className="text-lg font-medium">
                    {stakeholder.minimum_investment !== null
                      ? `$${stakeholder.minimum_investment.toLocaleString()}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maximum Investment</p>
                  <p className="text-lg font-medium">
                    {stakeholder.maximum_investment !== null
                      ? `$${stakeholder.maximum_investment.toLocaleString()}`
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-lg font-medium">
                    {new Date(stakeholder.created_at).toLocaleDateString()}
                  </p>
                </div>
                {stakeholder.updated_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-medium">
                      {new Date(stakeholder.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Stakeholder</CardTitle>
              <CardDescription>
                Update stakeholder details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Core Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stakeholder-type">Stakeholder Type *</Label>
                  <Select
                    value={editType}
                    onValueChange={setEditType}
                  >
                    <SelectTrigger id="stakeholder-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_partner">General Partner</SelectItem>
                      <SelectItem value="limited_partner">Limited Partner</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                      <SelectItem value="board_member">Board Member</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Source Entity — the investing entity (required) */}
              <div className="space-y-2">
                <Label htmlFor="source-entity">Source Entity *</Label>
                <Popover open={sourceEntityOpen} onOpenChange={setSourceEntityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sourceEntityOpen}
                      className="w-full justify-between font-normal"
                    >
                      {editSourceEntityId
                        ? (entities.find(e => e.id === editSourceEntityId)?.name
                          || discoveryResults.find(e => e.id === editSourceEntityId)?.name
                          || `Entity #${editSourceEntityId}`)
                        : 'Select the investing entity'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search entities..."
                        value={discoverySearch}
                        onValueChange={setDiscoverySearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isSearching ? 'Searching...' : 'No entities found. Type to search other organizations.'}
                        </CommandEmpty>

                        {/* Current org entities */}
                        {currentOrgEntities.filter(e =>
                          !discoverySearch || e.name.toLowerCase().includes(discoverySearch.toLowerCase())
                        ).length > 0 && (
                          <CommandGroup heading="Your organization">
                            {currentOrgEntities
                              .filter(e => !discoverySearch || e.name.toLowerCase().includes(discoverySearch.toLowerCase()))
                              .map((entity) => (
                                <CommandItem
                                  key={`local-${entity.id}`}
                                  value={entity.id.toString()}
                                  onSelect={() => {
                                    setEditSourceEntityId(entity.id);
                                    setSourceEntityOpen(false);
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', editSourceEntityId === entity.id ? 'opacity-100' : 'opacity-0')} />
                                  {entity.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}

                        {/* Entities from user's other organizations */}
                        {otherOrgEntities.filter(e =>
                          !discoverySearch || e.name.toLowerCase().includes(discoverySearch.toLowerCase())
                        ).length > 0 && (
                          <CommandGroup heading="Other organizations">
                            {otherOrgEntities
                              .filter(e => !discoverySearch || e.name.toLowerCase().includes(discoverySearch.toLowerCase()))
                              .map((entity) => (
                                <CommandItem
                                  key={`other-${entity.id}`}
                                  value={`o-${entity.id}`}
                                  onSelect={() => {
                                    setEditSourceEntityId(entity.id);
                                    setSourceEntityOpen(false);
                                  }}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', editSourceEntityId === entity.id ? 'opacity-100' : 'opacity-0')} />
                                  {entity.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}

                        {/* Discovery results — discoverable entities from orgs user is not part of */}
                        {discoveryResults.length > 0 && (
                          <CommandGroup heading="Discovered">
                            {discoveryResults.map((entity) => (
                              <CommandItem
                                key={`discovery-${entity.id}`}
                                value={`d-${entity.id}`}
                                onSelect={() => {
                                  setEditSourceEntityId(entity.id);
                                  setSourceEntityOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', editSourceEntityId === entity.id ? 'opacity-100' : 'opacity-0')} />
                                {entity.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  The entity that is investing on this cap table. Stakeholder name comes from this entity.
                </p>
              </div>

              {/* Investment Rights */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Investment Rights</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carried-interest">Carried Interest %</Label>
                    <Input
                      id="carried-interest"
                      type="number"
                      step="0.01"
                      value={editCarriedInterest}
                      onChange={(e) => setEditCarriedInterest(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferred-return">Preferred Return Rate %</Label>
                    <Input
                      id="preferred-return"
                      type="number"
                      step="0.01"
                      value={editPreferredReturn}
                      onChange={(e) => setEditPreferredReturn(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distribution-tier">Distribution Tier</Label>
                    <Input
                      id="distribution-tier"
                      type="number"
                      step="1"
                      value={editDistributionTier}
                      onChange={(e) => setEditDistributionTier(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Governance Rights */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Governance Rights</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="board-seats">Board Seats</Label>
                    <Input
                      id="board-seats"
                      type="number"
                      step="1"
                      value={editBoardSeats}
                      onChange={(e) => setEditBoardSeats(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-voting-rights"
                      checked={editVotingRights}
                      onCheckedChange={(checked) => setEditVotingRights(checked === true)}
                    />
                    <Label htmlFor="edit-voting-rights">Voting Rights</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-pro-rata"
                      checked={editProRataRights}
                      onCheckedChange={(checked) => setEditProRataRights(checked === true)}
                    />
                    <Label htmlFor="edit-pro-rata">Pro Rata Rights</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-drag-along"
                      checked={editDragAlong}
                      onCheckedChange={(checked) => setEditDragAlong(checked === true)}
                    />
                    <Label htmlFor="edit-drag-along">Drag Along</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-tag-along"
                      checked={editTagAlong}
                      onCheckedChange={(checked) => setEditTagAlong(checked === true)}
                    />
                    <Label htmlFor="edit-tag-along">Tag Along</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-observer-rights"
                      checked={editObserverRights}
                      onCheckedChange={(checked) => setEditObserverRights(checked === true)}
                    />
                    <Label htmlFor="edit-observer-rights">Observer Rights</Label>
                  </div>
                </div>
              </div>

              {/* Investment Terms */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Investment Terms</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-investment">Minimum Investment</Label>
                    <Input
                      id="min-investment"
                      type="number"
                      step="0.01"
                      value={editMinInvestment}
                      onChange={(e) => setEditMinInvestment(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-investment">Maximum Investment</Label>
                    <Input
                      id="max-investment"
                      type="number"
                      step="0.01"
                      value={editMaxInvestment}
                      onChange={(e) => setEditMaxInvestment(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={async () => {
                  if (!editSourceEntityId) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    await updateStakeholder(stakeholderId, {
                      type: editType as 'general_partner' | 'limited_partner' | 'employee' | 'advisor' | 'board_member' | 'investor',
                      source_entity_id: editSourceEntityId,
                      carried_interest_percentage: editCarriedInterest ? parseFloat(editCarriedInterest) : null,
                      preferred_return_rate: editPreferredReturn ? parseFloat(editPreferredReturn) : null,
                      distribution_tier: parseInt(editDistributionTier) || 1,
                      board_seats: parseInt(editBoardSeats) || 0,
                      voting_rights: editVotingRights,
                      pro_rata_rights: editProRataRights,
                      drag_along: editDragAlong,
                      tag_along: editTagAlong,
                      observer_rights: editObserverRights,
                      minimum_investment: editMinInvestment ? parseFloat(editMinInvestment) : null,
                      maximum_investment: editMaxInvestment ? parseFloat(editMaxInvestment) : null,
                    });
                    await fetchStakeholders({ entity_id: stakeholder?.entity_id || undefined });
                  } catch (error) {
                    console.error('Failed to update stakeholder:', error);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this stakeholder</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a stakeholder, there is no going back. This will permanently delete the stakeholder and all associated data.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-stakeholder">
                    Type <span className="font-semibold">{stakeholderName}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-stakeholder"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Entity name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== stakeholderName) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteStakeholder(stakeholderId);
                      router.push('/stakeholders');
                    } catch (error) {
                      console.error('Failed to delete stakeholder:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== stakeholderName}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Stakeholder
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
