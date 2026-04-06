'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useCashFlowStatements } from '@/modules/assetmanager/hooks/financial/use-cash-flow-statements';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateCashFlowStatementSchema } from '@/modules/assetmanager/schemas/financial/cash-flow-statement.schemas';
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

export default function CreateCashFlowStatementPage() {
  const router = useRouter();
  const { activeEntity, entities } = useEntities();
  const { createCashFlowStatement, error: storeError } = useCashFlowStatements();

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
      // Operating Activities
      net_income: null as number | null,
      depreciation: null as number | null,
      deferred_taxes: null as number | null,
      stock_based_compensation: null as number | null,
      other_non_cash_items: null as number | null,
      accounts_receivable: null as number | null,
      accounts_payable: null as number | null,
      other_assets_liabilities: null as number | null,
      operating_cash_flow: null as number | null,
      // Investing Activities
      capital_expenditures: null as number | null,
      net_intangibles: null as number | null,
      net_acquisitions: null as number | null,
      purchase_of_investments: null as number | null,
      sale_of_investments: null as number | null,
      other_investing_activity: null as number | null,
      investing_cash_flow: null as number | null,
      // Financing Activities
      long_term_debt_issuance: null as number | null,
      long_term_debt_payments: null as number | null,
      short_term_debt_issuance: null as number | null,
      common_stock_issuance: null as number | null,
      common_stock_repurchase: null as number | null,
      common_dividends: null as number | null,
      other_financing_charges: null as number | null,
      financing_cash_flow: null as number | null,
      // Summary
      end_cash_position: null as number | null,
      income_tax_paid: null as number | null,
      interest_paid: null as number | null,
      free_cash_flow: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      // Validate with Zod
      const validation = CreateCashFlowStatementSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createCashFlowStatement(validation.data);
      if (success) router.push('/cash-flow-statements');
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
        <Link href="/cash-flow-statements">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cash Flow Statements
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Cash Flow Statement</h1>
        <p className="text-muted-foreground mt-2">
          Add a new cash flow statement record
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
              Select which entity this cash flow statement belongs to
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
              Define the reporting period for this cash flow statement
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

        {/* Operating Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Activities</CardTitle>
            <CardDescription>
              Cash generated from core business operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="net_income">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Net Income</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="depreciation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Depreciation</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="deferred_taxes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Deferred Taxes</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="stock_based_compensation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Stock-based Comp.</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="other_non_cash_items">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Non-cash Items</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="accounts_receivable">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Accounts Receivable</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="accounts_payable">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Accounts Payable</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="other_assets_liabilities">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Assets/Liabilities</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="operating_cash_flow">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Operating Cash Flow</Label>
                  <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Investing Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Investing Activities</CardTitle>
            <CardDescription>
              Cash used for investments in long-term assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="capital_expenditures">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Capital Expenditures</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="net_intangibles">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Net Intangibles</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="net_acquisitions">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Net Acquisitions</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="purchase_of_investments">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Purchase of Investments</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="sale_of_investments">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Sale of Investments</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="other_investing_activity">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Investing Activity</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="investing_cash_flow">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Investing Cash Flow</Label>
                  <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Financing Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Financing Activities</CardTitle>
            <CardDescription>
              Cash from debt, equity, and dividend transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="long_term_debt_issuance">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>LT Debt Issuance</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="long_term_debt_payments">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>LT Debt Payments</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="short_term_debt_issuance">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>ST Debt Issuance</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <form.Field name="common_stock_issuance">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Stock Issuance</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="common_stock_repurchase">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Stock Repurchase</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="common_dividends">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Common Dividends</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="other_financing_charges">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Other Financing Charges</Label>
                  <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                </div>
              )}
            </form.Field>

            <form.Field name="financing_cash_flow">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Financing Cash Flow</Label>
                  <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              End cash position and free cash flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="end_cash_position">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>End Cash Position</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="free_cash_flow">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Free Cash Flow</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="income_tax_paid">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Income Tax Paid</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                )}
              </form.Field>

              <form.Field name="interest_paid">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Interest Paid</Label>
                    <Input id={field.name} type="number" step="0.01" value={field.state.value ?? ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} />
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
              'Create Cash Flow Statement'
            )}
          </Button>
          <Link href="/cash-flow-statements" className="flex-1">
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
