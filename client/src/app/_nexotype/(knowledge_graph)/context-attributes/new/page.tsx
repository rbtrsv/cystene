'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useContextAttributes } from '@/modules/nexotype/hooks/knowledge_graph/use-context-attributes';
import { useEvidenceAssertions } from '@/modules/nexotype/hooks/knowledge_graph/use-evidence-assertions';
import { CreateContextAttributeSchema } from '@/modules/nexotype/schemas/knowledge_graph/context-attribute.schemas';
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
export default function CreateContextAttributePage() {
  const router = useRouter();
  const { createContextAttribute, error: storeError } = useContextAttributes();
  const { evidenceAssertions } = useEvidenceAssertions();
  const [evidencePopoverOpen, setEvidencePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      evidence_id: '',
      key: '',
      value: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert evidence_id string to integer
        const payload = {
          evidence_id: parseInt(value.evidence_id, 10),
          key: value.key,
          value: value.value,
        };

        // Validate with Zod
        const validation = CreateContextAttributeSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createContextAttribute(payload);

        if (success) {
          router.push('/context-attributes');
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
        <Link href="/context-attributes">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Context Attributes
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Context Attribute</h1>
        <p className="text-muted-foreground mt-2">
          Add a new context attribute for an evidence assertion
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Context Attribute Details</CardTitle>
          <CardDescription>
            Enter the details for your new context attribute
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
              {/* Evidence Assertion — required FK searchable combobox */}
              <form.Field
                name="evidence_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Evidence assertion is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Evidence Assertion *</Label>
                    <Popover open={evidencePopoverOpen} onOpenChange={setEvidencePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={evidencePopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? `#${field.state.value} — ${evidenceAssertions.find(ea => ea.id.toString() === field.state.value)?.relationship_table || 'Unknown'}`
                              : 'Select evidence assertion'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search evidence assertion..." />
                          <CommandList>
                            <CommandEmpty>No evidence assertions found.</CommandEmpty>
                            <CommandGroup>
                              {evidenceAssertions.map((ea) => (
                                <CommandItem
                                  key={ea.id}
                                  value={`${ea.relationship_table} #${ea.id}`}
                                  onSelect={() => {
                                    field.handleChange(ea.id.toString());
                                    setEvidencePopoverOpen(false);
                                  }}
                                >
                                  #{ea.id} — {ea.relationship_table}
                                  {field.state.value === ea.id.toString() && (
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
                      The evidence assertion this context attribute belongs to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Key — required */}
              <form.Field
                name="key"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Key is required';
                    }
                    if (value.length > 50) {
                      return 'Key must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Key *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., tissue_type"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The attribute key name
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Value — required */}
              <form.Field
                name="value"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Value is required';
                    }
                    if (value.length > 255) {
                      return 'Value must be 255 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Value *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., liver"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The attribute value
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
                    'Create Context Attribute'
                  )}
                </Button>
                <Link href="/context-attributes" className="flex-1">
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
