'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { usePathwayMemberships } from '@/modules/nexotype/hooks/knowledge_graph/use-pathway-memberships';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { CreatePathwayMembershipSchema } from '@/modules/nexotype/schemas/knowledge_graph/pathway-membership.schemas';
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
export default function CreatePathwayMembershipPage() {
  const router = useRouter();
  const { createPathwayMembership, error: storeError } = usePathwayMemberships();
  const { proteins } = useProteins();
  const { pathways } = usePathways();
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      protein_id: '',
      pathway_id: '',
      role: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to undefined
        const payload = {
          protein_id: parseInt(value.protein_id, 10),
          pathway_id: parseInt(value.pathway_id, 10),
          role: value.role || undefined,
        };

        // Validate with Zod
        const validation = CreatePathwayMembershipSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createPathwayMembership(payload);

        if (success) {
          router.push('/pathway-memberships');
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
        <Link href="/pathway-memberships">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pathway Memberships
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Pathway Membership</h1>
        <p className="text-muted-foreground mt-2">
          Add a new protein-pathway membership
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pathway Membership Details</CardTitle>
          <CardDescription>
            Enter the details for your new pathway membership
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
              {/* Protein — required FK searchable combobox */}
              <form.Field
                name="protein_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Protein is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Protein *</Label>
                    <Popover open={proteinPopoverOpen} onOpenChange={setProteinPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={proteinPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? proteins.find(p => p.id.toString() === field.state.value)?.uniprot_accession || 'Select protein'
                              : 'Select protein'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search protein..." />
                          <CommandList>
                            <CommandEmpty>No proteins found.</CommandEmpty>
                            <CommandGroup>
                              {proteins.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.uniprot_accession}
                                  onSelect={() => {
                                    field.handleChange(p.id.toString());
                                    setProteinPopoverOpen(false);
                                  }}
                                >
                                  {p.uniprot_accession}
                                  {field.state.value === p.id.toString() && (
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
                      The protein associated with this pathway membership
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Pathway — required FK searchable combobox */}
              <form.Field
                name="pathway_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Pathway is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Pathway *</Label>
                    <Popover open={pathwayPopoverOpen} onOpenChange={setPathwayPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={pathwayPopoverOpen}
                          className="w-full justify-between font-normal"
                          disabled={form.state.isSubmitting}
                        >
                          <span className="truncate">
                            {field.state.value
                              ? pathways.find(pw => pw.id.toString() === field.state.value)?.name || 'Select pathway'
                              : 'Select pathway'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search pathway..." />
                          <CommandList>
                            <CommandEmpty>No pathways found.</CommandEmpty>
                            <CommandGroup>
                              {pathways.map((pw) => (
                                <CommandItem
                                  key={pw.id}
                                  value={pw.name}
                                  onSelect={() => {
                                    field.handleChange(pw.id.toString());
                                    setPathwayPopoverOpen(false);
                                  }}
                                >
                                  {pw.name}
                                  {field.state.value === pw.id.toString() && (
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
                      The pathway this membership belongs to
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Role — optional */}
              <form.Field
                name="role"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value.length > 100) {
                      return 'Role must be 100 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Role</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., kinase"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The role of the protein in this pathway
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
                    'Create Pathway Membership'
                  )}
                </Button>
                <Link href="/pathway-memberships" className="flex-1">
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
