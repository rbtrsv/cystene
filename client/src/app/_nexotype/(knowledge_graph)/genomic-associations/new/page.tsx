'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useGenomicAssociations } from '@/modules/nexotype/hooks/knowledge_graph/use-genomic-associations';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { CreateGenomicAssociationSchema } from '@/modules/nexotype/schemas/knowledge_graph/genomic-association.schemas';
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
export default function CreateGenomicAssociationPage() {
  const router = useRouter();
  const { createGenomicAssociation, error: storeError } = useGenomicAssociations();
  const { variants } = useVariants();
  const { indications } = useIndications();
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      variant_id: '',
      indication_id: '',
      odds_ratio: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to null
        const payload = {
          variant_id: parseInt(value.variant_id, 10),
          indication_id: parseInt(value.indication_id, 10),
          odds_ratio: value.odds_ratio ? parseFloat(value.odds_ratio) : null,
        };

        // Validate with Zod
        const validation = CreateGenomicAssociationSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createGenomicAssociation(payload);

        if (success) {
          router.push('/genomic-associations');
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
        <Link href="/genomic-associations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Genomic Associations
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Genomic Association</h1>
        <p className="text-muted-foreground mt-2">
          Add a new genomic association
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Genomic Association Details</CardTitle>
          <CardDescription>
            Enter the details for your new genomic association
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
              {/* Variant — required FK searchable combobox */}
              <form.Field
                name="variant_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Variant is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Variant *</Label>
                    <Popover open={variantPopoverOpen} onOpenChange={setVariantPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={variantPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? variants.find(v => v.id.toString() === field.state.value)?.db_snp_id || 'Select variant'
                              : 'Select variant'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search variant..." />
                          <CommandList>
                            <CommandEmpty>No variants found.</CommandEmpty>
                            <CommandGroup>
                              {variants.map((v) => (
                                <CommandItem
                                  key={v.id}
                                  value={v.db_snp_id}
                                  onSelect={() => {
                                    field.handleChange(v.id.toString());
                                    setVariantPopoverOpen(false);
                                  }}
                                >
                                  {v.db_snp_id}
                                  {field.state.value === v.id.toString() && (
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
                      The genetic variant for this association
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Indication — required FK searchable combobox */}
              <form.Field
                name="indication_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Indication is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Indication *</Label>
                    <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={indicationPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? indications.find(i => i.id.toString() === field.state.value)?.name || 'Select indication'
                              : 'Select indication'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search indication..." />
                          <CommandList>
                            <CommandEmpty>No indications found.</CommandEmpty>
                            <CommandGroup>
                              {indications.map((i) => (
                                <CommandItem
                                  key={i.id}
                                  value={i.name}
                                  onSelect={() => {
                                    field.handleChange(i.id.toString());
                                    setIndicationPopoverOpen(false);
                                  }}
                                >
                                  {i.name}
                                  {field.state.value === i.id.toString() && (
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
                      The indication associated with this genomic variant
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Odds Ratio — optional */}
              <form.Field
                name="odds_ratio"
                validators={{
                  onChange: ({ value }) => {
                    if (value && isNaN(Number(value))) {
                      return 'Odds ratio must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Odds Ratio</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="any"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 1.5"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The odds ratio for this association (optional)
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
                    'Create Genomic Association'
                  )}
                </Button>
                <Link href="/genomic-associations" className="flex-1">
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
