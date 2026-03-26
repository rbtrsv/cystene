'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserBiomarkerReadings } from '@/modules/nexotype/hooks/user/use-user-biomarker-readings';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { useDataSources } from '@/modules/nexotype/hooks/user/use-data-sources';
import { useUnitsOfMeasure } from '@/modules/nexotype/hooks/standardization/use-units-of-measure';
import { CreateUserBiomarkerReadingSchema } from '@/modules/nexotype/schemas/user/user-biomarker-reading.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for user biomarker reading records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateUserBiomarkerReadingPage() {
  const router = useRouter();
  const { createUserBiomarkerReading, error } = useUserBiomarkerReadings();
  const { subjects } = useSubjects();
  const { biomarkers } = useBiomarkers();
  const { dataSources } = useDataSources();
  const { unitsOfMeasure } = useUnitsOfMeasure();
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [biomarkerPopoverOpen, setBiomarkerPopoverOpen] = useState(false);
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { subject_id: '', biomarker_id: '', source_id: '', value: '', unit_id: '', measured_at: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { subject_id: parseInt(value.subject_id, 10), biomarker_id: parseInt(value.biomarker_id, 10), source_id: parseInt(value.source_id, 10), value: parseFloat(value.value), unit_id: parseInt(value.unit_id, 10), measured_at: value.measured_at };
        const parsed = CreateUserBiomarkerReadingSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createUserBiomarkerReading(payload);
        if (ok) router.push('/user-biomarker-readings');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-biomarker-readings">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to Readings</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create User Biomarker Reading</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>Reading Details</CardTitle>
<CardDescription>Enter biomarker measurement metadata</CardDescription>
</CardHeader>
<CardContent>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          {/* Subject — required FK searchable combobox */}
          <form.Field name="subject_id" validators={{ onChange: ({ value }) => !value ? 'Subject is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={subjectPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? subjects.find(s => s.id.toString() === field.state.value)?.subject_identifier || 'Select subject' : 'Select subject'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search subject..." /><CommandList><CommandEmpty>No subjects found.</CommandEmpty><CommandGroup>
                      {subjects.map((s) => (<CommandItem key={s.id} value={s.subject_identifier} onSelect={() => { field.handleChange(s.id.toString()); setSubjectPopoverOpen(false); }}>{s.subject_identifier}{field.state.value === s.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          {/* Biomarker — required FK searchable combobox */}
          <form.Field name="biomarker_id" validators={{ onChange: ({ value }) => !value ? 'Biomarker is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Biomarker *</Label>
                <Popover open={biomarkerPopoverOpen} onOpenChange={setBiomarkerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={biomarkerPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? biomarkers.find(b => b.id.toString() === field.state.value)?.name || 'Select biomarker' : 'Select biomarker'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search biomarker..." /><CommandList><CommandEmpty>No biomarkers found.</CommandEmpty><CommandGroup>
                      {biomarkers.map((b) => (<CommandItem key={b.id} value={b.name} onSelect={() => { field.handleChange(b.id.toString()); setBiomarkerPopoverOpen(false); }}>{b.name}{field.state.value === b.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          {/* Data Source — required FK searchable combobox */}
          <form.Field name="source_id" validators={{ onChange: ({ value }) => !value ? 'Data source is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Data Source *</Label>
                <Popover open={sourcePopoverOpen} onOpenChange={setSourcePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={sourcePopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? dataSources.find(ds => ds.id.toString() === field.state.value)?.name || 'Select data source' : 'Select data source'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search data source..." /><CommandList><CommandEmpty>No data sources found.</CommandEmpty><CommandGroup>
                      {dataSources.map((ds) => (<CommandItem key={ds.id} value={ds.name} onSelect={() => { field.handleChange(ds.id.toString()); setSourcePopoverOpen(false); }}>{ds.name}{field.state.value === ds.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="value">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Value *</Label>
<Input id={field.name} type="number" step="any" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          {/* Unit of Measure — required FK searchable combobox */}
          <form.Field name="unit_id" validators={{ onChange: ({ value }) => !value ? 'Unit is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Unit of Measure *</Label>
                <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? unitsOfMeasure.find(u => u.id.toString() === field.state.value)?.symbol || 'Select unit' : 'Select unit'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search unit..." /><CommandList><CommandEmpty>No units found.</CommandEmpty><CommandGroup>
                      {unitsOfMeasure.map((u) => (<CommandItem key={u.id} value={u.symbol} onSelect={() => { field.handleChange(u.id.toString()); setUnitPopoverOpen(false); }}>{u.symbol}{field.state.value === u.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="measured_at">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Measured At *</Label>
<Input id={field.name} type="datetime-local" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Reading'}</Button>
<Link href="/user-biomarker-readings" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
