'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { usePathwayScores } from '@/modules/nexotype/hooks/user/use-pathway-scores';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { CreatePathwayScoreSchema } from '@/modules/nexotype/schemas/user/pathway-score.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for pathway score records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreatePathwayScorePage() {
  const router = useRouter();
  const { createPathwayScore, error } = usePathwayScores();
  const { subjects } = useSubjects();
  const { pathways } = usePathways();
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { subject_id: '', pathway_id: '', score: '', calculated_at: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { subject_id: parseInt(value.subject_id, 10), pathway_id: parseInt(value.pathway_id, 10), score: parseFloat(value.score), calculated_at: value.calculated_at };
        const parsed = CreatePathwayScoreSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createPathwayScore(payload);
        if (ok) router.push('/pathway-scores');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/pathway-scores">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to Pathway Scores</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Pathway Score</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>Pathway Score Details</CardTitle>
<CardDescription>Enter pathway scoring metadata</CardDescription>
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
          {/* Pathway — required FK searchable combobox */}
          <form.Field name="pathway_id" validators={{ onChange: ({ value }) => !value ? 'Pathway is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Pathway *</Label>
                <Popover open={pathwayPopoverOpen} onOpenChange={setPathwayPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={pathwayPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? pathways.find(p => p.id.toString() === field.state.value)?.name || 'Select pathway' : 'Select pathway'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search pathway..." /><CommandList><CommandEmpty>No pathways found.</CommandEmpty><CommandGroup>
                      {pathways.map((p) => (<CommandItem key={p.id} value={p.name} onSelect={() => { field.handleChange(p.id.toString()); setPathwayPopoverOpen(false); }}>{p.name}{field.state.value === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="score">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Score *</Label>
<Input id={field.name} type="number" step="any" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <form.Field name="calculated_at">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Calculated At *</Label>
<Input id={field.name} type="datetime-local" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Pathway Score'}</Button>
<Link href="/pathway-scores" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
