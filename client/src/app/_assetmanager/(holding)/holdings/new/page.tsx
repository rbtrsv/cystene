'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useHoldings } from '@/modules/assetmanager/hooks/holding/use-holdings';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateHoldingSchema, type CreateHolding, INVESTMENT_TYPE_OPTIONS, COMPANY_TYPE_OPTIONS, SECTOR_OPTIONS } from '@/modules/assetmanager/schemas/holding/holding.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// ==========================================
// Dropdown Options
// ==========================================

const INVESTMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'exited', label: 'Exited' },
  { value: 'written_off', label: 'Written Off' },
] as const;

const LISTING_STATUS_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
] as const;

export default function CreateHoldingPage() {
  const router = useRouter();
  const { activeEntity, entities } = useEntities();
  const { createHolding, error: storeError } = useHoldings();

  // Entity selector popover state
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      // Investment Details
      investment_name: '',
      entity_type: '',
      investment_type: '',
      investment_round: null as string | null,
      investment_status: 'active',
      sector: '',
      listing_status: 'private',
      original_investment_date: null as string | null,
      // References
      target_entity_id: null as number | null,
      company_name: null as string | null,
      funding_round_id: null as number | null,
      // Financial Details
      total_investment_amount: null as number | null,
      ownership_percentage: null as number | null,
      invested_as_percent_capital: null as number | null,
      // Share Details
      number_of_shares: null as number | null,
      average_cost_per_share: null as number | null,
      current_share_price: null as number | null,
      // Exchange Details
      stock_ticker: null as string | null,
      exchange: null as string | null,
      // Valuation & Performance
      current_fair_value: null as number | null,
      moic: null as number | null,
      irr: null as number | null,
      // Export
      export_functionality: false,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      // Validate with Zod — cast needed for enum literal compatibility
      const validation = CreateHoldingSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createHolding(validation.data as CreateHolding);
      if (success) router.push('/holdings');
    },
  });

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/holdings">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Holdings
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Holding</h1>
        <p className="text-muted-foreground mt-2">
          Add a new investment holding
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
        className="space-y-6"
      >
        {/* Entity Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Entity</CardTitle>
            <CardDescription>
              Select which entity this holding belongs to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="entity_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Entity *</Label>
                  <Popover open={entityPopoverOpen} onOpenChange={setEntityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={entityPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {field.state.value
                            ? entities.find((e) => e.id === field.state.value)?.name || 'Select entity'
                            : 'Select entity'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search entity..." />
                        <CommandList>
                          <CommandEmpty>No entities found.</CommandEmpty>
                          <CommandGroup>
                            {entities.map((entity) => (
                              <CommandItem
                                key={entity.id}
                                value={entity.name}
                                onSelect={() => {
                                  field.handleChange(entity.id);
                                  setEntityPopoverOpen(false);
                                }}
                              >
                                {entity.name}
                                {field.state.value === entity.id && (
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
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
            <CardDescription>
              Core investment information and classification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="investment_name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investment Name *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="entity_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Company Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="investment_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investment Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTMENT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="sector">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Sector</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="investment_status">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investment Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTMENT_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="listing_status">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Listing Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing" />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="investment_round">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investment Round</Label>
                    <Input
                      id={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="original_investment_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Original Investment Date</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={(field.state.value as string | null) || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="company_name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Company Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>
              Investment amounts and ownership percentages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="total_investment_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Total Investment Amount</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="ownership_percentage">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Ownership %</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="invested_as_percent_capital">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>% of Capital</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Share Details */}
        <Card>
          <CardHeader>
            <CardTitle>Share Details</CardTitle>
            <CardDescription>
              Share count and pricing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="number_of_shares">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Number of Shares</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="average_cost_per_share">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Avg Cost/Share</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="current_share_price">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Current Price</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Details */}
        <Card>
          <CardHeader>
            <CardTitle>Exchange Details</CardTitle>
            <CardDescription>
              Stock ticker and exchange information (for public holdings)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="stock_ticker">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Stock Ticker</Label>
                    <Input
                      id={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="exchange">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Exchange</Label>
                    <Input
                      id={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Valuation & Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Valuation & Performance</CardTitle>
            <CardDescription>
              Fair value and return metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="current_fair_value">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Current Fair Value</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="moic">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>MOIC</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="irr">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>IRR</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Field name="export_functionality">
              {(field) => (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={field.name}>Enable Export Functionality</Label>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Submit */}
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
              'Create Holding'
            )}
          </Button>
          <Link href="/holdings" className="flex-1">
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
