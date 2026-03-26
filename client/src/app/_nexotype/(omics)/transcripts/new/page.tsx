'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useTranscripts } from '@/modules/nexotype/hooks/omics/use-transcripts';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { CreateTranscriptSchema } from '@/modules/nexotype/schemas/omics/transcript.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateTranscriptPage() {
  const router = useRouter();
  const { createTranscript, error: storeError } = useTranscripts();
  const { genes } = useGenes();
  const [genePopoverOpen, setGenePopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      gene_id: '',
      ensembl_transcript_id: '',
      is_canonical: false,
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert gene_id string to integer
        const payload = {
          gene_id: parseInt(value.gene_id, 10),
          ensembl_transcript_id: value.ensembl_transcript_id,
          is_canonical: value.is_canonical,
        };

        // Validate with Zod
        const validation = CreateTranscriptSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createTranscript(payload);

        if (success) {
          router.push('/transcripts');
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
        <Link href="/transcripts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transcripts
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Transcript</h1>
        <p className="text-muted-foreground mt-2">
          Add a new mRNA splice variant to the omics registry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transcript Details</CardTitle>
          <CardDescription>
            Enter the details for your new transcript
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
              {/* Gene — required FK searchable combobox */}
              <form.Field
                name="gene_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Gene is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Gene *</Label>
                    <Popover open={genePopoverOpen} onOpenChange={setGenePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={genePopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? genes.find(g => g.id.toString() === field.state.value)?.hgnc_symbol || 'Select gene'
                              : 'Select gene'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search gene..." />
                          <CommandList>
                            <CommandEmpty>No genes found.</CommandEmpty>
                            <CommandGroup>
                              {genes.map((gene) => (
                                <CommandItem
                                  key={gene.id}
                                  value={`${gene.hgnc_symbol} ${gene.ensembl_gene_id}`}
                                  onSelect={() => {
                                    field.handleChange(gene.id.toString());
                                    setGenePopoverOpen(false);
                                  }}
                                >
                                  {gene.hgnc_symbol} ({gene.ensembl_gene_id})
                                  {field.state.value === gene.id.toString() && (
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
                      The gene this transcript belongs to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Ensembl Transcript ID — required */}
              <form.Field
                name="ensembl_transcript_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Ensembl Transcript ID is required';
                    }
                    if (value.length > 50) {
                      return 'Ensembl Transcript ID must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Ensembl Transcript ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., ENST00000269305"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ensembl stable transcript identifier (unique)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Is Canonical — boolean checkbox */}
              <form.Field name="is_canonical">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      disabled={form.state.isSubmitting}
                    />
                    <Label htmlFor={field.name} className="cursor-pointer">
                      Canonical transcript
                    </Label>
                    <p className="text-xs text-muted-foreground ml-2">
                      Mark as the primary/canonical isoform for this gene
                    </p>
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
                    'Create Transcript'
                  )}
                </Button>
                <Link href="/transcripts" className="flex-1">
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
