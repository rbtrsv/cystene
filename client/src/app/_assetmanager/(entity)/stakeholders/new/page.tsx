'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateStakeholderSchema } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
import { EntityDiscoveryResult } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/modules/shadcnui/components/ui/command';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/modules/shadcnui/lib/utils';
import Link from 'next/link';

export default function CreateStakeholderPage() {
  const router = useRouter();
  const { entities, activeEntity, discoverEntities } = useEntities();
  const { activeOrganization } = useOrganizations();
  const { createStakeholder, error: storeError } = useStakeholders();

  // Split entities into current org vs other orgs (excluding activeEntity — can't be a stakeholder in yourself)
  // Why: entities from the store contains ALL accessible entities across all user's orgs
  const currentOrgEntities = entities.filter(e => e.id !== activeEntity?.id && e.organization_id === activeOrganization?.id);
  const otherOrgEntities = entities.filter(e => e.id !== activeEntity?.id && e.organization_id !== activeOrganization?.id);

  // Discovery state — cross-org entity search
  const [discoveryResults, setDiscoveryResults] = useState<EntityDiscoveryResult[]>([]);
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sourceEntityOpen, setSourceEntityOpen] = useState(false);

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

  const form = useForm({
    defaultValues: {
      // Core fields
      type: 'investor' as 'general_partner' | 'limited_partner' | 'employee' | 'advisor' | 'board_member' | 'investor',
      entity_id: activeEntity?.id || (null as number | null),
      source_entity_id: null as number | null,
      // Investment Rights
      carried_interest_percentage: null as number | null,
      preferred_return_rate: null as number | null,
      distribution_tier: 1,
      // Governance Rights
      board_seats: 0,
      voting_rights: true,
      pro_rata_rights: false,
      drag_along: false,
      tag_along: false,
      observer_rights: false,
      // Investment Terms
      minimum_investment: null as number | null,
      maximum_investment: null as number | null,
    },
    onSubmit: async ({ value }) => {
      // source_entity_id is required
      if (!value.source_entity_id) {
        return;
      }

      // Validate with Zod
      const validation = CreateStakeholderSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createStakeholder(value as Parameters<typeof createStakeholder>[0]);

      if (success) {
        router.push('/stakeholders');
      }
      // Error is handled by store and displayed via storeError
    },
  });

  if (!activeEntity) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            Please select an entity first.{' '}
            <Link href="/entities" className="underline">
              Go to Entities
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/stakeholders">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stakeholders
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Stakeholder</h1>
        <p className="text-muted-foreground mt-2">
          Add a new stakeholder for {activeEntity.name}
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {/* Core Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Core Info</CardTitle>
            <CardDescription>
              Basic stakeholder information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Type */}
              <form.Field name="type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Stakeholder Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stakeholder type" />
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
                )}
              </form.Field>

              {/* Source Entity — the investing entity (required, name comes from here) */}
              <form.Field name="source_entity_id">
                {(field) => {
                  // Resolve selected entity name from all accessible entities or discovery results
                  const selectedName = field.state.value
                    ? (entities.find(e => e.id === field.state.value)?.name
                      || discoveryResults.find(e => e.id === field.state.value)?.name
                      || `Entity #${field.state.value}`)
                    : null;

                  return (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Source Entity *</Label>
                      <Popover open={sourceEntityOpen} onOpenChange={setSourceEntityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={sourceEntityOpen}
                            className="w-full justify-between font-normal"
                            disabled={form.state.isSubmitting}
                          >
                            {selectedName || 'Select the investing entity'}
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
                                          field.handleChange(entity.id);
                                          setSourceEntityOpen(false);
                                        }}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', field.state.value === entity.id ? 'opacity-100' : 'opacity-0')} />
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
                                          field.handleChange(entity.id);
                                          setSourceEntityOpen(false);
                                        }}
                                      >
                                        <Check className={cn('mr-2 h-4 w-4', field.state.value === entity.id ? 'opacity-100' : 'opacity-0')} />
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
                                        field.handleChange(entity.id);
                                        setSourceEntityOpen(false);
                                      }}
                                    >
                                      <Check className={cn('mr-2 h-4 w-4', field.state.value === entity.id ? 'opacity-100' : 'opacity-0')} />
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
                  );
                }}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Investment Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Investment Rights</CardTitle>
            <CardDescription>
              Carried interest and distribution settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Carried Interest Percentage */}
              <form.Field name="carried_interest_percentage">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Carried Interest %</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Preferred Return Rate */}
              <form.Field name="preferred_return_rate">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Preferred Return Rate %</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Distribution Tier */}
              <form.Field name="distribution_tier">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Distribution Tier</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="1"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 1)}
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Governance Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Governance Rights</CardTitle>
            <CardDescription>
              Voting, board seats, and other governance settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Board Seats */}
              <form.Field name="board_seats">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Board Seats</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="1"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Voting Rights */}
              <form.Field name="voting_rights">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      disabled={form.state.isSubmitting}
                    />
                    <Label htmlFor={field.name}>Voting Rights</Label>
                  </div>
                )}
              </form.Field>

              {/* Pro Rata Rights */}
              <form.Field name="pro_rata_rights">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      disabled={form.state.isSubmitting}
                    />
                    <Label htmlFor={field.name}>Pro Rata Rights</Label>
                  </div>
                )}
              </form.Field>

              {/* Drag Along */}
              <form.Field name="drag_along">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      disabled={form.state.isSubmitting}
                    />
                    <Label htmlFor={field.name}>Drag Along</Label>
                  </div>
                )}
              </form.Field>

              {/* Tag Along */}
              <form.Field name="tag_along">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      disabled={form.state.isSubmitting}
                    />
                    <Label htmlFor={field.name}>Tag Along</Label>
                  </div>
                )}
              </form.Field>

              {/* Observer Rights */}
              <form.Field name="observer_rights">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      disabled={form.state.isSubmitting}
                    />
                    <Label htmlFor={field.name}>Observer Rights</Label>
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Investment Terms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Investment Terms</CardTitle>
            <CardDescription>
              Minimum and maximum investment amounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Minimum Investment */}
              <form.Field name="minimum_investment">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Minimum Investment</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Maximum Investment */}
              <form.Field name="maximum_investment">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Maximum Investment</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={form.state.isSubmitting}
            className="flex-1"
          >
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Stakeholder'
            )}
          </Button>
          <Link href="/stakeholders" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={form.state.isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
