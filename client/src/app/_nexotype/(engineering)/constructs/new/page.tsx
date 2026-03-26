'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useConstructs } from '@/modules/nexotype/hooks/engineering/use-constructs';
import { useCandidates } from '@/modules/nexotype/hooks/engineering/use-candidates';
import { CreateConstructSchema } from '@/modules/nexotype/schemas/engineering/construct.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateConstructPage() {
  const router = useRouter();
  const { createConstruct, error } = useConstructs();
  const { candidates } = useCandidates();
  const [candidatePopoverOpen, setCandidatePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { candidate_id: '', plasmid_map_url: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          candidate_id: parseInt(value.candidate_id, 10),
          plasmid_map_url: value.plasmid_map_url.trim() || undefined,
        };
        const parsed = CreateConstructSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createConstruct(payload);
        if (ok) router.push('/constructs');

      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    }
  });

  // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/constructs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Constructs
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Construct</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Construct Details</CardTitle>
          <CardDescription>Enter construct information</CardDescription>
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
            {/* Candidate — required FK searchable combobox */}
            <form.Field name="candidate_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Candidate *</Label>
                  <Popover open={candidatePopoverOpen} onOpenChange={setCandidatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={candidatePopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? candidates.find(c => c.id.toString() === field.state.value)?.version_number || 'Select candidate'
                            : 'Select candidate'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search candidate..." />
                        <CommandList>
                          <CommandEmpty>No candidates found.</CommandEmpty>
                          <CommandGroup>
                            {candidates.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.version_number} #${c.id}`}
                                onSelect={() => {
                                  field.handleChange(c.id.toString());
                                  setCandidatePopoverOpen(false);
                                }}
                              >
                                {c.version_number} (#{c.id})
                                {field.state.value === c.id.toString() && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </form.Field>

            {/* Plasmid Map URL — optional */}
            <form.Field name="plasmid_map_url">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Plasmid Map URL</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
            </form.Field>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button
                type="submit"
                className="flex-1"
                disabled={form.state.isSubmitting}
              >
                {form.state.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Construct'
                )}
              </Button>
              <Link href="/constructs" className="flex-1">
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
