'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useDrugTargetMechanisms } from '@/modules/nexotype/hooks/knowledge_graph/use-drug-target-mechanisms';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { CreateDrugTargetMechanismSchema, MECHANISM_OPTIONS } from '@/modules/nexotype/schemas/knowledge_graph/drug-target-mechanism.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateDrugTargetMechanismPage() {
  const router = useRouter();
  const { createDrugTargetMechanism, error: storeError } = useDrugTargetMechanisms();

  // Get referenced entities for FK searchable comboboxes
  const { therapeuticAssets } = useTherapeuticAssets();
  const { proteins } = useProteins();

  // Combobox popover state
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [proteinPopoverOpen, setProteinPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      asset_id: '',
      protein_id: '',
      mechanism: '',
      affinity_value: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to null
        const payload = {
          asset_id: parseInt(value.asset_id, 10),
          protein_id: parseInt(value.protein_id, 10),
          mechanism: value.mechanism,
          affinity_value: value.affinity_value ? parseFloat(value.affinity_value) : null,
        };

        // Validate with Zod
        const validation = CreateDrugTargetMechanismSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createDrugTargetMechanism(validation.data);

        if (success) {
          router.push('/drug-target-mechanisms');
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
        <Link href="/drug-target-mechanisms">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drug Target Mechanisms
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-2xl sm:text-3xl font-bold tracking-tight">Create Drug Target Mechanism</h1>
        <p className="text-muted-foreground mt-2">
          Add a new drug-target mechanism
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Drug Target Mechanism Details</CardTitle>
          <CardDescription>
            Enter the details for your new drug target mechanism
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
              {/* Asset — required FK searchable combobox */}
              <form.Field
                name="asset_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Asset is required';
                    }
                    return undefined;
                  },
                }}
              >
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
                              {therapeuticAssets.map(asset => (
                                <CommandItem
                                  key={asset.id}
                                  value={asset.name}
                                  onSelect={() => {
                                    field.handleChange(asset.id.toString());
                                    setAssetPopoverOpen(false);
                                  }}
                                >
                                  {asset.name}
                                  {field.state.value === asset.id.toString() && (
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
                      The therapeutic asset associated with this mechanism
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

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
                              {proteins.map(protein => (
                                <CommandItem
                                  key={protein.id}
                                  value={protein.uniprot_accession}
                                  onSelect={() => {
                                    field.handleChange(protein.id.toString());
                                    setProteinPopoverOpen(false);
                                  }}
                                >
                                  {protein.uniprot_accession}
                                  {field.state.value === protein.id.toString() && (
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
                      The protein target of this mechanism
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Mechanism — required enum select */}
              <form.Field
                name="mechanism"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Mechanism is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Mechanism *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select mechanism" />
                      </SelectTrigger>
                      <SelectContent>
                        {MECHANISM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of mechanism (e.g., inhibitor, agonist, antagonist)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Affinity Value — optional */}
              <form.Field
                name="affinity_value"
                validators={{
                  onChange: ({ value }) => {
                    if (value && isNaN(Number(value))) {
                      return 'Affinity value must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Affinity Value</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="any"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 5.2"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The binding affinity value (optional)
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
                <Link href="/drug-target-mechanisms" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={form.state.isSubmitting}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </Link>
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
                    'Create Drug Target Mechanism'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
