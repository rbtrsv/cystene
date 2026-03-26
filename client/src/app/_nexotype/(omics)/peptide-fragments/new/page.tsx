'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { usePeptideFragments } from '@/modules/nexotype/hooks/omics/use-peptide-fragments';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { CreatePeptideFragmentSchema } from '@/modules/nexotype/schemas/omics/peptide-fragment.schemas';
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
export default function CreatePeptideFragmentPage() {
  const router = useRouter();
  const { createPeptideFragment, error: storeError } = usePeptideFragments();
  const { proteins } = useProteins();
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      protein_id: '',
      sequence: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert protein_id string to integer
        const payload = {
          protein_id: parseInt(value.protein_id, 10),
          sequence: value.sequence,
        };

        // Validate with Zod
        const validation = CreatePeptideFragmentSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createPeptideFragment(payload);

        if (success) {
          router.push('/peptide-fragments');
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
        <Link href="/peptide-fragments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Peptide Fragments
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Peptide Fragment</h1>
        <p className="text-muted-foreground mt-2">
          Add a new tryptic peptide fragment to the omics registry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Peptide Fragment Details</CardTitle>
          <CardDescription>
            Enter the details for your new peptide fragment
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
              {/* Protein — required FK selector */}
              <form.Field
                name="protein_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Protein is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Protein *</Label>
                    <Popover open={proteinPopoverOpen} onOpenChange={setProteinPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={proteinPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? proteins.find(p => p.id.toString() === field.state.value)?.uniprot_accession || 'Select protein'
                              : 'Select protein'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search protein..." />
                          <CommandList>
                            <CommandEmpty>No proteins found.</CommandEmpty>
                            <CommandGroup>
                              {proteins.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.uniprot_accession}
                                  onSelect={() => {
                                    field.handleChange(p.id.toString());
                                    setProteinPopoverOpen(false);
                                  }}
                                >
                                  {p.uniprot_accession}
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
                      The protein this peptide fragment belongs to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Sequence — required */}
              <form.Field
                name="sequence"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Sequence is required';
                    }
                    if (value.length > 255) {
                      return 'Sequence must be 255 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Sequence *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., LVVVLAGR"
                      className="font-mono"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amino acid sequence of the tryptic peptide fragment
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
                    'Create Peptide Fragment'
                  )}
                </Button>
                <Link href="/peptide-fragments" className="flex-1">
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
