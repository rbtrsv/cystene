'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useHoldingCashFlows } from '@/modules/assetmanager/hooks/holding/use-holding-cash-flows';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useHoldings } from '@/modules/assetmanager/hooks/holding/use-holdings';
import { CreateHoldingCashFlowSchema } from '@/modules/assetmanager/schemas/holding/holding-cash-flow.schemas';
import type { CreateHoldingCashFlow } from '@/modules/assetmanager/schemas/holding/holding-cash-flow.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// ==========================================
// Enum dropdown options
// ==========================================

const CASH_FLOW_TYPE_OPTIONS = [
  { value: 'investment', label: 'Investment' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'fee', label: 'Fee' },
  { value: 'other', label: 'Other' },
] as const;

const CASH_FLOW_CATEGORY_OPTIONS = [
  { value: 'actual', label: 'Actual' },
  { value: 'projected', label: 'Projected' },
] as const;

const CASH_FLOW_SCENARIO_OPTIONS = [
  { value: 'actual', label: 'Actual' },
  { value: 'budget', label: 'Budget' },
  { value: 'forecast', label: 'Forecast' },
] as const;

export default function CreateHoldingCashFlowPage() {
  const router = useRouter();
  const { entities, activeEntity } = useEntities();
  const { createHoldingCashFlow, error: storeError } = useHoldingCashFlows();
  const { holdings, fetchHoldings } = useHoldings();

  // Entity combobox state
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(activeEntity?.id || null);

  // Holding combobox state
  const [holdingPopoverOpen, setHoldingPopoverOpen] = useState(false);

  // Fetch holdings on mount
  useEffect(() => {
    fetchHoldings({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Available holdings for the selected entity
  const availableHoldings = useMemo(() => {
    if (!selectedEntityId) return [];
    return holdings.filter((h) => h.entity_id === selectedEntityId);
  }, [selectedEntityId, holdings]);

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      holding_id: 0,
      date: new Date().toISOString().slice(0, 10),
      cash_flow_type: 'investment',
      amount_debit: 0,
      amount_credit: 0,
      currency: 'USD',
      category: 'actual',
      scenario: 'actual',
      include_in_irr: true,
      transaction_reference: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      const payload = {
        entity_id: value.entity_id,
        holding_id: value.holding_id,
        date: value.date,
        cash_flow_type: value.cash_flow_type,
        amount_debit: value.amount_debit,
        amount_credit: value.amount_credit,
        currency: value.currency,
        category: value.category,
        scenario: value.scenario,
        include_in_irr: value.include_in_irr,
        transaction_reference: value.transaction_reference || null,
        description: value.description || null,
      };

      const result = CreateHoldingCashFlowSchema.safeParse(payload);
      if (!result.success) return;
      const success = await createHoldingCashFlow(result.data as CreateHoldingCashFlow);
      if (success) router.push('/holding-cash-flows');
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
      {/* Header */}
      <div>
        <Link href="/holding-cash-flows">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Holding Cash Flows
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Holding Cash Flow</h1>
        <p className="text-muted-foreground">
          Add a new holding cash flow record
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
        {/* Entity & Holding Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Entity & Holding</CardTitle>
            <CardDescription>Select the entity and holding for this cash flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Entity Combobox */}
            <form.Field name="entity_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Entity</Label>
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
                            ? entities.find((e) => e.id === field.state.value)?.name || 'Select entity...'
                            : 'Select entity...'}
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
                                  setSelectedEntityId(entity.id);
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

            {/* Holding Combobox */}
            <form.Field name="holding_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Holding</Label>
                  <Popover open={holdingPopoverOpen} onOpenChange={setHoldingPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={holdingPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {field.state.value
                            ? availableHoldings.find((h) => h.id === field.state.value)?.investment_name || 'Select holding...'
                            : 'Select holding...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search holding..." />
                        <CommandList>
                          <CommandEmpty>No holdings found for this entity.</CommandEmpty>
                          <CommandGroup>
                            {availableHoldings.map((holding) => (
                              <CommandItem
                                key={holding.id}
                                value={holding.investment_name}
                                onSelect={() => {
                                  field.handleChange(holding.id);
                                  setHoldingPopoverOpen(false);
                                }}
                              >
                                {holding.investment_name}
                                {field.state.value === holding.id && (
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

        {/* Cash Flow Details */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Details</CardTitle>
            <CardDescription>Enter the cash flow information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Date *</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="currency">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Currency</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="USD"
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="cash_flow_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Cash Flow Type *</Label>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CASH_FLOW_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
              <form.Field name="category">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASH_FLOW_CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
              <form.Field name="scenario">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Scenario</Label>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASH_FLOW_SCENARIO_OPTIONS.map((opt) => (
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
              <form.Field name="amount_debit">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Amount Debit</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="amount_credit">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Amount Credit</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <form.Field name="include_in_irr">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={field.name}>Include in IRR Calculation</Label>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
            <CardDescription>Optional reference and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="transaction_reference">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Transaction Reference</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional reference number..."
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional description..."
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-2">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Cash Flow'
            )}
          </Button>
          <Link href="/holding-cash-flows">
            <Button type="button" variant="outline" disabled={form.state.isSubmitting}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
