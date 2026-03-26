'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useDrugInteractions } from '@/modules/nexotype/hooks/knowledge_graph/use-drug-interactions';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreateDrugInteractionSchema, INTERACTION_TYPE_OPTIONS } from '@/modules/nexotype/schemas/knowledge_graph/drug-interaction.schemas';
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
export default function CreateDrugInteractionPage() {
  const router = useRouter();
  const { createDrugInteraction, error: storeError } = useDrugInteractions();
  const { therapeuticAssets } = useTherapeuticAssets();
  const [assetAPopoverOpen, setAssetAPopoverOpen] = useState(false);
  const [assetBPopoverOpen, setAssetBPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      asset_a_id: '',
      asset_b_id: '',
      interaction_type: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers
        const payload = {
          asset_a_id: parseInt(value.asset_a_id, 10),
          asset_b_id: parseInt(value.asset_b_id, 10),
          interaction_type: value.interaction_type,
        };

        // Validate with Zod
        const validation = CreateDrugInteractionSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createDrugInteraction(validation.data);

        if (success) {
          router.push('/drug-interactions');
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
        <Link href="/drug-interactions">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drug Interactions
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Drug Interaction</h1>
        <p className="text-muted-foreground mt-2">
          Add a new drug interaction
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Drug Interaction Details</CardTitle>
          <CardDescription>
            Enter the details for your new drug interaction
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
              {/* Asset A — required FK searchable combobox */}
              <form.Field
                name="asset_a_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Asset A is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Asset A *</Label>
                    <Popover open={assetAPopoverOpen} onOpenChange={setAssetAPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={assetAPopoverOpen}
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
                                    setAssetAPopoverOpen(false);
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
                    <p className="text-xs text-muted-foreground">
                      The first therapeutic asset in this interaction
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Asset B — required FK searchable combobox */}
              <form.Field
                name="asset_b_id"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Asset B is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Asset B *</Label>
                    <Popover open={assetBPopoverOpen} onOpenChange={setAssetBPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={assetBPopoverOpen}
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
                                    setAssetBPopoverOpen(false);
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
                    <p className="text-xs text-muted-foreground">
                      The second therapeutic asset in this interaction
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Interaction Type — required enum select */}
              <form.Field
                name="interaction_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Interaction type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Interaction Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select interaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERACTION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of drug interaction
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
                    'Create Drug Interaction'
                  )}
                </Button>
                <Link href="/drug-interactions" className="flex-1">
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
