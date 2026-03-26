'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useAssetOwnerships } from '@/modules/nexotype/hooks/commercial/use-asset-ownerships';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreateAssetOwnershipSchema, OWNERSHIP_TYPE_OPTIONS } from '@/modules/nexotype/schemas/commercial/asset-ownership.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateAssetOwnershipPage() {
  const router = useRouter();
  const { createAssetOwnership, error: storeError } = useAssetOwnerships();
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      market_organization_id: '',
      asset_id: '',
      ownership_type: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers
        const payload = {
          market_organization_id: parseInt(value.market_organization_id, 10),
          asset_id: parseInt(value.asset_id, 10),
          ownership_type: value.ownership_type,
        };

        // Validate with Zod
        const validation = CreateAssetOwnershipSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createAssetOwnership(validation.data);

        if (success) {
          router.push('/asset-ownerships');
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
        <Link href="/asset-ownerships">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Asset Ownerships
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Asset Ownership</h1>
        <p className="text-muted-foreground mt-2">
          Add a new asset ownership
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Asset Ownership Details</CardTitle>
          <CardDescription>
            Enter the details for your new asset ownership
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
              {/* Market Organization — required FK searchable combobox */}
              <form.Field name="market_organization_id" validators={{ onChange: ({ value }) => !value ? 'Market organization is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Market Organization *</Label>
                    <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={orgPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? marketOrganizations.find(o => o.id.toString() === field.state.value)?.legal_name || 'Select organization' : 'Select organization'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search organization..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                          {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { field.handleChange(o.id.toString()); setOrgPopoverOpen(false); }}>{o.legal_name}{field.state.value === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
                  </div>
                )}
              </form.Field>

              {/* Asset — required FK searchable combobox */}
              <form.Field name="asset_id" validators={{ onChange: ({ value }) => !value ? 'Asset is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Asset *</Label>
                    <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset' : 'Select asset'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                          {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { field.handleChange(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{field.state.value === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
                  </div>
                )}
              </form.Field>

              {/* Ownership Type — required enum select */}
              <form.Field
                name="ownership_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Ownership type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Ownership Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ownership type" />
                      </SelectTrigger>
                      <SelectContent>
                        {OWNERSHIP_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of ownership for this asset
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
                    'Create Asset Ownership'
                  )}
                </Button>
                <Link href="/asset-ownerships" className="flex-1">
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
