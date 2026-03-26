'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useBiologicalRelationships } from '@/modules/nexotype/hooks/knowledge_graph/use-biological-relationships';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { CreateBiologicalRelationshipSchema } from '@/modules/nexotype/schemas/knowledge_graph/biological-relationship.schemas';
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
export default function CreateBiologicalRelationshipPage() {
  const router = useRouter();
  const { createBiologicalRelationship, error: storeError } = useBiologicalRelationships();
  const { proteins } = useProteins();
  const [proteinAPopoverOpen, setProteinAPopoverOpen] = useState(false);
  const [proteinBPopoverOpen, setProteinBPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      protein_a_id: '',
      protein_b_id: '',
      interaction_type: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers
        const payload = {
          protein_a_id: parseInt(value.protein_a_id, 10),
          protein_b_id: parseInt(value.protein_b_id, 10),
          interaction_type: value.interaction_type,
        };

        // Validate with Zod
        const validation = CreateBiologicalRelationshipSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createBiologicalRelationship(payload);

        if (success) {
          router.push('/biological-relationships');
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
        <Link href="/biological-relationships">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Biological Relationships
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Biological Relationship</h1>
        <p className="text-muted-foreground mt-2">
          Add a new protein-protein interaction
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Biological Relationship Details</CardTitle>
          <CardDescription>
            Enter the details for your new biological relationship
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
              {/* Protein A — required FK searchable combobox */}
              <form.Field
                name="protein_a_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Protein A is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Protein A *</Label>
                    <Popover open={proteinAPopoverOpen} onOpenChange={setProteinAPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={proteinAPopoverOpen}
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
                                    setProteinAPopoverOpen(false);
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
                      The first protein in the interaction
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Protein B — required FK searchable combobox */}
              <form.Field
                name="protein_b_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Protein B is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Protein B *</Label>
                    <Popover open={proteinBPopoverOpen} onOpenChange={setProteinBPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={proteinBPopoverOpen}
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
                                    setProteinBPopoverOpen(false);
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
                      The second protein in the interaction
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Interaction Type — required */}
              <form.Field
                name="interaction_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Interaction type is required';
                    }
                    if (value.length > 50) {
                      return 'Interaction type must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Interaction Type *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., phosphorylation"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The type of biological interaction between the two proteins
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
                    'Create Biological Relationship'
                  )}
                </Button>
                <Link href="/biological-relationships" className="flex-1">
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
