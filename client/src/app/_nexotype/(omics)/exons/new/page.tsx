'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useExons } from '@/modules/nexotype/hooks/omics/use-exons';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { CreateExonSchema } from '@/modules/nexotype/schemas/omics/exon.schemas';
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
export default function CreateExonPage() {
  const router = useRouter();
  const { createExon, error: storeError } = useExons();
  const { transcripts } = useTranscripts();
  const [transcriptPopoverOpen, setTranscriptPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      transcript_id: '',
      ensembl_exon_id: '',
      start_position: '',
      end_position: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert string values to integers
        const payload = {
          transcript_id: parseInt(value.transcript_id, 10),
          ensembl_exon_id: value.ensembl_exon_id,
          start_position: parseInt(value.start_position, 10),
          end_position: parseInt(value.end_position, 10),
        };

        // Validate with Zod
        const validation = CreateExonSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createExon(payload);

        if (success) {
          router.push('/exons');
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
        <Link href="/exons">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exons
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Exon</h1>
        <p className="text-muted-foreground mt-2">
          Add a new exon segment to the omics registry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exon Details</CardTitle>
          <CardDescription>
            Enter the details for your new exon
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
              {/* Transcript — required FK searchable combobox */}
              <form.Field
                name="transcript_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Transcript is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Transcript *</Label>
                    <Popover open={transcriptPopoverOpen} onOpenChange={setTranscriptPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={transcriptPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? transcripts.find(t => t.id.toString() === field.state.value)?.ensembl_transcript_id || 'Select transcript'
                              : 'Select transcript'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search transcript..." />
                          <CommandList>
                            <CommandEmpty>No transcripts found.</CommandEmpty>
                            <CommandGroup>
                              {transcripts.map((t) => (
                                <CommandItem
                                  key={t.id}
                                  value={t.ensembl_transcript_id}
                                  onSelect={() => {
                                    field.handleChange(t.id.toString());
                                    setTranscriptPopoverOpen(false);
                                  }}
                                >
                                  {t.ensembl_transcript_id} {t.is_canonical ? '(canonical)' : ''}
                                  {field.state.value === t.id.toString() && (
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
                      The transcript this exon belongs to (many exons per transcript)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Ensembl Exon ID — required */}
              <form.Field
                name="ensembl_exon_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Ensembl Exon ID is required';
                    }
                    if (value.length > 50) {
                      return 'Ensembl Exon ID must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Ensembl Exon ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., ENSE00001494919"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ensembl database exon identifier
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Start Position — required integer */}
              <form.Field
                name="start_position"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Start position is required';
                    }
                    const num = parseInt(value, 10);
                    if (isNaN(num)) {
                      return 'Start position must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Start Position *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 7687490"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Genomic start position of the exon
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* End Position — required integer */}
              <form.Field
                name="end_position"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'End position is required';
                    }
                    const num = parseInt(value, 10);
                    if (isNaN(num)) {
                      return 'End position must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>End Position *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 7687538"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Genomic end position of the exon
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
                    'Create Exon'
                  )}
                </Button>
                <Link href="/exons" className="flex-1">
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
