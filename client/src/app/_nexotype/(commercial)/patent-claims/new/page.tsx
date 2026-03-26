'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { usePatentClaims } from '@/modules/nexotype/hooks/commercial/use-patent-claims';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreatePatentClaimSchema, CLAIM_TYPE_OPTIONS } from '@/modules/nexotype/schemas/commercial/patent-claim.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
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
export default function CreatePatentClaimPage() {
  const router = useRouter();
  const { createPatentClaim, error: storeError } = usePatentClaims();
  const { patents } = usePatents();
  const { therapeuticAssets } = useTherapeuticAssets();
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      patent_id: '',
      asset_id: '',
      claim_type: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, required fields validated
        const payload = {
          patent_id: parseInt(value.patent_id, 10),
          asset_id: parseInt(value.asset_id, 10),
          claim_type: value.claim_type,
        };

        // Validate with Zod
        const validation = CreatePatentClaimSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createPatentClaim(validation.data);

        if (success) {
          router.push('/patent-claims');
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
        <Link href="/patent-claims">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patent Claims
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Patent Claim</h1>
        <p className="text-muted-foreground mt-2">
          Add a new patent claim
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patent Claim Details</CardTitle>
          <CardDescription>
            Enter the details for your new patent claim
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
              {/* Patent — required FK searchable combobox */}
              <form.Field name="patent_id" validators={{ onChange: ({ value }) => !value ? 'Patent is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Patent *</Label>
                    <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={patentPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? patents.find(p => p.id.toString() === field.state.value)?.patent_number || 'Select patent' : 'Select patent'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search patent..." /><CommandList><CommandEmpty>No patents found.</CommandEmpty><CommandGroup>
                          {patents.map((p) => (<CommandItem key={p.id} value={p.patent_number} onSelect={() => { field.handleChange(p.id.toString()); setPatentPopoverOpen(false); }}>{p.patent_number}{field.state.value === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
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

              {/* Claim Type — required enum select */}
              <form.Field
                name="claim_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Claim type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Claim Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAIM_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of this patent claim
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
                    'Create Patent Claim'
                  )}
                </Button>
                <Link href="/patent-claims" className="flex-1">
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
