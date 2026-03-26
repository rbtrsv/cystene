'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useVariantPhenotypes } from '@/modules/nexotype/hooks/knowledge_graph/use-variant-phenotypes';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { CreateVariantPhenotypeSchema } from '@/modules/nexotype/schemas/knowledge_graph/variant-phenotype.schemas';
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
export default function CreateVariantPhenotypePage() {
  const router = useRouter();
  const { createVariantPhenotype, error: storeError } = useVariantPhenotypes();
  const { variants } = useVariants();
  const { phenotypes } = usePhenotypes();
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      variant_id: '',
      phenotype_id: '',
      effect_size: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to null
        const payload = {
          variant_id: parseInt(value.variant_id, 10),
          phenotype_id: parseInt(value.phenotype_id, 10),
          effect_size: value.effect_size || null,
        };

        // Validate with Zod
        const validation = CreateVariantPhenotypeSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createVariantPhenotype(payload);

        if (success) {
          router.push('/variant-phenotypes');
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
        <Link href="/variant-phenotypes">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Variant Phenotypes
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Variant Phenotype</h1>
        <p className="text-muted-foreground mt-2">
          Add a new variant phenotype
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Variant Phenotype Details</CardTitle>
          <CardDescription>
            Enter the details for your new variant phenotype
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
                      The genetic variant for this phenotype association
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Phenotype — required FK searchable combobox */}
              <form.Field
                name="phenotype_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Phenotype is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Phenotype *</Label>
                    <Popover open={phenotypePopoverOpen} onOpenChange={setPhenotypePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={phenotypePopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? phenotypes.find(p => p.id.toString() === field.state.value)?.name || 'Select phenotype'
                              : 'Select phenotype'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search phenotype..." />
                          <CommandList>
                            <CommandEmpty>No phenotypes found.</CommandEmpty>
                            <CommandGroup>
                              {phenotypes.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => {
                                    field.handleChange(p.id.toString());
                                    setPhenotypePopoverOpen(false);
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
                      The phenotype associated with this variant
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Effect Size — optional */}
              <form.Field
                name="effect_size"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value.length > 50) {
                      return 'Effect size must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Effect Size</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., large"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The effect size of this variant-phenotype association (optional)
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
                    'Create Variant Phenotype'
                  )}
                </Button>
                <Link href="/variant-phenotypes" className="flex-1">
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
