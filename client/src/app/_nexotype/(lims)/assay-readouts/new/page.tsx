'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useAssayReadouts } from '@/modules/nexotype/hooks/lims/use-assay-readouts';
import { useAssayRuns } from '@/modules/nexotype/hooks/lims/use-assay-runs';
import { useBiospecimens } from '@/modules/nexotype/hooks/lims/use-biospecimens';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useUnitsOfMeasure } from '@/modules/nexotype/hooks/standardization/use-units-of-measure';
import { CreateAssayReadoutSchema } from '@/modules/nexotype/schemas/lims/assay-readout.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create form for AssayReadout with optional nullable FK parsing. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateAssayReadoutPage() {
  const router = useRouter();
  const { createAssayReadout, error: storeError } = useAssayReadouts();
  const { assayRuns } = useAssayRuns();
  const { biospecimens } = useBiospecimens();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { unitsOfMeasure } = useUnitsOfMeasure();
  const [runPopoverOpen, setRunPopoverOpen] = useState(false);
  const [biospecimenPopoverOpen, setBiospecimenPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      run_id: '',
      biospecimen_id: '',
      asset_id: '',
      raw_value: '',
      unit_id: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          run_id: parseInt(value.run_id, 10),
          biospecimen_id: value.biospecimen_id.trim() ? parseInt(value.biospecimen_id, 10) : null,
          asset_id: value.asset_id.trim() ? parseInt(value.asset_id, 10) : null,
          raw_value: parseFloat(value.raw_value),
          unit_id: parseInt(value.unit_id, 10),
        };

        const parsed = CreateAssayReadoutSchema.safeParse(payload);
        if (!parsed.success) return;

        const success = await createAssayReadout(payload);
        if (success) router.push('/assay-readouts');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/assay-readouts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assay Readouts
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Assay Readout</h1>
        <p className="text-muted-foreground mt-2">Add a measured value linked to an assay run</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assay Readout Details</CardTitle>
          <CardDescription>Enter run linkages and measurement metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Assay Run — required FK searchable combobox */}
            <form.Field
              name="run_id"
              validators={{
                onChange: ({ value }) => {
                  if (!value) {
                    return 'Assay run is required';
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label>Assay Run *</Label>
                  <Popover open={runPopoverOpen} onOpenChange={setRunPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={runPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? `Run #${field.state.value}`
                            : 'Select assay run'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search assay run..." />
                        <CommandList>
                          <CommandEmpty>No assay runs found.</CommandEmpty>
                          <CommandGroup>
                            {assayRuns.map((r) => (
                              <CommandItem
                                key={r.id}
                                value={`Run #${r.id}`}
                                onSelect={() => {
                                  field.handleChange(r.id.toString());
                                  setRunPopoverOpen(false);
                                }}
                              >
                                Run #{r.id}
                                {field.state.value === r.id.toString() && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    The assay run this readout belongs to
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Biospecimen — optional FK searchable combobox */}
            <form.Field name="biospecimen_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Biospecimen</Label>
                  <Popover open={biospecimenPopoverOpen} onOpenChange={setBiospecimenPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={biospecimenPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? biospecimens.find(b => b.id.toString() === field.state.value)?.barcode || 'Select biospecimen'
                            : 'Select biospecimen'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search biospecimen..." />
                        <CommandList>
                          <CommandEmpty>No biospecimens found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                field.handleChange('');
                                setBiospecimenPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!field.state.value && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {biospecimens.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.barcode}
                                onSelect={() => {
                                  field.handleChange(b.id.toString());
                                  setBiospecimenPopoverOpen(false);
                                }}
                              >
                                {b.barcode}
                                {field.state.value === b.id.toString() && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Optional biospecimen linked to this readout
                  </p>
                </div>
              )}
            </form.Field>

            {/* Therapeutic Asset — optional FK searchable combobox */}
            <form.Field name="asset_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Therapeutic Asset</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assetPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset'
                            : 'Select asset'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search asset..." />
                        <CommandList>
                          <CommandEmpty>No assets found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                field.handleChange('');
                                setAssetPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!field.state.value && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {therapeuticAssets.map((a) => (
                              <CommandItem
                                key={a.id}
                                value={a.name}
                                onSelect={() => {
                                  field.handleChange(a.id.toString());
                                  setAssetPopoverOpen(false);
                                }}
                              >
                                {a.name}
                                {field.state.value === a.id.toString() && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Optional therapeutic asset linked to this readout
                  </p>
                </div>
              )}
            </form.Field>

            <form.Field name="raw_value">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Raw Value *</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="any"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            {/* Unit of Measure — required FK searchable combobox */}
            <form.Field
              name="unit_id"
              validators={{
                onChange: ({ value }) => {
                  if (!value) {
                    return 'Unit is required';
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label>Unit of Measure *</Label>
                  <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={unitPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? unitsOfMeasure.find(u => u.id.toString() === field.state.value)?.symbol || 'Select unit'
                            : 'Select unit'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search unit..." />
                        <CommandList>
                          <CommandEmpty>No units found.</CommandEmpty>
                          <CommandGroup>
                            {unitsOfMeasure.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={u.symbol}
                                onSelect={() => {
                                  field.handleChange(u.id.toString());
                                  setUnitPopoverOpen(false);
                                }}
                              >
                                {u.symbol}
                                {field.state.value === u.id.toString() && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    The unit of measure for the raw value
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Assay Readout'
                )}
              </Button>
              <Link href="/assay-readouts" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
