'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { usePatentAssignees } from '@/modules/nexotype/hooks/commercial/use-patent-assignees';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { CreatePatentAssigneeSchema } from '@/modules/nexotype/schemas/commercial/patent-assignee.schemas';
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
export default function CreatePatentAssigneePage() {
  const router = useRouter();
  const { createPatentAssignee, error: storeError } = usePatentAssignees();
  const { patents } = usePatents();
  const { marketOrganizations } = useMarketOrganizations();
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      patent_id: '',
      market_organization_id: '',
      assignment_date: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, assignment_date as-is
        const payload = {
          patent_id: parseInt(value.patent_id, 10),
          market_organization_id: parseInt(value.market_organization_id, 10),
          assignment_date: value.assignment_date,
        };

        // Validate with Zod
        const validation = CreatePatentAssigneeSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createPatentAssignee(payload);

        if (success) {
          router.push('/patent-assignees');
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
        <Link href="/patent-assignees">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patent Assignees
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Patent Assignee</h1>
        <p className="text-muted-foreground mt-2">
          Add a new patent assignee
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patent Assignee Details</CardTitle>
          <CardDescription>
            Enter the details for your new patent assignee
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

              {/* Assignment Date — required */}
              <form.Field
                name="assignment_date"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Assignment date is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Assignment Date *</Label>
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
                      The date of the patent assignment
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
                    'Create Patent Assignee'
                  )}
                </Button>
                <Link href="/patent-assignees" className="flex-1">
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
