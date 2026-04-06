'use client';

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useKPIValues } from '@/modules/assetmanager/hooks/financial/use-kpi-values';
import { useKPIs } from '@/modules/assetmanager/hooks/financial/use-kpis';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateKPIValueSchema } from '@/modules/assetmanager/schemas/financial/kpi-value.schemas';
import { SCENARIO_OPTIONS, QUARTER_OPTIONS, SEMESTER_OPTIONS, MONTH_OPTIONS } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

export default function CreateKPIValuePage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { kpis, fetchKPIs } = useKPIs();
  const { createKPIValue, error: storeError } = useKPIValues();

  // KPI selector popover state
  const [kpiPopoverOpen, setKpiPopoverOpen] = useState(false);

  // Fetch KPIs for the active entity
  useEffect(() => {
    if (activeEntity) fetchKPIs({ entity_id: activeEntity.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // KPIs belonging to the active entity
  const entityKpis = activeEntity ? kpis.filter((kpi) => kpi.entity_id === activeEntity.id) : [];

  const form = useForm({
    defaultValues: {
      kpi_id: 0,
      // Time Dimensions
      year: new Date().getFullYear(),
      quarter: null as string | null,
      semester: null as string | null,
      month: null as string | null,
      full_year: false,
      scenario: 'actual',
      date: null as string | null,
      // Value
      value: null as number | null,
      notes: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.kpi_id) return;

      // Validate with Zod
      const validation = CreateKPIValueSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createKPIValue(validation.data);
      if (success) router.push('/kpi-values');
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

  if (entityKpis.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No KPIs available for this entity. Create one in{' '}
          <Link href="/kpis/new" className="underline">
            KPIs
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/kpi-values">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to KPI Values
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create KPI Value</h1>
        <p className="text-muted-foreground mt-2">
          Add a new data point for a KPI
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
        {/* KPI Selection */}
        <Card>
          <CardHeader>
            <CardTitle>KPI</CardTitle>
            <CardDescription>
              Select which KPI this value belongs to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="kpi_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>KPI *</Label>
                  <Popover open={kpiPopoverOpen} onOpenChange={setKpiPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={kpiPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {field.state.value
                            ? entityKpis.find((kpi) => kpi.id === field.state.value)?.name || 'Select KPI'
                            : 'Select KPI'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search KPI..." />
                        <CommandList>
                          <CommandEmpty>No KPIs found.</CommandEmpty>
                          <CommandGroup>
                            {entityKpis.map((kpi) => (
                              <CommandItem
                                key={kpi.id}
                                value={kpi.name}
                                onSelect={() => {
                                  field.handleChange(kpi.id);
                                  setKpiPopoverOpen(false);
                                }}
                              >
                                {kpi.name}
                                {field.state.value === kpi.id && (
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
              Define the reporting period for this data point
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
                  <Label htmlFor={field.name}>Date</Label>
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

        {/* Value */}
        <Card>
          <CardHeader>
            <CardTitle>Value</CardTitle>
            <CardDescription>
              The KPI measurement and any notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="value">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Value</Label>
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

            <form.Field name="notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Notes</Label>
                  <Textarea
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
              'Create KPI Value'
            )}
          </Button>
          <Link href="/kpi-values" className="flex-1">
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
