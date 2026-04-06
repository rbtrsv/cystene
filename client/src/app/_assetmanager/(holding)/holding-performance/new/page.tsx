'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useHoldingPerformances } from '@/modules/assetmanager/hooks/holding/use-holding-performances';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { CreateHoldingPerformanceSchema } from '@/modules/assetmanager/schemas/holding/holding-performance.schemas';
import type { CreateHoldingPerformance } from '@/modules/assetmanager/schemas/holding/holding-performance.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

export default function CreateHoldingPerformancePage() {
  const router = useRouter();
  const { entities, activeEntity } = useEntities();
  const { createHoldingPerformance, error: storeError } = useHoldingPerformances();
  const { fundingRounds, fetchFundingRounds, getFundingRoundsByEntity } = useFundingRounds();

  // Entity combobox state
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(activeEntity?.id || null);

  // Funding round combobox state
  const [fundingRoundPopoverOpen, setFundingRoundPopoverOpen] = useState(false);

  // Fetch funding rounds on mount
  useEffect(() => {
    fetchFundingRounds({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Available funding rounds for the selected entity
  const availableFundingRounds = useMemo(() => {
    if (!selectedEntityId) return [];
    return getFundingRoundsByEntity(selectedEntityId);
  }, [selectedEntityId, getFundingRoundsByEntity, fundingRounds]);

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      funding_round_id: null as number | null,
      report_date: new Date().toISOString().slice(0, 10),
      total_invested_amount: '',
      fair_value: '',
      cash_realized: '',
      tvpi: '',
      dpi: '',
      rvpi: '',
      irr: '',
      multiple_to_cost: '',
    },
    onSubmit: async ({ value }) => {
      const optNum = (val: string): number | null => {
        if (!val || val.trim() === '') return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
      };

      const payload = {
        entity_id: value.entity_id,
        funding_round_id: value.funding_round_id || null,
        report_date: value.report_date || null,
        total_invested_amount: optNum(value.total_invested_amount),
        fair_value: optNum(value.fair_value),
        cash_realized: optNum(value.cash_realized),
        tvpi: optNum(value.tvpi),
        dpi: optNum(value.dpi),
        rvpi: optNum(value.rvpi),
        irr: optNum(value.irr),
        multiple_to_cost: optNum(value.multiple_to_cost),
      };

      const result = CreateHoldingPerformanceSchema.safeParse(payload);
      if (!result.success) return;
      const success = await createHoldingPerformance(result.data as CreateHoldingPerformance);
      if (success) router.push('/holding-performance');
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
        <Link href="/holding-performance">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Holding Performance
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Holding Performance</h1>
        <p className="text-muted-foreground">
          Add a new performance record
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
            <CardDescription>Select the entity for this performance record</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* Funding Round (optional) */}
            <form.Field name="funding_round_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Funding Round</Label>
                  <Popover open={fundingRoundPopoverOpen} onOpenChange={setFundingRoundPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={fundingRoundPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {field.state.value
                            ? availableFundingRounds.find((r) => r.id === field.state.value)?.name || 'None'
                            : 'None'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search funding round..." />
                        <CommandList>
                          <CommandEmpty>No funding rounds found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="None"
                              onSelect={() => {
                                field.handleChange(null);
                                setFundingRoundPopoverOpen(false);
                              }}
                            >
                              None
                              {field.state.value === null && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                            {availableFundingRounds.map((round) => (
                              <CommandItem
                                key={round.id}
                                value={round.name}
                                onSelect={() => {
                                  field.handleChange(round.id);
                                  setFundingRoundPopoverOpen(false);
                                }}
                              >
                                {round.name}
                                {field.state.value === round.id && (
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

            {/* Report Date */}
            <form.Field name="report_date">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Report Date</Label>
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
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Enter investment performance data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="total_invested_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Total Invested Amount</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="fair_value">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Fair Value</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="cash_realized">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cash Realized</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="multiple_to_cost">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Multiple to Cost</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="tvpi">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>TVPI</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="dpi">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>DPI</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="rvpi">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>RVPI</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="irr">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>IRR (%)</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
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
              'Create Performance'
            )}
          </Button>
          <Link href="/holding-performance">
            <Button type="button" variant="outline" disabled={form.state.isSubmitting}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
