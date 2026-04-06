'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useBalanceSheets } from '@/modules/assetmanager/hooks/financial/use-balance-sheets';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateBalanceSheetSchema } from '@/modules/assetmanager/schemas/financial/balance-sheet.schemas';
import { SCENARIO_OPTIONS, QUARTER_OPTIONS, SEMESTER_OPTIONS, MONTH_OPTIONS } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

export default function CreateBalanceSheetPage() {
  const router = useRouter();
  const { activeEntity, entities } = useEntities();
  const { createBalanceSheet, error: storeError } = useBalanceSheets();

  // Entity selector popover state
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      // Time Dimensions
      year: new Date().getFullYear(),
      quarter: null as string | null,
      semester: null as string | null,
      month: null as string | null,
      full_year: false,
      scenario: 'actual',
      date: null as string | null,
      // Current Assets
      cash: null as number | null,
      cash_equivalents: null as number | null,
      cash_and_cash_equivalents: null as number | null,
      other_short_term_investments: null as number | null,
      accounts_receivable: null as number | null,
      other_receivables: null as number | null,
      inventory: null as number | null,
      prepaid_assets: null as number | null,
      restricted_cash: null as number | null,
      assets_held_for_sale: null as number | null,
      hedging_assets: null as number | null,
      other_current_assets: null as number | null,
      total_current_assets: null as number | null,
      // Non-current Assets
      properties: null as number | null,
      land_and_improvements: null as number | null,
      machinery_furniture_equipment: null as number | null,
      construction_in_progress: null as number | null,
      leases: null as number | null,
      accumulated_depreciation: null as number | null,
      goodwill: null as number | null,
      investment_properties: null as number | null,
      financial_assets: null as number | null,
      intangible_assets: null as number | null,
      investments_and_advances: null as number | null,
      other_non_current_assets: null as number | null,
      total_non_current_assets: null as number | null,
      // Total Assets
      total_assets: null as number | null,
      // Current Liabilities
      accounts_payable: null as number | null,
      accrued_expenses: null as number | null,
      short_term_debt: null as number | null,
      deferred_revenue: null as number | null,
      tax_payable: null as number | null,
      pensions: null as number | null,
      other_current_liabilities: null as number | null,
      total_current_liabilities: null as number | null,
      // Non-current Liabilities
      long_term_provisions: null as number | null,
      long_term_debt: null as number | null,
      provision_for_risks_and_charges: null as number | null,
      deferred_liabilities: null as number | null,
      derivative_product_liabilities: null as number | null,
      other_non_current_liabilities: null as number | null,
      total_non_current_liabilities: null as number | null,
      // Total Liabilities
      total_liabilities: null as number | null,
      // Shareholders Equity
      common_stock: null as number | null,
      retained_earnings: null as number | null,
      other_shareholders_equity: null as number | null,
      total_shareholders_equity: null as number | null,
      additional_paid_in_capital: null as number | null,
      treasury_stock: null as number | null,
      minority_interest: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      // Validate with Zod
      const validation = CreateBalanceSheetSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createBalanceSheet(validation.data);
      if (success) router.push('/balance-sheets');
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
        <Link href="/balance-sheets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Balance Sheets
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Balance Sheet</h1>
        <p className="text-muted-foreground mt-2">
          Add a new balance sheet record
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
              Select which entity this balance sheet belongs to
            </CardDescription>
          </CardHeader>
          <CardContent>
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

        {/* Time Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle>Time Dimensions</CardTitle>
            <CardDescription>
              Define the reporting period for this balance sheet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="year">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Year *</Label>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="scenario">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Scenario</Label>
                    <Select
                      value={field.state.value as string}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCENARIO_OPTIONS.map((opt) => (
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="quarter">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Quarter</Label>
                    <Select
                      value={(field.state.value as string | null) || 'none'}
                      onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {QUARTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="semester">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Semester</Label>
                    <Select
                      value={(field.state.value as string | null) || 'none'}
                      onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {SEMESTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="month">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Month</Label>
                    <Select
                      value={(field.state.value as string | null) || 'none'}
                      onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {MONTH_OPTIONS.map((opt) => (
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

            <form.Field name="full_year">
              {(field) => (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={field.name}>Full Year</Label>
                </div>
              )}
            </form.Field>

            <form.Field name="date">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Reporting Date</Label>
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
          </CardContent>
        </Card>

        {/* Current Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Current Assets</CardTitle>
            <CardDescription>
              Short-term assets expected to be converted to cash within one year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="cash">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cash</Label>
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

              <form.Field name="cash_equivalents">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cash Equivalents</Label>
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

              <form.Field name="cash_and_cash_equivalents">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cash & Cash Equivalents</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="other_short_term_investments">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other ST Investments</Label>
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

              <form.Field name="accounts_receivable">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Accounts Receivable</Label>
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

              <form.Field name="other_receivables">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Receivables</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="inventory">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Inventory</Label>
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

              <form.Field name="prepaid_assets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Prepaid Assets</Label>
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

              <form.Field name="restricted_cash">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Restricted Cash</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="assets_held_for_sale">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Assets Held for Sale</Label>
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

              <form.Field name="hedging_assets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Hedging Assets</Label>
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

              <form.Field name="other_current_assets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Current Assets</Label>
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

            <form.Field name="total_current_assets">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total Current Assets</Label>
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
          </CardContent>
        </Card>

        {/* Non-current Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Non-current Assets</CardTitle>
            <CardDescription>
              Long-term assets not expected to be converted to cash within one year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="properties">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Properties</Label>
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

              <form.Field name="land_and_improvements">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Land & Improvements</Label>
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

              <form.Field name="machinery_furniture_equipment">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Machinery/Furniture/Equip.</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="construction_in_progress">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Construction in Progress</Label>
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

              <form.Field name="leases">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Leases</Label>
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

              <form.Field name="accumulated_depreciation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Accum. Depreciation</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="goodwill">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Goodwill</Label>
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

              <form.Field name="investment_properties">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investment Properties</Label>
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

              <form.Field name="financial_assets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Financial Assets</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="intangible_assets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Intangible Assets</Label>
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

              <form.Field name="investments_and_advances">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investments & Advances</Label>
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

              <form.Field name="other_non_current_assets">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Non-current Assets</Label>
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

            <form.Field name="total_non_current_assets">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total Non-current Assets</Label>
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
          </CardContent>
        </Card>

        {/* Total Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Total Assets</CardTitle>
            <CardDescription>
              Sum of current and non-current assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="total_assets">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total Assets</Label>
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
          </CardContent>
        </Card>

        {/* Current Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Current Liabilities</CardTitle>
            <CardDescription>
              Short-term obligations due within one year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="accounts_payable">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Accounts Payable</Label>
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

              <form.Field name="accrued_expenses">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Accrued Expenses</Label>
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

              <form.Field name="short_term_debt">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Short-term Debt</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="deferred_revenue">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Deferred Revenue</Label>
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

              <form.Field name="tax_payable">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Tax Payable</Label>
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

              <form.Field name="pensions">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Pensions</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="other_current_liabilities">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Current Liabilities</Label>
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

              <form.Field name="total_current_liabilities">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Total Current Liabilities</Label>
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

        {/* Non-current Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Non-current Liabilities</CardTitle>
            <CardDescription>
              Long-term obligations due beyond one year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="long_term_provisions">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Long-term Provisions</Label>
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

              <form.Field name="long_term_debt">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Long-term Debt</Label>
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

              <form.Field name="provision_for_risks_and_charges">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Provision for Risks</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="deferred_liabilities">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Deferred Liabilities</Label>
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

              <form.Field name="derivative_product_liabilities">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Derivative Liabilities</Label>
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

              <form.Field name="other_non_current_liabilities">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Non-current Liab.</Label>
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

            <form.Field name="total_non_current_liabilities">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total Non-current Liabilities</Label>
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
          </CardContent>
        </Card>

        {/* Total Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Total Liabilities</CardTitle>
            <CardDescription>
              Sum of current and non-current liabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="total_liabilities">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total Liabilities</Label>
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
          </CardContent>
        </Card>

        {/* Shareholders Equity */}
        <Card>
          <CardHeader>
            <CardTitle>Shareholders Equity</CardTitle>
            <CardDescription>
              Net worth of the entity — assets minus liabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="common_stock">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Common Stock</Label>
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

              <form.Field name="retained_earnings">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Retained Earnings</Label>
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

              <form.Field name="other_shareholders_equity">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Equity</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="additional_paid_in_capital">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Additional Paid-in Capital</Label>
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

              <form.Field name="treasury_stock">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Treasury Stock</Label>
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

              <form.Field name="minority_interest">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Minority Interest</Label>
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

            <form.Field name="total_shareholders_equity">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total Shareholders Equity</Label>
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
              'Create Balance Sheet'
            )}
          </Button>
          <Link href="/balance-sheets" className="flex-1">
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
