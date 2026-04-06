'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useIncomeStatements } from '@/modules/assetmanager/hooks/financial/use-income-statements';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateIncomeStatementSchema } from '@/modules/assetmanager/schemas/financial/income-statement.schemas';
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

export default function CreateIncomeStatementPage() {
  const router = useRouter();
  const { activeEntity, entities } = useEntities();
  const { createIncomeStatement, error: storeError } = useIncomeStatements();

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
      period_start: null as string | null,
      period_end: null as string | null,
      // Revenue
      revenue: null as number | null,
      cost_of_goods: null as number | null,
      gross_profit: null as number | null,
      // Operating Expenses
      research_and_development: null as number | null,
      selling_general_and_administrative: null as number | null,
      other_operating_expenses: null as number | null,
      // Results
      operating_income: null as number | null,
      non_operating_interest_income: null as number | null,
      non_operating_interest_expense: null as number | null,
      other_income_expense: null as number | null,
      pretax_income: null as number | null,
      income_tax: null as number | null,
      net_income: null as number | null,
      // Additional
      eps_basic: null as number | null,
      eps_diluted: null as number | null,
      basic_shares_outstanding: null as number | null,
      diluted_shares_outstanding: null as number | null,
      ebitda: null as number | null,
      net_income_continuous_operations: null as number | null,
      minority_interests: null as number | null,
      preferred_stock_dividends: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      // Validate with Zod
      const validation = CreateIncomeStatementSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createIncomeStatement(validation.data);
      if (success) router.push('/income-statements');
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
        <Link href="/income-statements">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Income Statements
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Income Statement</h1>
        <p className="text-muted-foreground mt-2">
          Add a new income statement record
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
              Select which entity this income statement belongs to
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
              Define the reporting period for this income statement
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

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="period_start">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Period Start</Label>
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

              <form.Field name="period_end">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Period End</Label>
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
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
              Top-line revenue and cost of goods sold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="revenue">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Revenue</Label>
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

              <form.Field name="cost_of_goods">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cost of Goods</Label>
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

              <form.Field name="gross_profit">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Gross Profit</Label>
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

        {/* Operating Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Expenses</CardTitle>
            <CardDescription>
              Research, selling, and other operating costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="research_and_development">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>R&D</Label>
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

              <form.Field name="selling_general_and_administrative">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>SG&A</Label>
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

              <form.Field name="other_operating_expenses">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other OpEx</Label>
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

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Operating income, taxes, and net income
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="operating_income">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Operating Income</Label>
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

              <form.Field name="non_operating_interest_income">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Non-Op Interest Income</Label>
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
              <form.Field name="non_operating_interest_expense">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Non-Op Interest Expense</Label>
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

              <form.Field name="other_income_expense">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Income/Expense</Label>
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
              <form.Field name="pretax_income">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Pretax Income</Label>
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

              <form.Field name="income_tax">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Income Tax</Label>
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

              <form.Field name="net_income">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Net Income</Label>
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

        {/* Additional */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Metrics</CardTitle>
            <CardDescription>
              EPS, shares outstanding, EBITDA, and other line items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="eps_basic">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>EPS Basic</Label>
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

              <form.Field name="eps_diluted">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>EPS Diluted</Label>
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
              <form.Field name="basic_shares_outstanding">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Basic Shares Outstanding</Label>
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

              <form.Field name="diluted_shares_outstanding">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Diluted Shares Outstanding</Label>
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

            <form.Field name="ebitda">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>EBITDA</Label>
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

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="net_income_continuous_operations">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Net Income (Cont. Ops)</Label>
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

              <form.Field name="minority_interests">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Minority Interests</Label>
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

              <form.Field name="preferred_stock_dividends">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Pref. Stock Dividends</Label>
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
              'Create Income Statement'
            )}
          </Button>
          <Link href="/income-statements" className="flex-1">
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
