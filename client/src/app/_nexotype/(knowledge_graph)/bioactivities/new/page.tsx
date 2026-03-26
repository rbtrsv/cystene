'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useBioactivities } from '@/modules/nexotype/hooks/knowledge_graph/use-bioactivities';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { CreateBioactivitySchema, ACTIVITY_TYPE_OPTIONS } from '@/modules/nexotype/schemas/knowledge_graph/bioactivity.schemas';
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
export default function CreateBioactivityPage() {
  const router = useRouter();
  const { createBioactivity, error: storeError } = useBioactivities();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { pathways } = usePathways();
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      asset_id: '',
      pathway_id: '',
      activity_type: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers
        const payload = {
          asset_id: parseInt(value.asset_id, 10),
          pathway_id: parseInt(value.pathway_id, 10),
          activity_type: value.activity_type,
        };

        // Validate with Zod
        const validation = CreateBioactivitySchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createBioactivity(validation.data);

        if (success) {
          router.push('/bioactivities');
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
        <Link href="/bioactivities">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bioactivities
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Bioactivity</h1>
        <p className="text-muted-foreground mt-2">
          Add a new bioactivity
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bioactivity Details</CardTitle>
          <CardDescription>
            Enter the details for your new bioactivity
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
                    <p className="text-xs text-muted-foreground">
                      The therapeutic asset associated with this bioactivity
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
                              ? pathways.find(p => p.id.toString() === field.state.value)?.name || 'Select pathway'
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
                              {pathways.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => {
                                    field.handleChange(p.id.toString());
                                    setPathwayPopoverOpen(false);
                                  }}
                                >
                                  {p.name}
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
                      The pathway associated with this bioactivity
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Activity Type — required enum select */}
              <form.Field
                name="activity_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Activity type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Activity Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of bioactivity measurement
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
                    'Create Bioactivity'
                  )}
                </Button>
                <Link href="/bioactivities" className="flex-1">
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
