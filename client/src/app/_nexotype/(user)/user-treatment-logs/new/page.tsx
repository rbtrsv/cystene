'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserTreatmentLogs } from '@/modules/nexotype/hooks/user/use-user-treatment-logs';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreateUserTreatmentLogSchema } from '@/modules/nexotype/schemas/user/user-treatment-log.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for user treatment log records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateUserTreatmentLogPage() {
  const router = useRouter();
  const { createUserTreatmentLog, error } = useUserTreatmentLogs();
  const { subjects } = useSubjects();
  const { therapeuticAssets } = useTherapeuticAssets();
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { subject_id: '', asset_id: '', dosage: '', started_at: '', ended_at: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { subject_id: parseInt(value.subject_id, 10), asset_id: parseInt(value.asset_id, 10), dosage: value.dosage.trim(), started_at: value.started_at, ended_at: value.ended_at || null };
        const parsed = CreateUserTreatmentLogSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createUserTreatmentLog(payload);
        if (ok) router.push('/user-treatment-logs');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-treatment-logs">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to Treatment Logs</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Treatment Log</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>Treatment Log Details</CardTitle>
<CardDescription>Enter treatment metadata</CardDescription>
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
          {/* Asset — required FK searchable combobox */}
          <form.Field name="asset_id" validators={{ onChange: ({ value }) => !value ? 'Asset is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Asset *</Label>
                <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset' : 'Select asset'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                      {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { field.handleChange(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{field.state.value === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="dosage">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Dosage *</Label>
<Input id={field.name} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <form.Field name="started_at">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Started At *</Label>
<Input id={field.name} type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <form.Field name="ended_at">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Ended At</Label>
<Input id={field.name} type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Treatment Log'}</Button>
<Link href="/user-treatment-logs" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
