'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useLicensingAgreements } from '@/modules/nexotype/hooks/commercial/use-licensing-agreements';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { CreateLicensingAgreementSchema, AGREEMENT_TYPE_OPTIONS, TERRITORY_OPTIONS, LICENSE_STATUS_OPTIONS } from '@/modules/nexotype/schemas/commercial/licensing-agreement.schemas';
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
export default function CreateLicensingAgreementPage() {
  const router = useRouter();
  const { createLicensingAgreement, error: storeError } = useLicensingAgreements();
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { patents } = usePatents();
  const [licensorPopoverOpen, setLicensorPopoverOpen] = useState(false);
  const [licenseePopoverOpen, setLicenseePopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      licensor_id: '',
      licensee_id: '',
      asset_id: '',
      patent_id: '',
      agreement_type: '',
      territory: '',
      value_usd: '',
      start_date: '',
      end_date: '',
      status: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to null
        const payload = {
          licensor_id: parseInt(value.licensor_id, 10),
          licensee_id: parseInt(value.licensee_id, 10),
          asset_id: value.asset_id ? parseInt(value.asset_id, 10) : null,
          patent_id: value.patent_id ? parseInt(value.patent_id, 10) : null,
          agreement_type: value.agreement_type,
          territory: value.territory === '' || value.territory === '__none__' ? null : value.territory,
          value_usd: value.value_usd ? parseFloat(value.value_usd) : null,
          start_date: value.start_date,
          end_date: value.end_date || null,
          status: value.status,
        };

        // Validate with Zod
        const validation = CreateLicensingAgreementSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createLicensingAgreement(validation.data);

        if (success) {
          router.push('/licensing-agreements');
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
        <Link href="/licensing-agreements">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Licensing Agreements
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Licensing Agreement</h1>
        <p className="text-muted-foreground mt-2">
          Add a new licensing agreement
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Licensing Agreement Details</CardTitle>
          <CardDescription>
            Enter the details for your new licensing agreement
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
              {/* Licensor — required FK searchable combobox */}
              <form.Field name="licensor_id" validators={{ onChange: ({ value }) => !value ? 'Licensor is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Licensor *</Label>
                    <Popover open={licensorPopoverOpen} onOpenChange={setLicensorPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={licensorPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? marketOrganizations.find(o => o.id.toString() === field.state.value)?.legal_name || 'Select licensor' : 'Select licensor'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search licensor..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                          {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { field.handleChange(o.id.toString()); setLicensorPopoverOpen(false); }}>{o.legal_name}{field.state.value === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
                  </div>
                )}
              </form.Field>

              {/* Licensee — required FK searchable combobox */}
              <form.Field name="licensee_id" validators={{ onChange: ({ value }) => !value ? 'Licensee is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Licensee *</Label>
                    <Popover open={licenseePopoverOpen} onOpenChange={setLicenseePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={licenseePopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? marketOrganizations.find(o => o.id.toString() === field.state.value)?.legal_name || 'Select licensee' : 'Select licensee'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search licensee..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                          {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { field.handleChange(o.id.toString()); setLicenseePopoverOpen(false); }}>{o.legal_name}{field.state.value === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
                  </div>
                )}
              </form.Field>

              {/* Asset — optional FK searchable combobox */}
              <form.Field name="asset_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value && field.state.value !== '__none__' ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset' : 'Select asset'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                          <CommandItem value="__none__" onSelect={() => { field.handleChange(''); setAssetPopoverOpen(false); }}>— None —</CommandItem>
                          {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { field.handleChange(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{field.state.value === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </form.Field>

              {/* Patent — optional FK searchable combobox */}
              <form.Field name="patent_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Patent</Label>
                    <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={patentPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value && field.state.value !== '__none__' ? patents.find(p => p.id.toString() === field.state.value)?.patent_number || 'Select patent' : 'Select patent'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search patent..." /><CommandList><CommandEmpty>No patents found.</CommandEmpty><CommandGroup>
                          <CommandItem value="__none__" onSelect={() => { field.handleChange(''); setPatentPopoverOpen(false); }}>— None —</CommandItem>
                          {patents.map((p) => (<CommandItem key={p.id} value={p.patent_number} onSelect={() => { field.handleChange(p.id.toString()); setPatentPopoverOpen(false); }}>{p.patent_number}{field.state.value === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </form.Field>

              {/* Agreement Type — required enum select */}
              <form.Field
                name="agreement_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Agreement type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Agreement Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select agreement type" />
                      </SelectTrigger>
                      <SelectContent>
                        {AGREEMENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of licensing agreement
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Territory — optional nullable enum select */}
              <form.Field
                name="territory"
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Territory</Label>
                    <Select
                      value={field.state.value || '__none__'}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select territory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {TERRITORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The territory covered by this agreement (optional)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Value USD — optional */}
              <form.Field
                name="value_usd"
                validators={{
                  onChange: ({ value }) => {
                    if (value && isNaN(Number(value))) {
                      return 'Value must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Value (USD)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 50000"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The monetary value of this agreement in USD (optional)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Start Date — required */}
              <form.Field
                name="start_date"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Start date is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Start Date *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The start date of the agreement
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* End Date — optional */}
              <form.Field
                name="end_date"
                validators={{
                  onChange: () => {
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>End Date</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The end date of the agreement (optional)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Status — required enum select */}
              <form.Field
                name="status"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Status is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The current status of the agreement
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
                    'Create Licensing Agreement'
                  )}
                </Button>
                <Link href="/licensing-agreements" className="flex-1">
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
