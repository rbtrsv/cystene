'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useEvidenceAssertions } from '@/modules/nexotype/hooks/knowledge_graph/use-evidence-assertions';
import { useSources } from '@/modules/nexotype/hooks/knowledge_graph/use-sources';
import { CreateEvidenceAssertionSchema } from '@/modules/nexotype/schemas/knowledge_graph/evidence-assertion.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateEvidenceAssertionPage() {
  const router = useRouter();
  const { createEvidenceAssertion, error: storeError } = useEvidenceAssertions();
  const { sources } = useSources();
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      relationship_table: '',
      relationship_id: '',
      source_id: '',
      confidence_score: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, confidence_score to float
        const payload = {
          relationship_table: value.relationship_table,
          relationship_id: parseInt(value.relationship_id, 10),
          source_id: parseInt(value.source_id, 10),
          confidence_score: parseFloat(value.confidence_score),
        };

        // Validate with Zod
        const validation = CreateEvidenceAssertionSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createEvidenceAssertion(payload);

        if (success) {
          router.push('/evidence-assertions');
        }
        // Error is handled by store and displayed via storeError
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/evidence-assertions">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evidence Assertions
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Evidence Assertion</h1>
        <p className="text-muted-foreground mt-2">
          Add a new evidence assertion
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Evidence Assertion Details</CardTitle>
          <CardDescription>
            Enter the details for your new evidence assertion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4">
              {/* Relationship Table — required */}
              <form.Field
                name="relationship_table"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Relationship table is required';
                    }
                    if (value.length > 50) {
                      return 'Relationship table must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Relationship Table *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., biological_relationships"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The name of the relationship table this evidence refers to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Relationship ID — required FK */}
              <form.Field
                name="relationship_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Relationship ID is required';
                    }
                    if (isNaN(Number(value))) {
                      return 'Relationship ID must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Relationship ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 1"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The ID of the relationship this evidence supports
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Source — required FK searchable combobox */}
              <form.Field
                name="source_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Source is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Source *</Label>
                    <Popover open={sourcePopoverOpen} onOpenChange={setSourcePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={sourcePopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? sources.find(s => s.id.toString() === field.state.value)?.external_id || 'Select source'
                              : 'Select source'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search source..." />
                          <CommandList>
                            <CommandEmpty>No sources found.</CommandEmpty>
                            <CommandGroup>
                              {sources.map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={s.external_id}
                                  onSelect={() => {
                                    field.handleChange(s.id.toString());
                                    setSourcePopoverOpen(false);
                                  }}
                                >
                                  {s.external_id}
                                  {field.state.value === s.id.toString() && (
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
                      The source providing this evidence
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Confidence Score — required */}
              <form.Field
                name="confidence_score"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Confidence score is required';
                    }
                    if (isNaN(Number(value))) {
                      return 'Confidence score must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Confidence Score *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 0.95"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The confidence score for this evidence assertion
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
                    'Create Evidence Assertion'
                  )}
                </Button>
                <Link href="/evidence-assertions" className="flex-1">
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
