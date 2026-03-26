'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { CreateVariantSchema } from '@/modules/nexotype/schemas/omics/variant.schemas';
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
export default function CreateVariantPage() {
  const router = useRouter();
  const { createVariant, error: storeError } = useVariants();
  const { genes } = useGenes();
  const [genePopoverOpen, setGenePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      gene_id: '',
      db_snp_id: '',
      hgvs_c: '',
      hgvs_p: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert gene_id string to integer
        const payload = {
          gene_id: parseInt(value.gene_id, 10),
          db_snp_id: value.db_snp_id,
          hgvs_c: value.hgvs_c || undefined,
          hgvs_p: value.hgvs_p || undefined,
        };

        // Validate with Zod
        const validation = CreateVariantSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createVariant(payload);

        if (success) {
          router.push('/variants');
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
        <Link href="/variants">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Variants
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Variant</h1>
        <p className="text-muted-foreground mt-2">
          Add a new genetic variant to the omics registry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Variant Details</CardTitle>
          <CardDescription>
            Enter the details for your new variant
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
              {/* Gene — required FK selector */}
              <form.Field
                name="gene_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Gene is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Gene *</Label>
                    <Popover open={genePopoverOpen} onOpenChange={setGenePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={genePopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? genes.find(g => g.id.toString() === field.state.value)?.hgnc_symbol || 'Select gene'
                              : 'Select gene'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search gene..." />
                          <CommandList>
                            <CommandEmpty>No genes found.</CommandEmpty>
                            <CommandGroup>
                              {genes.map((gene) => (
                                <CommandItem
                                  key={gene.id}
                                  value={`${gene.hgnc_symbol} ${gene.ensembl_gene_id}`}
                                  onSelect={() => {
                                    field.handleChange(gene.id.toString());
                                    setGenePopoverOpen(false);
                                  }}
                                >
                                  {gene.hgnc_symbol} ({gene.ensembl_gene_id})
                                  {field.state.value === gene.id.toString() && (
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
                      The gene this variant belongs to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* dbSNP ID — required */}
              <form.Field
                name="db_snp_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'dbSNP ID is required';
                    }
                    if (value.length > 20) {
                      return 'dbSNP ID must be 20 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>dbSNP ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., rs429358"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Reference SNP cluster ID from dbSNP database
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* HGVS c. — optional */}
              <form.Field
                name="hgvs_c"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value.length > 50) {
                      return 'HGVS c. must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>HGVS c. (DNA Change)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., c.123A>G"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      HGVS coding DNA sequence notation
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* HGVS p. — optional */}
              <form.Field
                name="hgvs_p"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value.length > 50) {
                      return 'HGVS p. must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>HGVS p. (Protein Change)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., p.Arg123Cys"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      HGVS protein sequence notation
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
                    'Create Variant'
                  )}
                </Button>
                <Link href="/variants" className="flex-1">
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
