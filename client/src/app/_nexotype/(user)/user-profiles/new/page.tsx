'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserProfiles } from '@/modules/nexotype/hooks/user/use-user-profiles';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { CreateUserProfileSchema } from '@/modules/nexotype/schemas/user/user-profile.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for user profile records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateUserProfilePage() {
  const router = useRouter();
  const { createUserProfile, error } = useUserProfiles();
  const { subjects } = useSubjects();
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { user_id: '', subject_id: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { user_id: parseInt(value.user_id, 10), subject_id: parseInt(value.subject_id, 10) };
        const parsed = CreateUserProfileSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createUserProfile(payload);
        if (ok) router.push('/user-profiles');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-profiles">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to User Profiles</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create User Profile</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>User Profile Details</CardTitle>
<CardDescription>Link a user to a subject</CardDescription>
</CardHeader>
<CardContent>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="user_id">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>User ID *</Label>
<Input id={field.name} type="number" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          {/* Subject — required FK searchable combobox */}
          <form.Field
            name="subject_id"
            validators={{
              onChange: ({ value }) => {
                if (!value) {
                  return 'Subject is required';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={subjectPopoverOpen}
                      className="w-full justify-between font-normal"
                      disabled={form.state.isSubmitting}
                    >
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
                            <CommandItem
                              key={s.id}
                              value={s.subject_identifier}
                              onSelect={() => {
                                field.handleChange(s.id.toString());
                                setSubjectPopoverOpen(false);
                              }}
                            >
                              {s.subject_identifier}
                              {field.state.value === s.id.toString() && (
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
                  The subject linked to this user profile
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
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create User Profile'}</Button>
<Link href="/user-profiles" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
