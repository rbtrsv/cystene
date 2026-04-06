'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useDealPipelines } from '@/modules/assetmanager/hooks/holding/use-deal-pipelines';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateDealPipelineSchema } from '@/modules/assetmanager/schemas/holding/deal-pipeline.schemas';
import type { CreateDealPipeline } from '@/modules/assetmanager/schemas/holding/deal-pipeline.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// ==========================================
// Enum dropdown options
// ==========================================

const PIPELINE_PRIORITY_OPTIONS = [
  { value: 'p1', label: 'P1 — Highest' },
  { value: 'p2', label: 'P2 — High' },
  { value: 'p3', label: 'P3 — Medium' },
  { value: 'p4', label: 'P4 — Low' },
  { value: 'p5', label: 'P5 — Lowest' },
] as const;

const PIPELINE_STATUS_OPTIONS = [
  { value: 'initial_screening', label: 'Initial Screening' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' },
  { value: 'passed', label: 'Passed' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export default function CreateDealPipelinePage() {
  const router = useRouter();
  const { entities, activeEntity } = useEntities();
  const { createDealPipeline, error: storeError } = useDealPipelines();

  // Entity combobox state
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      deal_name: '',
      company_name: '',
      priority: 'p3',
      status: 'initial_screening',
      round_type: '',
      sector: '',
      is_lead_investor: false,
      // Financial Details
      target_raise: '',
      pre_money_valuation: '',
      post_money_valuation: '',
      expected_ownership: '',
      investment_amount: '',
      other_investors: '',
      // Dates
      first_contact_date: '',
      last_interaction_date: '',
      next_meeting_date: '',
      expected_close_date: '',
      // Notes & Analysis
      investment_thesis: '',
      key_risks: '',
      due_diligence_notes: '',
      next_steps: '',
      rejection_reason: '',
      notes: '',
    },
    onSubmit: async ({ value }) => {
      // Build payload with proper null handling for optional fields
      const optNum = (val: string): number | null => {
        if (!val || val.trim() === '') return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
      };
      const optStr = (val: string): string | null => val.trim() || null;

      const payload = {
        entity_id: value.entity_id,
        deal_name: value.deal_name,
        priority: value.priority,
        status: value.status,
        round_type: value.round_type,
        sector: value.sector,
        is_lead_investor: value.is_lead_investor,
        company_name: optStr(value.company_name),
        target_raise: optNum(value.target_raise),
        pre_money_valuation: optNum(value.pre_money_valuation),
        post_money_valuation: optNum(value.post_money_valuation),
        expected_ownership: optNum(value.expected_ownership),
        investment_amount: optNum(value.investment_amount),
        other_investors: optStr(value.other_investors),
        first_contact_date: optStr(value.first_contact_date),
        last_interaction_date: optStr(value.last_interaction_date),
        next_meeting_date: optStr(value.next_meeting_date),
        expected_close_date: optStr(value.expected_close_date),
        investment_thesis: optStr(value.investment_thesis),
        key_risks: optStr(value.key_risks),
        due_diligence_notes: optStr(value.due_diligence_notes),
        next_steps: optStr(value.next_steps),
        rejection_reason: optStr(value.rejection_reason),
        notes: optStr(value.notes),
      };

      const result = CreateDealPipelineSchema.safeParse(payload);
      if (!result.success) return;
      const success = await createDealPipeline(result.data as CreateDealPipeline);
      if (success) router.push('/deal-pipeline');
    },
  });

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/deal-pipeline">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deal Pipeline
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Deal Pipeline</h1>
        <p className="text-muted-foreground">
          Add a new deal pipeline entry
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Entity Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Entity</CardTitle>
            <CardDescription>Select the entity for this deal pipeline entry</CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="entity_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Entity</Label>
                  <Popover open={entityPopoverOpen} onOpenChange={setEntityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={entityPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {field.state.value
                            ? entities.find((e) => e.id === field.state.value)?.name || 'Select entity...'
                            : 'Select entity...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search entity..." />
                        <CommandList>
                          <CommandEmpty>No entities found.</CommandEmpty>
                          <CommandGroup>
                            {entities.map((entity) => (
                              <CommandItem
                                key={entity.id}
                                value={entity.name}
                                onSelect={() => {
                                  field.handleChange(entity.id);
                                  setEntityPopoverOpen(false);
                                }}
                              >
                                {entity.name}
                                {field.state.value === entity.id && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Core Details */}
        <Card>
          <CardHeader>
            <CardTitle>Core Details</CardTitle>
            <CardDescription>Basic deal pipeline information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="deal_name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Deal Name *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="company_name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Company Name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="priority">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
              <form.Field name="status">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="round_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Round Type *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Seed, Series A..."
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="sector">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Sector *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Technology, Healthcare..."
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>Investment and valuation figures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="target_raise">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target Raise</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="investment_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Investment Amount</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="pre_money_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Pre-Money Valuation</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="post_money_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Post-Money Valuation</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="expected_ownership">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Expected Ownership (%)</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="other_investors">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Other Investors</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <form.Field name="is_lead_investor">
              {(field) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={field.name}>Lead Investor</Label>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates</CardTitle>
            <CardDescription>Key timeline dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="first_contact_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>First Contact Date</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="last_interaction_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Last Interaction Date</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="next_meeting_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Next Meeting Date</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="expected_close_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Expected Close Date</Label>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Analysis</CardTitle>
            <CardDescription>Investment analysis and notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form.Field name="investment_thesis">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Investment Thesis</Label>
                  <Textarea
                    id={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="key_risks">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Key Risks</Label>
                  <Textarea
                    id={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="due_diligence_notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Due Diligence Notes</Label>
                  <Textarea
                    id={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="next_steps">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Next Steps</Label>
                  <Textarea
                    id={field.name}
                    rows={2}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="rejection_reason">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Rejection Reason</Label>
                  <Textarea
                    id={field.name}
                    rows={2}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="notes">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Notes</Label>
                  <Textarea
                    id={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-2">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Deal Pipeline'
            )}
          </Button>
          <Link href="/deal-pipeline">
            <Button type="button" variant="outline" disabled={form.state.isSubmitting}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
