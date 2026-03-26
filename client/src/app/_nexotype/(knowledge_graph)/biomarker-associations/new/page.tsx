'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useBiomarkerAssociations } from '@/modules/nexotype/hooks/knowledge_graph/use-biomarker-associations';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { CreateBiomarkerAssociationSchema, CORRELATION_OPTIONS } from '@/modules/nexotype/schemas/knowledge_graph/biomarker-association.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateBiomarkerAssociationPage() {
  const router = useRouter();
  const { createBiomarkerAssociation, error: storeError } = useBiomarkerAssociations();
  const { biomarkers } = useBiomarkers();
  const { indications } = useIndications();
  const { phenotypes } = usePhenotypes();
  const [biomarkerPopoverOpen, setBiomarkerPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      biomarker_id: '',
      indication_id: '',
      phenotype_id: '',
      correlation: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to null
        const payload = {
          biomarker_id: parseInt(value.biomarker_id, 10),
          indication_id: value.indication_id ? parseInt(value.indication_id, 10) : null,
          phenotype_id: value.phenotype_id ? parseInt(value.phenotype_id, 10) : null,
          correlation: value.correlation,
        };

        // Validate with Zod
        const validation = CreateBiomarkerAssociationSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createBiomarkerAssociation(validation.data);

        if (success) {
          router.push('/biomarker-associations');
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
        <Link href="/biomarker-associations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Biomarker Associations
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Biomarker Association</h1>
        <p className="text-muted-foreground mt-2">
          Add a new biomarker association
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Biomarker Association Details</CardTitle>
          <CardDescription>
            Enter the details for your new biomarker association
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
              {/* Biomarker — required FK searchable combobox */}
              <form.Field
                name="biomarker_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Biomarker is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Biomarker *</Label>
                    <Popover open={biomarkerPopoverOpen} onOpenChange={setBiomarkerPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={biomarkerPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? biomarkers.find(b => b.id.toString() === field.state.value)?.name || 'Select biomarker'
                              : 'Select biomarker'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search biomarker..." />
                          <CommandList>
                            <CommandEmpty>No biomarkers found.</CommandEmpty>
                            <CommandGroup>
                              {biomarkers.map((b) => (
                                <CommandItem
                                  key={b.id}
                                  value={b.name}
                                  onSelect={() => {
                                    field.handleChange(b.id.toString());
                                    setBiomarkerPopoverOpen(false);
                                  }}
                                >
                                  {b.name}
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
                      The biomarker for this association
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Indication — optional FK searchable combobox */}
              <form.Field name="indication_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Indication</Label>
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
                              : '— None —'}
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
                              <CommandItem
                                value="__none__"
                                onSelect={() => {
                                  field.handleChange('');
                                  setIndicationPopoverOpen(false);
                                }}
                              >
                                — None —
                                {!field.state.value && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
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
                      The indication associated with this biomarker (optional)
                    </p>
                  </div>
                )}
              </form.Field>

              {/* Phenotype — optional FK searchable combobox */}
              <form.Field name="phenotype_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Phenotype</Label>
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
                              : '— None —'}
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
                              <CommandItem
                                value="__none__"
                                onSelect={() => {
                                  field.handleChange('');
                                  setPhenotypePopoverOpen(false);
                                }}
                              >
                                — None —
                                {!field.state.value && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
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
                      The phenotype associated with this biomarker (optional)
                    </p>
                  </div>
                )}
              </form.Field>

              {/* Correlation — required enum select */}
              <form.Field
                name="correlation"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Correlation is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Correlation *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select correlation" />
                      </SelectTrigger>
                      <SelectContent>
                        {CORRELATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The correlation type for this association
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
                    'Create Biomarker Association'
                  )}
                </Button>
                <Link href="/biomarker-associations" className="flex-1">
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
