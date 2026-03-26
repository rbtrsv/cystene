'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { CreateProteinSchema } from '@/modules/nexotype/schemas/omics/protein.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateProteinPage() {
  const router = useRouter();
  const { createProtein, error: storeError } = useProteins();
  const { transcripts } = useTranscripts();
  const [transcriptPopoverOpen, setTranscriptPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      transcript_id: '',
      uniprot_accession: '',
      sequence_aa: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert transcript_id string to integer
        const payload = {
          transcript_id: parseInt(value.transcript_id, 10),
          uniprot_accession: value.uniprot_accession,
          sequence_aa: value.sequence_aa,
        };

        // Validate with Zod
        const validation = CreateProteinSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createProtein(payload);

        if (success) {
          router.push('/proteins');
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
        <Link href="/proteins">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proteins
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Protein</h1>
        <p className="text-muted-foreground mt-2">
          Add a new proteoform to the omics registry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Protein Details</CardTitle>
          <CardDescription>
            Enter the details for your new protein
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
              {/* Transcript — required FK selector */}
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
                    <Label htmlFor={field.name}>Transcript *</Label>
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
                      The transcript this protein is translated from (1:1 relationship)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* UniProt Accession — required */}
              <form.Field
                name="uniprot_accession"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'UniProt Accession is required';
                    }
                    if (value.length > 20) {
                      return 'UniProt Accession must be 20 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>UniProt Accession *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., P04637"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      UniProt database accession number (unique)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Amino Acid Sequence — required text */}
              <form.Field
                name="sequence_aa"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Amino acid sequence is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Amino Acid Sequence *</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., MEEPQSDPSVEPPLSQETFSDLWKLL..."
                      disabled={form.state.isSubmitting}
                      rows={6}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Full amino acid sequence in single-letter code
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
                    'Create Protein'
                  )}
                </Button>
                <Link href="/proteins" className="flex-1">
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
