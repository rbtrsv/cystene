'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserVariants } from '@/modules/nexotype/hooks/user/use-user-variants';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { CreateUserVariantSchema, ZYGOSITY_OPTIONS } from '@/modules/nexotype/schemas/user/user-variant.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for user variant records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateUserVariantPage() {
  const router = useRouter();
  const { createUserVariant, error } = useUserVariants();
  const { subjects } = useSubjects();
  const { variants } = useVariants();
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { subject_id: '', variant_id: '', zygosity: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { subject_id: parseInt(value.subject_id, 10), variant_id: parseInt(value.variant_id, 10), zygosity: value.zygosity.trim() };
        const parsed = CreateUserVariantSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createUserVariant(parsed.data);
        if (ok) router.push('/user-variants');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-variants">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to User Variants</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create User Variant</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>User Variant Details</CardTitle>
<CardDescription>Enter subject-variant linkage metadata</CardDescription>
</CardHeader>
<CardContent>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          {/* Subject — required FK searchable combobox */}
          <form.Field
            name="subject_id"
            validators={{ onChange: ({ value }) => !value ? 'Subject is required' : undefined }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={subjectPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">
                        {field.state.value
                          ? subjects.find(s => s.id.toString() === field.state.value)?.subject_identifier || 'Select subject'
                          : 'Select subject'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search subject..." />
                      <CommandList>
                        <CommandEmpty>No subjects found.</CommandEmpty>
                        <CommandGroup>
                          {subjects.map((s) => (
                            <CommandItem key={s.id} value={s.subject_identifier} onSelect={() => { field.handleChange(s.id.toString()); setSubjectPopoverOpen(false); }}>
                              {s.subject_identifier}
                              {field.state.value === s.id.toString() && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          {/* Variant — required FK searchable combobox */}
          <form.Field
            name="variant_id"
            validators={{ onChange: ({ value }) => !value ? 'Variant is required' : undefined }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label>Variant *</Label>
                <Popover open={variantPopoverOpen} onOpenChange={setVariantPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={variantPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
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
                            <CommandItem key={v.id} value={v.db_snp_id} onSelect={() => { field.handleChange(v.id.toString()); setVariantPopoverOpen(false); }}>
                              {v.db_snp_id}
                              {field.state.value === v.id.toString() && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="zygosity">{(field) => <div className="space-y-2">
<Label>Zygosity *</Label>
<Select value={field.state.value} onValueChange={field.handleChange} disabled={form.state.isSubmitting}>
<SelectTrigger className="w-full"><SelectValue placeholder="Select zygosity" /></SelectTrigger>
<SelectContent>{ZYGOSITY_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
</Select>
</div>}</form.Field>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create User Variant'}</Button>
<Link href="/user-variants" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
