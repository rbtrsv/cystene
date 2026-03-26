'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useAssayRuns } from '@/modules/nexotype/hooks/lims/use-assay-runs';
import { useAssayProtocols } from '@/modules/nexotype/hooks/lims/use-assay-protocols';
import { CreateAssayRunSchema } from '@/modules/nexotype/schemas/lims/assay-run.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create form for AssayRun with numeric FK parsing and nullable operator handling. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateAssayRunPage() {
  const router = useRouter();
  const { createAssayRun, error: storeError } = useAssayRuns();
  const { assayProtocols } = useAssayProtocols();
  const [protocolPopoverOpen, setProtocolPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      protocol_id: '',
      run_date: '',
      operator_id: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          protocol_id: parseInt(value.protocol_id, 10),
          run_date: value.run_date.trim(),
          operator_id: value.operator_id.trim() ? parseInt(value.operator_id, 10) : null,
        };

        const parsed = CreateAssayRunSchema.safeParse(payload);
        if (!parsed.success) return;

        const success = await createAssayRun(payload);
        if (success) router.push('/assay-runs');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/assay-runs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assay Runs
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Assay Run</h1>
        <p className="text-muted-foreground mt-2">Add an execution record for an assay protocol</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assay Run Details</CardTitle>
          <CardDescription>Enter protocol, run date, and optional operator</CardDescription>
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
            {/* Protocol — required FK searchable combobox */}
            <form.Field
              name="protocol_id"
              validators={{
                onChange: ({ value }) => {
                  if (!value) {
                    return 'Protocol is required';
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label>Protocol *</Label>
                  <Popover open={protocolPopoverOpen} onOpenChange={setProtocolPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={protocolPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? assayProtocols.find(p => p.id.toString() === field.state.value)?.name || 'Select protocol'
                            : 'Select protocol'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search protocol..." />
                        <CommandList>
                          <CommandEmpty>No protocols found.</CommandEmpty>
                          <CommandGroup>
                            {assayProtocols.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  field.handleChange(p.id.toString());
                                  setProtocolPopoverOpen(false);
                                }}
                              >
                                {p.name}
                                {field.state.value === p.id.toString() && (
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
                    The assay protocol this run executes
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="run_date">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Run Date *</Label>
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

            <form.Field name="operator_id">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Operator ID</Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional"
                  />
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
                  'Create Assay Run'
                )}
              </Button>
              <Link href="/assay-runs" className="flex-1">
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
