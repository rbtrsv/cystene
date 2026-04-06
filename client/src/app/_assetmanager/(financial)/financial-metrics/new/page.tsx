'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useFinancialMetricsList } from '@/modules/assetmanager/hooks/financial/use-financial-metrics';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateFinancialMetricsSchema } from '@/modules/assetmanager/schemas/financial/financial-metrics.schemas';
import { SCENARIO_OPTIONS, QUARTER_OPTIONS, SEMESTER_OPTIONS, MONTH_OPTIONS } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

export default function CreateFinancialMetricsPage() {
  const router = useRouter();
  const { activeEntity, entities } = useEntities();
  const { createFinancialMetrics, error: storeError } = useFinancialMetricsList();

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
      period_end: null as string | null,
      // Ratios: Liquidity
      current_ratio: null as number | null,
      quick_ratio: null as number | null,
      cash_ratio: null as number | null,
      operating_cash_flow_ratio: null as number | null,
      // Ratios: Solvency
      debt_to_equity_ratio: null as number | null,
      debt_to_assets_ratio: null as number | null,
      interest_coverage_ratio: null as number | null,
      debt_service_coverage_ratio: null as number | null,
      // Ratios: Profitability
      gross_profit_margin: null as number | null,
      operating_profit_margin: null as number | null,
      net_profit_margin: null as number | null,
      ebitda_margin: null as number | null,
      return_on_assets: null as number | null,
      return_on_equity: null as number | null,
      return_on_invested_capital: null as number | null,
      // Ratios: Efficiency
      asset_turnover_ratio: null as number | null,
      inventory_turnover_ratio: null as number | null,
      receivables_turnover_ratio: null as number | null,
      days_sales_outstanding: null as number | null,
      days_inventory_outstanding: null as number | null,
      days_payables_outstanding: null as number | null,
      // Ratios: Investment
      earnings_per_share: null as number | null,
      price_earnings_ratio: null as number | null,
      dividend_yield: null as number | null,
      dividend_payout_ratio: null as number | null,
      book_value_per_share: null as number | null,
      // Revenue Metrics
      recurring_revenue: null as number | null,
      non_recurring_revenue: null as number | null,
      revenue_growth_rate: null as number | null,
      existing_customer_existing_seats_revenue: null as number | null,
      existing_customer_additional_seats_revenue: null as number | null,
      new_customer_new_seats_revenue: null as number | null,
      discounts_and_refunds: null as number | null,
      arr: null as number | null,
      mrr: null as number | null,
      average_revenue_per_customer: null as number | null,
      average_contract_value: null as number | null,
      revenue_churn_rate: null as number | null,
      net_revenue_retention: null as number | null,
      gross_revenue_retention: null as number | null,
      growth_rate_cohort_1: null as number | null,
      growth_rate_cohort_2: null as number | null,
      growth_rate_cohort_3: null as number | null,
      // Customer Metrics
      total_customers: null as number | null,
      new_customers: null as number | null,
      churned_customers: null as number | null,
      total_users: null as number | null,
      active_users: null as number | null,
      total_monthly_active_client_users: null as number | null,
      existing_customer_existing_seats_users: null as number | null,
      existing_customer_additional_seats_users: null as number | null,
      new_customer_new_seats_users: null as number | null,
      user_growth_rate: null as number | null,
      new_customer_total_addressable_seats: null as number | null,
      new_customer_new_seats_percent_signed: null as number | null,
      new_customer_total_addressable_seats_remaining: null as number | null,
      existing_customer_count: null as number | null,
      existing_customer_expansion_count: null as number | null,
      new_customer_count: null as number | null,
      customer_growth_rate: null as number | null,
      cac: null as number | null,
      ltv: null as number | null,
      ltv_cac_ratio: null as number | null,
      payback_period: null as number | null,
      customer_churn_rate: null as number | null,
      customer_acquisition_efficiency: null as number | null,
      sales_efficiency: null as number | null,
      // Operational Metrics
      burn_rate: null as number | null,
      runway_months: null as number | null,
      runway_gross: null as number | null,
      runway_net: null as number | null,
      burn_multiple: null as number | null,
      rule_of_40: null as number | null,
      gross_margin: null as number | null,
      contribution_margin: null as number | null,
      revenue_per_employee: null as number | null,
      profit_per_employee: null as number | null,
      capital_efficiency: null as number | null,
      cash_conversion_cycle: null as number | null,
      capex: null as number | null,
      ebitda: null as number | null,
      total_costs: null as number | null,
      // Team Metrics
      total_employees: null as number | null,
      full_time_employees: null as number | null,
      part_time_employees: null as number | null,
      contractors: null as number | null,
      number_of_management: null as number | null,
      number_of_sales_marketing_staff: null as number | null,
      number_of_research_development_staff: null as number | null,
      number_of_customer_service_support_staff: null as number | null,
      number_of_general_staff: null as number | null,
      employee_growth_rate: null as number | null,
      employee_turnover_rate: null as number | null,
      average_tenure_months: null as number | null,
      management_costs: null as number | null,
      sales_marketing_staff_costs: null as number | null,
      research_development_staff_costs: null as number | null,
      customer_service_support_staff_costs: null as number | null,
      general_staff_costs: null as number | null,
      staff_costs_total: null as number | null,
      // Notes
      notes: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      // Validate with Zod
      const validation = CreateFinancialMetricsSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createFinancialMetrics(validation.data);
      if (success) router.push('/financial-metrics');
    },
  });

  // Reusable number field renderer (name typed as any to work with react-form generics; Zod safeParse validates at submit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const NumberField = ({ name, label, step = '0.01' }: { name: any; label: string; step?: string }) => (
    <form.Field name={name}>
      {(field: { name: string; state: { value: unknown }; handleBlur: () => void; handleChange: (val: unknown) => void }) => (
        <div className="space-y-2">
          <Label htmlFor={field.name}>{label}</Label>
          <Input
            id={field.name}
            type="number"
            step={step}
            value={(field.state.value as number | null) ?? ''}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      )}
    </form.Field>
  );

  // Reusable integer field renderer (name typed as any to work with react-form generics; Zod safeParse validates at submit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IntField = ({ name, label }: { name: any; label: string }) => (
    <form.Field name={name}>
      {(field: { name: string; state: { value: unknown }; handleBlur: () => void; handleChange: (val: unknown) => void }) => (
        <div className="space-y-2">
          <Label htmlFor={field.name}>{label}</Label>
          <Input
            id={field.name}
            type="number"
            step="1"
            value={(field.state.value as number | null) ?? ''}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          />
        </div>
      )}
    </form.Field>
  );

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
        <Link href="/financial-metrics">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Financial Metrics
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Financial Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Add a new financial metrics snapshot
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
              Select which entity this financial metrics record belongs to
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
              Define the reporting period for this financial metrics snapshot
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
          </CardContent>
        </Card>

        {/* Data sections in tabs */}
        <Tabs defaultValue="ratios" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ratios">Ratios</TabsTrigger>
            <TabsTrigger value="revenue-customers">Revenue & Customers</TabsTrigger>
            <TabsTrigger value="operations-team">Operations & Team</TabsTrigger>
          </TabsList>

          {/* ========== RATIOS TAB ========== */}
          <TabsContent value="ratios" className="space-y-6">
            {/* Liquidity Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>Liquidity Ratios</CardTitle>
                <CardDescription>
                  Short-term solvency and ability to meet current obligations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <NumberField name="current_ratio" label="Current Ratio" />
                  <NumberField name="quick_ratio" label="Quick Ratio" />
                  <NumberField name="cash_ratio" label="Cash Ratio" />
                  <NumberField name="operating_cash_flow_ratio" label="Operating CF Ratio" />
                </div>
              </CardContent>
            </Card>

            {/* Solvency Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>Solvency Ratios</CardTitle>
                <CardDescription>
                  Long-term debt capacity and financial leverage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <NumberField name="debt_to_equity_ratio" label="Debt-to-Equity" />
                  <NumberField name="debt_to_assets_ratio" label="Debt-to-Assets" />
                  <NumberField name="interest_coverage_ratio" label="Interest Coverage" />
                  <NumberField name="debt_service_coverage_ratio" label="Debt Service Coverage" />
                </div>
              </CardContent>
            </Card>

            {/* Profitability Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>Profitability Ratios</CardTitle>
                <CardDescription>
                  Margins, returns, and earnings efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <NumberField name="gross_profit_margin" label="Gross Profit Margin" />
                  <NumberField name="operating_profit_margin" label="Operating Profit Margin" />
                  <NumberField name="net_profit_margin" label="Net Profit Margin" />
                  <NumberField name="ebitda_margin" label="EBITDA Margin" />
                  <NumberField name="return_on_assets" label="Return on Assets" />
                  <NumberField name="return_on_equity" label="Return on Equity" />
                  <NumberField name="return_on_invested_capital" label="ROIC" />
                </div>
              </CardContent>
            </Card>

            {/* Efficiency Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Ratios</CardTitle>
                <CardDescription>
                  Asset utilization and working capital management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <NumberField name="asset_turnover_ratio" label="Asset Turnover" />
                  <NumberField name="inventory_turnover_ratio" label="Inventory Turnover" />
                  <NumberField name="receivables_turnover_ratio" label="Receivables Turnover" />
                  <NumberField name="days_sales_outstanding" label="Days Sales Outstanding" />
                  <NumberField name="days_inventory_outstanding" label="Days Inventory Outstanding" />
                  <NumberField name="days_payables_outstanding" label="Days Payables Outstanding" />
                </div>
              </CardContent>
            </Card>

            {/* Investment Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Ratios</CardTitle>
                <CardDescription>
                  Per-share metrics and valuation indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <NumberField name="earnings_per_share" label="Earnings Per Share" />
                  <NumberField name="price_earnings_ratio" label="P/E Ratio" />
                  <NumberField name="dividend_yield" label="Dividend Yield" />
                  <NumberField name="dividend_payout_ratio" label="Dividend Payout Ratio" />
                  <NumberField name="book_value_per_share" label="Book Value Per Share" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== REVENUE & CUSTOMERS TAB ========== */}
          <TabsContent value="revenue-customers" className="space-y-6">
            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>
                  Revenue breakdown, recurring revenue, and growth rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <NumberField name="recurring_revenue" label="Recurring Revenue" />
                  <NumberField name="non_recurring_revenue" label="Non-Recurring Revenue" />
                  <NumberField name="revenue_growth_rate" label="Revenue Growth Rate" />
                  <NumberField name="arr" label="ARR" />
                  <NumberField name="mrr" label="MRR" />
                  <NumberField name="average_revenue_per_customer" label="Avg Revenue/Customer" />
                  <NumberField name="average_contract_value" label="Avg Contract Value" />
                  <NumberField name="revenue_churn_rate" label="Revenue Churn Rate" />
                  <NumberField name="net_revenue_retention" label="Net Revenue Retention" />
                  <NumberField name="gross_revenue_retention" label="Gross Revenue Retention" />
                  <NumberField name="discounts_and_refunds" label="Discounts & Refunds" />
                  <NumberField name="existing_customer_existing_seats_revenue" label="Existing Cust. Existing Seats Rev" />
                  <NumberField name="existing_customer_additional_seats_revenue" label="Existing Cust. Additional Seats Rev" />
                  <NumberField name="new_customer_new_seats_revenue" label="New Cust. New Seats Rev" />
                  <NumberField name="growth_rate_cohort_1" label="Growth Rate Cohort 1" />
                  <NumberField name="growth_rate_cohort_2" label="Growth Rate Cohort 2" />
                  <NumberField name="growth_rate_cohort_3" label="Growth Rate Cohort 3" />
                </div>
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>
                  Customer counts, acquisition, retention, and lifetime value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <IntField name="total_customers" label="Total Customers" />
                  <IntField name="new_customers" label="New Customers" />
                  <IntField name="churned_customers" label="Churned Customers" />
                  <IntField name="total_users" label="Total Users" />
                  <IntField name="active_users" label="Active Users" />
                  <IntField name="total_monthly_active_client_users" label="Monthly Active Users" />
                  <IntField name="existing_customer_existing_seats_users" label="Existing Cust. Existing Seats" />
                  <IntField name="existing_customer_additional_seats_users" label="Existing Cust. Additional Seats" />
                  <IntField name="new_customer_new_seats_users" label="New Cust. New Seats" />
                  <NumberField name="user_growth_rate" label="User Growth Rate" />
                  <IntField name="new_customer_total_addressable_seats" label="New Cust. Addressable Seats" />
                  <NumberField name="new_customer_new_seats_percent_signed" label="New Seats % Signed" />
                  <IntField name="new_customer_total_addressable_seats_remaining" label="Addressable Seats Remaining" />
                  <IntField name="existing_customer_count" label="Existing Customer Count" />
                  <IntField name="existing_customer_expansion_count" label="Existing Cust. Expansion Count" />
                  <IntField name="new_customer_count" label="New Customer Count" />
                  <NumberField name="customer_growth_rate" label="Customer Growth Rate" />
                  <NumberField name="cac" label="CAC" />
                  <NumberField name="ltv" label="LTV" />
                  <NumberField name="ltv_cac_ratio" label="LTV/CAC Ratio" />
                  <NumberField name="payback_period" label="Payback Period" />
                  <NumberField name="customer_churn_rate" label="Customer Churn Rate" />
                  <NumberField name="customer_acquisition_efficiency" label="Cust. Acquisition Efficiency" />
                  <NumberField name="sales_efficiency" label="Sales Efficiency" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========== OPERATIONS & TEAM TAB ========== */}
          <TabsContent value="operations-team" className="space-y-6">
            {/* Operational Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Operational Metrics</CardTitle>
                <CardDescription>
                  Burn rate, runway, margins, and capital efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <NumberField name="burn_rate" label="Burn Rate" />
                  <NumberField name="runway_months" label="Runway (Months)" />
                  <NumberField name="runway_gross" label="Runway Gross" />
                  <NumberField name="runway_net" label="Runway Net" />
                  <NumberField name="burn_multiple" label="Burn Multiple" />
                  <NumberField name="rule_of_40" label="Rule of 40" />
                  <NumberField name="gross_margin" label="Gross Margin" />
                  <NumberField name="contribution_margin" label="Contribution Margin" />
                  <NumberField name="revenue_per_employee" label="Revenue/Employee" />
                  <NumberField name="profit_per_employee" label="Profit/Employee" />
                  <NumberField name="capital_efficiency" label="Capital Efficiency" />
                  <NumberField name="cash_conversion_cycle" label="Cash Conversion Cycle" />
                  <NumberField name="capex" label="CapEx" />
                  <NumberField name="ebitda" label="EBITDA" />
                  <NumberField name="total_costs" label="Total Costs" />
                </div>
              </CardContent>
            </Card>

            {/* Team Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Team Metrics</CardTitle>
                <CardDescription>
                  Headcount, departmental breakdown, and staff costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <IntField name="total_employees" label="Total Employees" />
                  <IntField name="full_time_employees" label="Full-Time Employees" />
                  <IntField name="part_time_employees" label="Part-Time Employees" />
                  <IntField name="contractors" label="Contractors" />
                  <IntField name="number_of_management" label="Management" />
                  <IntField name="number_of_sales_marketing_staff" label="Sales & Marketing" />
                  <IntField name="number_of_research_development_staff" label="R&D" />
                  <IntField name="number_of_customer_service_support_staff" label="Customer Service" />
                  <IntField name="number_of_general_staff" label="General Staff" />
                  <NumberField name="employee_growth_rate" label="Employee Growth Rate" />
                  <NumberField name="employee_turnover_rate" label="Employee Turnover Rate" />
                  <NumberField name="average_tenure_months" label="Avg Tenure (Months)" />
                  <NumberField name="management_costs" label="Management Costs" />
                  <NumberField name="sales_marketing_staff_costs" label="Sales & Marketing Costs" />
                  <NumberField name="research_development_staff_costs" label="R&D Costs" />
                  <NumberField name="customer_service_support_staff_costs" label="Customer Service Costs" />
                  <NumberField name="general_staff_costs" label="General Staff Costs" />
                  <NumberField name="staff_costs_total" label="Staff Costs Total" />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>
                  Additional notes or context for this metrics snapshot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form.Field name="notes">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Notes</Label>
                      <Textarea
                        id={field.name}
                        value={(field.state.value as string | null) || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value || null)}
                      />
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
              'Create Financial Metrics'
            )}
          </Button>
          <Link href="/financial-metrics" className="flex-1">
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
