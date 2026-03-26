'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useOrganizationTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-organization-technology-platforms';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-technology-platforms';
import { CreateOrganizationTechnologyPlatformSchema, UTILIZATION_TYPE_OPTIONS } from '@/modules/nexotype/schemas/commercial/organization-technology-platform.schemas';
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
export default function CreateOrganizationTechnologyPlatformPage() {
  const router = useRouter();
  const { createOrganizationTechnologyPlatform, error: storeError } = useOrganizationTechnologyPlatforms();
  const { marketOrganizations } = useMarketOrganizations();
  const { technologyPlatforms } = useTechnologyPlatforms();
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [platformPopoverOpen, setPlatformPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      market_organization_id: '',
      technology_platform_id: '',
      utilization_type: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers
        const payload = {
          market_organization_id: parseInt(value.market_organization_id, 10),
          technology_platform_id: parseInt(value.technology_platform_id, 10),
          utilization_type: value.utilization_type,
        };

        // Validate with Zod
        const validation = CreateOrganizationTechnologyPlatformSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createOrganizationTechnologyPlatform(validation.data);

        if (success) {
          router.push('/organization-technology-platforms');
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
        <Link href="/organization-technology-platforms">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organization Technology Platforms
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Organization Technology Platform</h1>
        <p className="text-muted-foreground mt-2">
          Add a new organization-technology platform association
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization Technology Platform Details</CardTitle>
          <CardDescription>
            Enter the details for your new organization technology platform
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

              {/* Technology Platform — required FK searchable combobox */}
              <form.Field name="technology_platform_id" validators={{ onChange: ({ value }) => !value ? 'Technology platform is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Technology Platform *</Label>
                    <Popover open={platformPopoverOpen} onOpenChange={setPlatformPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={platformPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? technologyPlatforms.find(tp => tp.id.toString() === field.state.value)?.name || 'Select platform' : 'Select platform'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search platform..." /><CommandList><CommandEmpty>No platforms found.</CommandEmpty><CommandGroup>
                          {technologyPlatforms.map((tp) => (<CommandItem key={tp.id} value={tp.name} onSelect={() => { field.handleChange(tp.id.toString()); setPlatformPopoverOpen(false); }}>{tp.name}{field.state.value === tp.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
                  </div>
                )}
              </form.Field>

              {/* Utilization Type — required enum select */}
              <form.Field
                name="utilization_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Utilization type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Utilization Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select utilization type" />
                      </SelectTrigger>
                      <SelectContent>
                        {UTILIZATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The utilization type for this organization technology platform
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
                    'Create Organization Technology Platform'
                  )}
                </Button>
                <Link href="/organization-technology-platforms" className="flex-1">
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
