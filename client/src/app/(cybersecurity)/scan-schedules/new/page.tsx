'use client';

/**
 * Create Scan Schedule Page
 *
 * Form for creating a new scan schedule (recurring automated scans).
 * Uses @tanstack/react-form with Zod validation.
 *
 * Backend: POST /cybersecurity/scan-schedules/
 */

import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useScanSchedules } from '@/modules/cybersecurity/hooks/execution/use-scan-schedules';
import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useScanTemplates } from '@/modules/cybersecurity/hooks/execution/use-scan-templates';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateScanScheduleSchema } from '@/modules/cybersecurity/schemas/execution/scan-schedules.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/modules/shadcnui/components/ui/command';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

export default function CreateScanSchedulePage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { createScanSchedule, error: storeError } = useScanSchedules();
  const { scanTargets, fetchScanTargets } = useScanTargets();
  const { scanTemplates, fetchScanTemplates } = useScanTemplates();

  // Open state for the inline FK pickers (Popover + Command pattern — finpy convention).
  const [targetOpen, setTargetOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  // Load the entities the FK pickers select from (providers don't auto-fetch).
  useEffect(() => {
    if (activeOrganization) {
      fetchScanTargets();
      fetchScanTemplates();
    }
  }, [activeOrganization]);

  const form = useForm({
    defaultValues: {
      target_id: 0,
      template_id: 0,
      name: '',
      frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
      cron_expression: '' as string | null,
      is_active: true,
    },
    onSubmit: async ({ value }) => {
      // Build payload — convert empty cron_expression to null
      const payload = {
        ...value,
        cron_expression: value.cron_expression || null,
      };

      // Validate with Zod
      const validation = CreateScanScheduleSchema.safeParse(payload);

      if (!validation.success) {
        return;
      }

      const success = await createScanSchedule(payload as Parameters<typeof createScanSchedule>[0]);

      if (success) {
        router.push('/scan-schedules');
      }
      // Error is handled by store and displayed via storeError
    },
  });

  if (!activeOrganization) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            Please select an organization first.{' '}
            <Link href="/organizations" className="underline">
              Go to Organizations
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/scan-schedules">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Schedules
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Scan Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Schedule recurring automated scans for {activeOrganization.name}
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
      >
        {/* Schedule Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Schedule Info</CardTitle>
            <CardDescription>
              Name and target configuration for this schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Name */}
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Weekly API Scan"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Target — pick by name (inline Popover + Command, finpy pattern) */}
              <form.Field name="target_id">
                {(field) => {
                  const selectedName = field.state.value
                    ? (scanTargets.find((t) => t.id === field.state.value)?.name || `Target #${field.state.value}`)
                    : null;
                  return (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Target *</Label>
                      <Popover open={targetOpen} onOpenChange={setTargetOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={targetOpen}
                            className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                            {selectedName || 'Select a scan target'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search targets..." />
                            <CommandList>
                              <CommandEmpty className="py-3 px-2 text-sm">
                                No scan targets yet.{' '}
                                <Link href="/scan-targets/new" className="underline">Create one</Link>
                              </CommandEmpty>
                              <CommandGroup>
                                {scanTargets.map((t) => (
                                  <CommandItem key={t.id} value={t.name}
                                    onSelect={() => { field.handleChange(t.id); setTargetOpen(false); }}>
                                    <span className="truncate">{t.name}</span>
                                    {field.state.value === t.id && <Check className="ml-auto h-4 w-4" />}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                }}
              </form.Field>

              {/* Template — pick by name (inline Popover + Command, finpy pattern) */}
              <form.Field name="template_id">
                {(field) => {
                  const selectedName = field.state.value
                    ? (scanTemplates.find((t) => t.id === field.state.value)?.name || `Template #${field.state.value}`)
                    : null;
                  return (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Template *</Label>
                      <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={templateOpen}
                            className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                            {selectedName || 'Select a scan template'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search templates..." />
                            <CommandList>
                              <CommandEmpty className="py-3 px-2 text-sm">
                                No scan templates yet.{' '}
                                <Link href="/scan-templates/new" className="underline">Create one</Link>
                              </CommandEmpty>
                              <CommandGroup>
                                {scanTemplates.map((t) => (
                                  <CommandItem key={t.id} value={t.name}
                                    onSelect={() => { field.handleChange(t.id); setTemplateOpen(false); }}>
                                    <span className="truncate">{t.name}</span>
                                    {field.state.value === t.id && <Check className="ml-auto h-4 w-4" />}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  );
                }}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Frequency Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Frequency Settings</CardTitle>
            <CardDescription>
              How often this schedule should run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Frequency */}
              <form.Field name="frequency">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Frequency *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Cron Expression */}
              <form.Field name="cron_expression">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cron Expression</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="0 2 * * 1"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Optional — overrides frequency with a custom cron expression</p>
                  </div>
                )}
              </form.Field>

              {/* Is Active */}
              <form.Field name="is_active">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Status</Label>
                    <Select
                      value={field.state.value ? 'true' : 'false'}
                      onValueChange={(value) => field.handleChange(value === 'true')}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
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
              'Create Schedule'
            )}
          </Button>
          <Link href="/scan-schedules" className="flex-1">
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
      </form>
    </div>
  );
}
