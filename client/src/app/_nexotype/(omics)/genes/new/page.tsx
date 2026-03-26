'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
import { CreateGeneSchema } from '@/modules/nexotype/schemas/omics/gene.schemas';
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
export default function CreateGenePage() {
  const router = useRouter();
  const { createGene, error: storeError } = useGenes();
  const { organisms } = useOrganisms();
  const [organismPopoverOpen, setOrganismPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      organism_id: '',
      hgnc_symbol: '',
      ensembl_gene_id: '',
      chromosome: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert organism_id string to integer
        const payload = {
          organism_id: parseInt(value.organism_id, 10),
          hgnc_symbol: value.hgnc_symbol,
          ensembl_gene_id: value.ensembl_gene_id,
          chromosome: value.chromosome,
        };

        // Validate with Zod
        const validation = CreateGeneSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createGene(payload);

        if (success) {
          router.push('/genes');
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
        <Link href="/genes">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Genes
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-2xl sm:text-3xl font-bold tracking-tight">Create Gene</h1>
        <p className="text-muted-foreground mt-2">
          Add a new genomic locus to the omics registry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gene Details</CardTitle>
          <CardDescription>
            Enter the details for your new gene
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
              {/* Organism — required FK searchable combobox */}
              <form.Field
                name="organism_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Organism is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Organism *</Label>
                    <Popover open={organismPopoverOpen} onOpenChange={setOrganismPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={organismPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? organisms.find((o) => o.id.toString() === field.state.value)?.scientific_name || 'Select organism'
                              : 'Select organism'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search organism..." />
                          <CommandList>
                            <CommandEmpty>No organisms found.</CommandEmpty>
                            <CommandGroup>
                              {organisms.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={`${org.scientific_name} ${org.common_name}`}
                                  onSelect={() => {
                                    field.handleChange(org.id.toString());
                                    setOrganismPopoverOpen(false);
                                  }}
                                >
                                  {org.scientific_name} ({org.common_name})
                                  {field.state.value === org.id.toString() && (
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
                      The organism this gene belongs to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* HGNC Symbol — required */}
              <form.Field
                name="hgnc_symbol"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'HGNC Symbol is required';
                    }
                    if (value.length > 50) {
                      return 'HGNC Symbol must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>HGNC Symbol *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., TP53"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      HUGO Gene Nomenclature Committee approved symbol
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Ensembl Gene ID — required */}
              <form.Field
                name="ensembl_gene_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Ensembl Gene ID is required';
                    }
                    if (value.length > 50) {
                      return 'Ensembl Gene ID must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Ensembl Gene ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., ENSG00000141510"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ensembl stable identifier (unique)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Chromosome — required */}
              <form.Field
                name="chromosome"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Chromosome is required';
                    }
                    if (value.length > 10) {
                      return 'Chromosome must be 10 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Chromosome *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 17"
                      disabled={form.state.isSubmitting}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                <Link href="/genes" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={form.state.isSubmitting}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </Link>
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
                    'Create Gene'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
