'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useCandidates } from '@/modules/nexotype/hooks/engineering/use-candidates';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreateCandidateSchema } from '@/modules/nexotype/schemas/engineering/candidate.schemas';
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
export default function CreateCandidatePage() {
  const router = useRouter();
  const { candidates, createCandidate, error } = useCandidates();
  const { therapeuticAssets } = useTherapeuticAssets();
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { asset_id: '', version_number: '', parent_candidate_id: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          asset_id: parseInt(value.asset_id, 10),
          version_number: value.version_number.trim(),
          parent_candidate_id: value.parent_candidate_id ? parseInt(value.parent_candidate_id, 10) : undefined,
        };
        const parsed = CreateCandidateSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createCandidate(payload);
        if (ok) router.push('/candidates');

      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    }
  });

  // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/candidates">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Candidate</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
          <CardDescription>Enter candidate information</CardDescription>
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
            {/* Asset — required FK searchable combobox */}
            <form.Field name="asset_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Asset *</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assetPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset'
                            : 'Select asset'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search asset..." />
                        <CommandList>
                          <CommandEmpty>No assets found.</CommandEmpty>
                          <CommandGroup>
                            {therapeuticAssets.map((a) => (
                              <CommandItem
                                key={a.id}
                                value={a.name}
                                onSelect={() => {
                                  field.handleChange(a.id.toString());
                                  setAssetPopoverOpen(false);
                                }}
                              >
                                {a.name}
                                {field.state.value === a.id.toString() && (
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

            {/* Version Number — required */}
            <form.Field name="version_number">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Version Number *</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., v1"
                  />
                </div>
              )}
            </form.Field>

            {/* Parent Candidate — optional FK searchable combobox */}
            <form.Field name="parent_candidate_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Parent Candidate</Label>
                  <Popover open={parentPopoverOpen} onOpenChange={setParentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={parentPopoverOpen}
                        className="w-full justify-between font-normal"
                        disabled={form.state.isSubmitting}
                      >
                        <span className="truncate">
                          {field.state.value
                            ? candidates.find(c => c.id.toString() === field.state.value)?.version_number || 'Select parent'
                            : '— None —'}
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
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                field.handleChange('');
                                setParentPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!field.state.value && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                            {candidates.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.version_number} #${c.id}`}
                                onSelect={() => {
                                  field.handleChange(c.id.toString());
                                  setParentPopoverOpen(false);
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
                  'Create Candidate'
                )}
              </Button>
              <Link href="/candidates" className="flex-1">
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
