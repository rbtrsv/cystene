'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
import { CreateSubjectSchema, SEX_OPTIONS } from '@/modules/nexotype/schemas/lims/subject.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create form for Subject with local parsing/validation before submit. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateSubjectPage() {
  const router = useRouter();
  const { createSubject, error: storeError } = useSubjects();
  const { organisms } = useOrganisms();
  const [organismPopoverOpen, setOrganismPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      subject_identifier: '',
      organism_id: '',
      cohort_name: '',
      sex: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          subject_identifier: value.subject_identifier.trim(),
          organism_id: parseInt(value.organism_id, 10),
          cohort_name: value.cohort_name.trim() || undefined,
          sex: value.sex === '' || value.sex === '__none__' ? null : value.sex,
        };

        const parsed = CreateSubjectSchema.safeParse(payload);
        if (!parsed.success) return;

        const success = await createSubject(parsed.data);
        if (success) router.push('/subjects');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/subjects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Subject</h1>
        <p className="text-muted-foreground mt-2">Add a subject record for downstream biospecimen and assay data</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subject Details</CardTitle>
          <CardDescription>Enter the required subject metadata</CardDescription>
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
            <form.Field name="subject_identifier">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Subject Identifier *</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., SUBJ-001"
                  />
                </div>
              )}
            </form.Field>

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
                            ? organisms.find(o => o.id.toString() === field.state.value)?.scientific_name || 'Select organism'
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
                            {organisms.map((o) => (
                              <CommandItem
                                key={o.id}
                                value={o.scientific_name}
                                onSelect={() => {
                                  field.handleChange(o.id.toString());
                                  setOrganismPopoverOpen(false);
                                }}
                              >
                                {o.scientific_name}
                                {field.state.value === o.id.toString() && (
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
                    The organism this subject belongs to
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="cohort_name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Cohort Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., Phase 1 cohort A"
                  />
                </div>
              )}
            </form.Field>

            {/* Sex — optional nullable enum select */}
            <form.Field name="sex">
              {(field) => (
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={form.state.isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {SEX_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  'Create Subject'
                )}
              </Button>
              <Link href="/subjects" className="flex-1">
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
